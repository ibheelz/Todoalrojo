/**
 * Journey Automation Test Script
 * Demonstrates the complete journey automation flow
 */

import { prisma } from './prisma';
import AcquisitionJourney from './journeys/acquisition-journey';
import RetentionJourney from './journeys/retention-journey';
import JourneyService from './journey-service';
import MessageProcessor from './messaging/message-processor';

export async function testAcquisitionJourney() {
  console.log('\n🧪 === Testing Acquisition Journey ===\n');

  // 1. Create a test customer with unique email
  const timestamp = Date.now();
  const customer = await prisma.customer.create({
    data: {
      masterEmail: `test.user.${timestamp}@example.com`,
      masterPhone: `+1234567${timestamp.toString().slice(-3)}`,
      firstName: 'Test',
      lastName: 'User',
      identifiers: {
        create: [
          {
            type: 'EMAIL',
            value: `test.user.${timestamp}@example.com`,
          },
          {
            type: 'PHONE',
            value: `+1234567${timestamp.toString().slice(-3)}`,
          },
          {
            type: 'CLICK_ID',
            value: `test-click-${timestamp}`,
          },
        ],
      },
    },
  });

  console.log(`✅ Created test customer: ${customer.id}`);

  // 2. Start acquisition journey
  const result = await AcquisitionJourney.start({
    customerId: customer.id,
    operatorId: 'test-operator-1',
    operatorName: 'Test Casino',
    customerEmail: customer.masterEmail!,
    customerPhone: customer.masterPhone!,
  });

  console.log(`\n📊 Journey Result:`, result);

  // 3. Check journey state
  const journeyState = await JourneyService.getOrCreateJourneyState({
    customerId: customer.id,
    operatorId: 'test-operator-1',
  });

  console.log(`\n🎯 Journey State:`, {
    stage: journeyState.stage,
    currentJourney: journeyState.currentJourney,
    emailCount: journeyState.emailCount,
    smsCount: journeyState.smsCount,
    messagesScheduled: result.messagesScheduled,
  });

  // 4. List scheduled messages
  const messages = await prisma.journeyMessage.findMany({
    where: { journeyStateId: journeyState.id },
    orderBy: { scheduledFor: 'asc' },
  });

  console.log(`\n📧 Scheduled Messages (${messages.length}):`);
  messages.forEach((msg, i) => {
    const daysFromNow = Math.round(
      (msg.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    console.log(
      `  ${i + 1}. Day ${msg.dayNumber} - ${msg.channel} ${msg.stepNumber} (${msg.messageType}) - scheduled in ${daysFromNow} days`
    );
  });

  return { customer, journeyState, messages };
}

export async function testRetentionJourney() {
  console.log('\n🧪 === Testing Retention Journey ===\n');

  // 1. Create a customer with deposit history
  const timestamp = Date.now();
  const customer = await prisma.customer.create({
    data: {
      masterEmail: `retention.user.${timestamp}@example.com`,
      masterPhone: `+0987654${timestamp.toString().slice(-3)}`,
      firstName: 'Retention',
      lastName: 'User',
      identifiers: {
        create: [
          {
            type: 'EMAIL',
            value: `retention.user.${timestamp}@example.com`,
          },
          {
            type: 'PHONE',
            value: `+0987654${timestamp.toString().slice(-3)}`,
          },
        ],
      },
    },
  });

  console.log(`✅ Created test customer: ${customer.id}`);

  // 2. Simulate first deposit by updating stage
  await JourneyService.updateStage({
    customerId: customer.id,
    operatorId: 'test-operator-1',
    stage: 1,
    depositAmount: 100,
  });

  console.log(`💰 Simulated first deposit of $100`);

  // 3. Start retention journey
  const result = await RetentionJourney.start({
    customerId: customer.id,
    operatorId: 'test-operator-1',
    operatorName: 'Test Casino',
    customerEmail: customer.masterEmail!,
    customerPhone: customer.masterPhone!,
    lastDepositAmount: 100,
  });

  console.log(`\n📊 Journey Result:`, result);

  // 4. List scheduled messages
  const messages = await prisma.journeyMessage.findMany({
    where: { journeyStateId: result.journeyState?.id },
    orderBy: { scheduledFor: 'asc' },
  });

  console.log(`\n📧 Scheduled Messages (${messages.length}):`);
  messages.forEach((msg, i) => {
    const daysFromNow = Math.round(
      (msg.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    console.log(
      `  ${i + 1}. Day ${msg.dayNumber} - ${msg.channel} ${msg.stepNumber} (${msg.messageType}) - scheduled in ${daysFromNow} days`
    );
  });

  return { customer, journeyState: result.journeyState, messages };
}

export async function testPostbackFlow() {
  console.log('\n🧪 === Testing Postback Flow ===\n');

  // Create customer
  const timestamp = Date.now();
  const customer = await prisma.customer.create({
    data: {
      masterEmail: `postback.user.${timestamp}@example.com`,
      identifiers: {
        create: [
          {
            type: 'EMAIL',
            value: `postback.user.${timestamp}@example.com`,
          },
          {
            type: 'CLICK_ID',
            value: `postback-test-${timestamp}`,
          },
        ],
      },
    },
  });

  console.log(`✅ Created test customer: ${customer.id}`);

  // Test 1: Registration postback
  console.log(`\n1️⃣  Testing REGISTRATION postback...`);
  await JourneyService.updateStage({
    customerId: customer.id,
    operatorId: 'test-operator-1',
    stage: 0,
  });

  let state = await JourneyService.getOrCreateJourneyState({
    customerId: customer.id,
    operatorId: 'test-operator-1',
  });

  console.log(`   Stage: ${state.stage}, Journey: ${state.currentJourney}`);

  // Test 2: First deposit postback
  console.log(`\n2️⃣  Testing FIRST_DEPOSIT postback...`);
  await JourneyService.updateStage({
    customerId: customer.id,
    operatorId: 'test-operator-1',
    stage: 1,
    depositAmount: 50,
  });

  state = await JourneyService.getOrCreateJourneyState({
    customerId: customer.id,
    operatorId: 'test-operator-1',
  });

  console.log(`   Stage: ${state.stage}, Journey: ${state.currentJourney}, Deposits: ${state.depositCount}`);

  // Test 3: Second deposit postback
  console.log(`\n3️⃣  Testing second DEPOSIT postback...`);
  await JourneyService.updateStage({
    customerId: customer.id,
    operatorId: 'test-operator-1',
    stage: 2,
    depositAmount: 100,
  });

  state = await JourneyService.getOrCreateJourneyState({
    customerId: customer.id,
    operatorId: 'test-operator-1',
  });

  console.log(`   Stage: ${state.stage}, Journey: ${state.currentJourney}, Deposits: ${state.depositCount}`);

  // Test 4: Third deposit - should stop journey
  console.log(`\n4️⃣  Testing third DEPOSIT postback (should stop journey)...`);
  await JourneyService.updateStage({
    customerId: customer.id,
    operatorId: 'test-operator-1',
    stage: 3,
    depositAmount: 200,
  });

  state = await JourneyService.getOrCreateJourneyState({
    customerId: customer.id,
    operatorId: 'test-operator-1',
  });

  console.log(`   Stage: ${state.stage}, Journey: ${state.currentJourney} (should be 'stopped')`);

  return { customer, state };
}

export async function testFrequencyCaps() {
  console.log('\n🧪 === Testing Frequency Caps ===\n');

  const timestamp = Date.now();
  const customer = await prisma.customer.create({
    data: {
      masterEmail: `frequency.test.${timestamp}@example.com`,
      masterPhone: `+1111${timestamp.toString().slice(-6)}`,
      identifiers: {
        create: [
          {
            type: 'EMAIL',
            value: `frequency.test.${timestamp}@example.com`,
          },
        ],
      },
    },
  });

  const journeyState = await JourneyService.getOrCreateJourneyState({
    customerId: customer.id,
    operatorId: 'test-operator-1',
  });

  // Try to schedule multiple emails quickly
  console.log(`📧 Attempting to schedule Email 1...`);
  const msg1 = await JourneyService.scheduleMessage({
    journeyStateId: journeyState.id,
    messageType: 'WELCOME',
    channel: 'EMAIL',
    journeyType: 'ACQUISITION',
    dayNumber: 0,
    stepNumber: 1,
    subject: 'Test 1',
    content: 'Test content 1',
    scheduledFor: new Date(),
  });
  console.log(`✅ Email 1 scheduled`);

  // Mark it as sent
  await JourneyService.markMessageSent(msg1.id);
  console.log(`✅ Email 1 marked as sent`);

  // Try to send another email immediately (should fail - max 1 per day)
  console.log(`\n📧 Attempting to schedule Email 2 immediately (should fail)...`);
  try {
    await JourneyService.scheduleMessage({
      journeyStateId: journeyState.id,
      messageType: 'SOCIAL_PROOF',
      channel: 'EMAIL',
      journeyType: 'ACQUISITION',
      dayNumber: 1,
      stepNumber: 2,
      subject: 'Test 2',
      content: 'Test content 2',
      scheduledFor: new Date(),
    });
    console.log(`❌ ERROR: Should have been blocked by frequency cap!`);
  } catch (error: any) {
    console.log(`✅ Correctly blocked: ${error.message}`);
  }

  // Try after setting scheduled date to tomorrow
  console.log(`\n📧 Attempting to schedule Email 2 for tomorrow...`);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const msg2 = await JourneyService.scheduleMessage({
    journeyStateId: journeyState.id,
    messageType: 'SOCIAL_PROOF',
    channel: 'EMAIL',
    journeyType: 'ACQUISITION',
    dayNumber: 1,
    stepNumber: 2,
    subject: 'Test 2',
    content: 'Test content 2',
    scheduledFor: tomorrow,
  });
  console.log(`✅ Email 2 scheduled for tomorrow`);

  return { customer, journeyState };
}

export async function runAllTests() {
  console.log('\n🚀 === Running All Journey Automation Tests ===\n');

  try {
    await testAcquisitionJourney();
    await testRetentionJourney();
    await testPostbackFlow();
    await testFrequencyCaps();

    console.log('\n✅ === All Tests Completed Successfully ===\n');

    // Get stats
    const stats = await JourneyService.getJourneyStats();
    console.log('📊 Journey Stats:', stats);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}
