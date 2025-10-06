import { PrismaClient } from '@prisma/client';

const prodDb = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL_PRODUCTION });

async function createProductionLink() {
  try {
    // First, create campaign if doesn't exist
    let campaign = await prodDb.campaign.findFirst({
      where: { slug: 'redtrack-test' }
    });

    if (!campaign) {
      campaign = await prodDb.campaign.create({
        data: {
          name: 'Redtrack Test Campaign',
          slug: 'redtrack-test',
          description: 'Test campaign for Redtrack integration',
          isActive: true,
          status: 'active'
        }
      });
      console.log('✅ Campaign created:', campaign.name);
    } else {
      console.log('✅ Campaign exists:', campaign.name);
    }

    // Create influencer if doesn't exist
    let influencer = await prodDb.influencer.findFirst({
      where: { email: 'test@influencer.com' }
    });

    if (!influencer) {
      influencer = await prodDb.influencer.create({
        data: {
          name: 'Test Influencer',
          email: 'test@influencer.com',
          socialHandle: '@testinfluencer',
          platform: 'instagram',
          status: 'active'
        }
      });
      console.log('✅ Influencer created:', influencer.name);
    } else {
      console.log('✅ Influencer exists:', influencer.name);
    }

    // Create the short link
    const link = await prodDb.shortLink.create({
      data: {
        shortCode: 'ggbet1',
        originalUrl: 'https://ggbetbestoffer.com/l/68d268a4acf1578e4f091ec2',
        title: 'GGBet Redtrack Link',
        campaign: campaign.slug,
        source: 'redtrack',
        medium: 'redirect',
        isActive: true,
        trackClicks: true,
        linkInfluencers: {
          create: {
            influencerId: influencer.id
          }
        }
      }
    });

    console.log('\n🎉 Production link created successfully!');
    console.log('Short Code:', link.shortCode);
    console.log('Campaign:', campaign.name);
    console.log('Influencer:', influencer.name);
    console.log('Destination:', link.originalUrl);
    console.log('\n📋 Use this URL in Redtrack:');
    console.log(`https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/l/${link.shortCode}?clickid={clickid}&sub1={sub_id_1}&sub2={sub_id_2}&sub3={sub_id_3}&sub4={sub_id_4}&sub5={sub_id_5}&rt_campaign={rt_campaign}&rt_source={rt_source}&rt_medium={rt_medium}&country={country}&city={city}&region={region}&ip={ip}&os={os}&browser={browser}&brand={brand}&model={model}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prodDb.$disconnect();
  }
}

createProductionLink();
