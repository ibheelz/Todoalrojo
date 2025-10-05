import { prisma } from './prisma';

export class MockDataSeeder {
  static async seedAll() {
    console.log('🌱 Starting comprehensive mock data seeding...');

    try {
      // 1. Create Operators (Brands)
      const operators = await this.seedOperators();
      console.log(`✅ Created ${operators.length} operators`);

      // 2. Create Influencers
      const influencers = await this.seedInfluencers();
      console.log(`✅ Created ${influencers.length} influencers`);

      // 3. Create Campaigns
      const campaigns = await this.seedCampaigns(influencers);
      console.log(`✅ Created ${campaigns.length} campaigns`);

      // 4. Create Customers
      const customers = await this.seedCustomers();
      console.log(`✅ Created ${customers.length} customers`);

      // 5. Create Clicks, Leads, Events
      await this.seedCustomerActivity(customers, campaigns, influencers, operators);
      console.log(`✅ Created customer activity (clicks, leads, events)`);

      // 6. Create Journey States
      await this.seedJourneyStates(customers, operators);
      console.log(`✅ Created journey states`);

      // 7. Create Message Templates
      await this.seedMessageTemplates(operators);
      console.log(`✅ Created message templates`);

      // 8. Create Journey Messages
      await this.seedJourneyMessages();
      console.log(`✅ Created journey messages`);

      // 9. Create Operator Postbacks
      await this.seedOperatorPostbacks(customers, operators);
      console.log(`✅ Created operator postbacks`);

      console.log('🎉 Mock data seeding completed successfully!');

      return {
        operators,
        influencers,
        campaigns,
        customers
      };
    } catch (error) {
      console.error('❌ Error seeding mock data:', error);
      throw error;
    }
  }

  static async seedOperators() {
    const operators = [
      {
        clientId: 'default-client',
        name: 'Roobet',
        slug: 'roobet',
        brand: 'Roobet Casino',
        emailDomain: 'roobet.com',
        emailFromName: 'Roobet Casino',
        emailFromAddress: 'noreply@roobet.com',
        logoUrl: 'https://roobet.com/logo.png',
        primaryColor: '#9333ea',
        smsEnabled: true,
        smsSender: 'ROOBET',
        smsProvider: 'laaffic',
        status: 'ACTIVE',
        totalLeads: 450,
        totalRegistrations: 320,
        totalFTD: 180,
        totalRevenue: 125000,
        regRate: 0.7111,
        ftdRate: 0.5625
      },
      {
        clientId: 'default-client',
        name: 'Rushbet',
        slug: 'rushbet',
        brand: 'Rushbet Peru',
        emailDomain: 'rushbet.pe',
        emailFromName: 'Rushbet Peru',
        emailFromAddress: 'noreply@rushbet.pe',
        logoUrl: 'https://rushbet.pe/logo.png',
        primaryColor: '#ef4444',
        smsEnabled: true,
        smsSender: 'RUSHBET',
        smsProvider: 'laaffic',
        status: 'ACTIVE',
        totalLeads: 380,
        totalRegistrations: 280,
        totalFTD: 145,
        totalRevenue: 98000,
        regRate: 0.7368,
        ftdRate: 0.5179
      },
      {
        clientId: 'default-client',
        name: 'Stake',
        slug: 'stake',
        brand: 'Stake.com',
        emailDomain: 'stake.com',
        emailFromName: 'Stake Casino',
        emailFromAddress: 'noreply@stake.com',
        logoUrl: 'https://stake.com/logo.png',
        primaryColor: '#10b981',
        smsEnabled: true,
        smsSender: 'STAKE',
        smsProvider: 'laaffic',
        status: 'ACTIVE',
        totalLeads: 520,
        totalRegistrations: 390,
        totalFTD: 210,
        totalRevenue: 156000,
        regRate: 0.7500,
        ftdRate: 0.5385
      }
    ];

    // Create client first
    await prisma.client.upsert({
      where: { id: 'default-client' },
      update: {},
      create: {
        id: 'default-client',
        name: 'Default Client',
        slug: 'default',
        email: 'client@todoalrojo.com',
        isActive: true,
        canViewReports: true,
        canExportData: true,
        canViewAnalytics: true
      }
    });

    const createdOperators = [];
    for (const op of operators) {
      const created = await prisma.operator.upsert({
        where: { slug: op.slug },
        update: op,
        create: op
      });
      createdOperators.push(created);
    }

    return createdOperators;
  }

  static async seedInfluencers() {
    const influencers = [
      {
        name: 'Carlos Gaming',
        email: 'carlos@gaming.com',
        phone: '+51987654321',
        socialHandle: '@carlosgaming',
        platform: 'YouTube',
        followers: 250000,
        engagementRate: 5.8,
        category: 'Gaming',
        location: 'Lima, Peru',
        status: 'active',
        totalLeads: 180,
        totalClicks: 3500,
        totalRegs: 120,
        totalFtd: 65,
        commissionRate: 0.35
      },
      {
        name: 'Maria Streamer',
        email: 'maria@streamer.com',
        phone: '+51987654322',
        socialHandle: '@mariastreams',
        platform: 'Twitch',
        followers: 180000,
        engagementRate: 7.2,
        category: 'Casino Streaming',
        location: 'Arequipa, Peru',
        status: 'active',
        totalLeads: 145,
        totalClicks: 2800,
        totalRegs: 98,
        totalFtd: 52,
        commissionRate: 0.40
      },
      {
        name: 'JuanBets',
        email: 'juan@bets.com',
        phone: '+51987654323',
        socialHandle: '@juanbets',
        platform: 'Instagram',
        followers: 95000,
        engagementRate: 6.5,
        category: 'Sports Betting',
        location: 'Cusco, Peru',
        status: 'active',
        totalLeads: 92,
        totalClicks: 1850,
        totalRegs: 67,
        totalFtd: 38,
        commissionRate: 0.30
      },
      {
        name: 'LuckyLisa',
        email: 'lisa@lucky.com',
        phone: '+51987654324',
        socialHandle: '@luckylisa',
        platform: 'TikTok',
        followers: 320000,
        engagementRate: 9.1,
        category: 'Lifestyle',
        location: 'Trujillo, Peru',
        status: 'active',
        totalLeads: 220,
        totalClicks: 4200,
        totalRegs: 155,
        totalFtd: 82,
        commissionRate: 0.38
      },
      {
        name: 'ProGamerPeru',
        email: 'pro@gamer.pe',
        phone: '+51987654325',
        socialHandle: '@progamerperu',
        platform: 'YouTube',
        followers: 420000,
        engagementRate: 5.3,
        category: 'Gaming',
        location: 'Lima, Peru',
        status: 'paused',
        totalLeads: 310,
        totalClicks: 5800,
        totalRegs: 215,
        totalFtd: 118,
        commissionRate: 0.42
      }
    ];

    const createdInfluencers = [];
    for (const inf of influencers) {
      const created = await prisma.influencer.create({
        data: inf
      });
      createdInfluencers.push(created);
    }

    return createdInfluencers;
  }

  static async seedCampaigns(influencers: any[]) {
    const campaigns = [
      {
        name: 'Summer Bonus 2024',
        slug: 'summer-bonus-2024',
        description: 'Get 100% bonus up to $1000 on first deposit',
        brandId: 'roobet',
        isActive: true,
        totalClicks: 2500,
        totalLeads: 450,
        totalEvents: 320,
        totalRevenue: 125000,
        registrations: 320,
        ftd: 180,
        conversionRate: 0.128
      },
      {
        name: 'Peru Launch Special',
        slug: 'peru-launch',
        description: 'Exclusive Peru launch offer',
        brandId: 'rushbet',
        isActive: true,
        totalClicks: 1980,
        totalLeads: 380,
        totalEvents: 280,
        totalRevenue: 98000,
        registrations: 280,
        ftd: 145,
        conversionRate: 0.073
      },
      {
        name: 'VIP Reload Bonus',
        slug: 'vip-reload',
        description: '50% reload bonus for VIP players',
        brandId: 'stake',
        isActive: true,
        totalClicks: 3200,
        totalLeads: 520,
        totalEvents: 390,
        totalRevenue: 156000,
        registrations: 390,
        ftd: 210,
        conversionRate: 0.066
      },
      {
        name: 'Black Friday Mega Deal',
        slug: 'black-friday-2024',
        description: '200% bonus + 100 free spins',
        brandId: 'roobet',
        isActive: true,
        totalClicks: 1850,
        totalLeads: 310,
        totalEvents: 220,
        totalRevenue: 87000,
        registrations: 220,
        ftd: 125,
        conversionRate: 0.068
      },
      {
        name: 'Sports Betting Championship',
        slug: 'sports-championship',
        description: 'Bet on your favorite teams',
        brandId: 'rushbet',
        isActive: false,
        totalClicks: 950,
        totalLeads: 145,
        totalEvents: 98,
        totalRevenue: 42000,
        registrations: 98,
        ftd: 52,
        conversionRate: 0.055
      }
    ];

    const createdCampaigns = [];
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      const created = await prisma.campaign.upsert({
        where: { slug: campaign.slug },
        update: campaign,
        create: campaign
      });

      // Assign influencers to campaigns
      const influencersToAssign = influencers.slice(0, Math.min(3, influencers.length));
      for (const influencer of influencersToAssign) {
        await prisma.campaignInfluencer.upsert({
          where: {
            campaignId_influencerId: {
              campaignId: created.id,
              influencerId: influencer.id
            }
          },
          update: {},
          create: {
            campaignId: created.id,
            influencerId: influencer.id,
            isActive: true
          }
        });
      }

      createdCampaigns.push(created);
    }

    return createdCampaigns;
  }

  static async seedCustomers() {
    const firstNames = ['Carlos', 'Maria', 'Juan', 'Ana', 'Pedro', 'Sofia', 'Diego', 'Valentina', 'Miguel', 'Isabella', 'Luis', 'Camila', 'Fernando', 'Lucia', 'Roberto'];
    const lastNames = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz'];
    const cities = ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Huancayo', 'Tacna', 'Ayacucho'];

    const customers = [];
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const phone = `+5198765${String(4000 + i).padStart(4, '0')}`;
      const city = cities[Math.floor(Math.random() * cities.length)];

      const customer = await prisma.customer.create({
        data: {
          masterEmail: email,
          masterPhone: phone,
          firstName,
          lastName,
          country: 'Peru',
          city,
          source: ['google', 'facebook', 'instagram', 'youtube', 'tiktok'][Math.floor(Math.random() * 5)],
          totalClicks: Math.floor(Math.random() * 10),
          totalLeads: Math.floor(Math.random() * 5),
          totalEvents: Math.floor(Math.random() * 8),
          totalRevenue: Math.random() * 5000,
          isActive: true,
          identifiers: {
            create: [
              {
                type: 'EMAIL',
                value: email,
                isVerified: true,
                isPrimary: true
              },
              {
                type: 'PHONE',
                value: phone,
                isVerified: true,
                isPrimary: false
              }
            ]
          }
        }
      });

      customers.push(customer);
    }

    return customers;
  }

  static async seedCustomerActivity(customers: any[], campaigns: any[], influencers: any[], operators: any[]) {
    for (let i = 0; i < Math.min(30, customers.length); i++) {
      const customer = customers[i];
      const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
      const influencer = influencers[Math.floor(Math.random() * influencers.length)];

      // Create click
      await prisma.click.create({
        data: {
          customerId: customer.id,
          clickId: `click_${Date.now()}_${i}`,
          campaign: campaign.slug,
          source: customer.source,
          medium: 'cpc',
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          landingPage: `https://${campaign.brandId}.com/landing`,
          country: 'Peru',
          city: customer.city,
          isMobile: Math.random() > 0.5,
          isDesktop: Math.random() > 0.5
        }
      });

      // Create lead (70% of clicks)
      if (Math.random() > 0.3) {
        await prisma.lead.create({
          data: {
            customerId: customer.id,
            email: customer.masterEmail,
            phone: customer.masterPhone,
            firstName: customer.firstName,
            lastName: customer.lastName,
            campaign: campaign.slug,
            source: customer.source,
            ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            landingPage: `https://${campaign.brandId}.com/landing`,
            country: 'Peru',
            city: customer.city,
            isEmailValid: true,
            isPhoneValid: true,
            qualityScore: Math.floor(Math.random() * 100),
            brandId: campaign.brandId,
            value: Math.random() * 100
          }
        });

        // Create registration event (80% of leads)
        if (Math.random() > 0.2) {
          await prisma.event.create({
            data: {
              customerId: customer.id,
              eventType: 'registration',
              eventName: 'User Registration',
              category: 'conversion',
              campaign: campaign.slug,
              source: customer.source,
              brandId: campaign.brandId,
              isConverted: true,
              value: 0
            }
          });

          // Create deposit event (50% of registrations)
          if (Math.random() > 0.5) {
            const depositAmount = 50 + Math.random() * 450;
            await prisma.event.create({
              data: {
                customerId: customer.id,
                eventType: 'deposit',
                eventName: 'First Deposit',
                category: 'revenue',
                campaign: campaign.slug,
                source: customer.source,
                brandId: campaign.brandId,
                isConverted: true,
                isRevenue: true,
                value: depositAmount,
                currency: 'USD'
              }
            });
          }
        }
      }
    }
  }

  static async seedJourneyStates(customers: any[], operators: any[]) {
    for (let i = 0; i < Math.min(30, customers.length); i++) {
      const customer = customers[i];
      const operator = operators[Math.floor(Math.random() * operators.length)];

      const stages = [-1, 0, 1, 2, 3];
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const depositCount = Math.max(0, stage);
      const totalDepositValue = depositCount > 0 ? depositCount * (100 + Math.random() * 400) : 0;

      await prisma.customerJourneyState.create({
        data: {
          customerId: customer.id,
          operatorId: operator.id,
          stage,
          depositCount,
          totalDepositValue,
          lastDepositAt: depositCount > 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          emailCount: Math.floor(Math.random() * 5),
          smsCount: Math.floor(Math.random() * 3),
          lastEmailAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          lastSmsAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          currentJourney: stage < 1 ? 'ACQUISITION' : 'RETENTION',
          journeyStartedAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  static async seedMessageTemplates(operators: any[]) {
    const templates = [
      // Acquisition templates
      { journeyType: 'ACQUISITION', messageType: 'WELCOME', dayNumber: 0, channel: 'EMAIL', subject: 'Welcome to {brandName}! 🎉', content: 'Hi {firstName}! Welcome to {brandName}. We\'re excited to have you here. Claim your welcome bonus now!', ctaText: 'Claim Bonus', ctaLink: 'https://example.com/bonus' },
      { journeyType: 'ACQUISITION', messageType: 'WELCOME', dayNumber: 0, channel: 'SMS', subject: null, content: 'Welcome {firstName}! Start playing at {brandName} and get your bonus. Click: {link}', ctaText: 'Start Playing', ctaLink: 'https://example.com/start' },
      { journeyType: 'ACQUISITION', messageType: 'BONUS_REMINDER', dayNumber: 1, channel: 'EMAIL', subject: 'Don\'t forget your bonus! 💰', content: 'Hi {firstName}, your welcome bonus is waiting! Make your first deposit now.', ctaText: 'Deposit Now', ctaLink: 'https://example.com/deposit' },
      { journeyType: 'ACQUISITION', messageType: 'SOCIAL_PROOF', dayNumber: 3, channel: 'EMAIL', subject: 'Join 10,000+ winners! 🏆', content: 'Hi {firstName}, thousands of players are winning at {brandName} every day. Don\'t miss out!', ctaText: 'Join Now', ctaLink: 'https://example.com/join' },
      { journeyType: 'ACQUISITION', messageType: 'URGENCY', dayNumber: 5, channel: 'SMS', subject: null, content: '{firstName}, your bonus expires in 24h! Deposit now: {link}', ctaText: 'Deposit', ctaLink: 'https://example.com/deposit' },
      { journeyType: 'ACQUISITION', messageType: 'FINAL_NUDGE', dayNumber: 7, channel: 'EMAIL', subject: 'Last chance for your bonus! ⏰', content: 'Hi {firstName}, this is your final reminder. Your exclusive bonus expires today!', ctaText: 'Claim Now', ctaLink: 'https://example.com/claim' },

      // Retention templates
      { journeyType: 'RETENTION', messageType: 'RELOAD', dayNumber: 0, channel: 'EMAIL', subject: 'Get 50% reload bonus! 🎁', content: 'Welcome back {firstName}! Enjoy a 50% reload bonus on your next deposit.', ctaText: 'Reload Now', ctaLink: 'https://example.com/reload' },
      { journeyType: 'RETENTION', messageType: 'VIP_OFFER', dayNumber: 3, channel: 'EMAIL', subject: 'Exclusive VIP offer just for you! ⭐', content: 'Hi {firstName}, as a valued player, here\'s an exclusive VIP bonus.', ctaText: 'View Offer', ctaLink: 'https://example.com/vip' },
      { journeyType: 'RETENTION', messageType: 'SOCIAL_PROOF', dayNumber: 7, channel: 'EMAIL', subject: 'Your friends are playing! 🎮', content: 'Hi {firstName}, don\'t miss the action. Join your friends at {brandName}!', ctaText: 'Play Now', ctaLink: 'https://example.com/play' },
    ];

    for (const operator of operators) {
      for (const template of templates) {
        await prisma.messageTemplate.create({
          data: {
            operatorId: operator.id,
            journeyType: template.journeyType as any,
            messageType: template.messageType as any,
            dayNumber: template.dayNumber,
            channel: template.channel as any,
            subject: template.subject,
            content: template.content,
            ctaText: template.ctaText,
            ctaLink: template.ctaLink,
            isActive: true
          }
        });
      }
    }
  }

  static async seedJourneyMessages() {
    const journeyStates = await prisma.customerJourneyState.findMany({
      take: 20,
      include: {
        customer: true
      }
    });

    const messageTypes = ['WELCOME', 'BONUS_REMINDER', 'SOCIAL_PROOF', 'URGENCY', 'FINAL_NUDGE', 'RELOAD', 'VIP_OFFER'];
    const channels = ['EMAIL', 'SMS'];
    const statuses = ['PENDING', 'SENT', 'DELIVERED', 'FAILED'];

    for (let i = 0; i < journeyStates.length; i++) {
      const state = journeyStates[i];
      const numMessages = 1 + Math.floor(Math.random() * 4);

      for (let j = 0; j < numMessages; j++) {
        const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const dayNumber = j;
        const scheduledDate = new Date(Date.now() + (j - 2) * 24 * 60 * 60 * 1000);

        await prisma.journeyMessage.create({
          data: {
            journeyStateId: state.id,
            messageType: messageType as any,
            channel: channel as any,
            journeyType: state.currentJourney as any,
            dayNumber,
            stepNumber: j + 1,
            subject: channel === 'EMAIL' ? `Test Subject for ${messageType}` : null,
            content: `Hi ${state.customer.firstName}, this is a test ${messageType} message for ${state.currentJourney} journey!`,
            scheduledFor: scheduledDate,
            sentAt: status !== 'PENDING' ? new Date(scheduledDate.getTime() + 60000) : null,
            deliveredAt: status === 'DELIVERED' ? new Date(scheduledDate.getTime() + 120000) : null,
            status: status as any,
            errorMessage: status === 'FAILED' ? 'Invalid email address' : null,
            providerId: status !== 'PENDING' ? `msg_${Date.now()}_${i}_${j}` : null,
            providerName: channel === 'EMAIL' ? 'postmark' : 'laaffic'
          }
        });
      }
    }
  }

  static async seedOperatorPostbacks(customers: any[], operators: any[]) {
    for (let i = 0; i < Math.min(15, customers.length); i++) {
      const customer = customers[i];
      const operator = operators[Math.floor(Math.random() * operators.length)];

      // Registration postback
      await prisma.operatorPostback.create({
        data: {
          customerId: customer.id,
          operatorId: operator.id,
          eventType: 'REGISTRATION',
          clickId: `click_${Date.now()}_${i}`,
          email: customer.masterEmail,
          phone: customer.masterPhone,
          userId: `user_${operator.slug}_${i}`,
          rawPayload: {
            event: 'registration',
            timestamp: new Date().toISOString(),
            operator: operator.slug
          },
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          processedAt: new Date()
        }
      });

      // Deposit postback (50% chance)
      if (Math.random() > 0.5) {
        const depositAmount = 50 + Math.random() * 450;
        await prisma.operatorPostback.create({
          data: {
            customerId: customer.id,
            operatorId: operator.id,
            eventType: 'FIRST_DEPOSIT',
            clickId: `click_${Date.now()}_${i}`,
            email: customer.masterEmail,
            phone: customer.masterPhone,
            userId: `user_${operator.slug}_${i}`,
            depositAmount,
            currency: 'USD',
            rawPayload: {
              event: 'first_deposit',
              amount: depositAmount,
              timestamp: new Date().toISOString(),
              operator: operator.slug
            },
            ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            processedAt: new Date()
          }
        });
      }
    }
  }

  static async clearAll() {
    console.log('🗑️  Clearing all mock data...');

    await prisma.journeyMessage.deleteMany({});
    await prisma.messageTemplate.deleteMany({});
    await prisma.operatorPostback.deleteMany({});
    await prisma.customerJourneyState.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.click.deleteMany({});
    await prisma.identifier.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.campaignInfluencer.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.influencer.deleteMany({});
    await prisma.operator.deleteMany({});

    console.log('✅ All mock data cleared');
  }
}
