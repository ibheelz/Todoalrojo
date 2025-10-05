import { NextRequest, NextResponse } from 'next/server';
import { MockDataSeeder } from '@/lib/mock-data-seeder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'clear') {
      await MockDataSeeder.clearAll();
      return NextResponse.json({
        success: true,
        message: 'All mock data cleared successfully'
      });
    }

    if (action === 'seed') {
      const result = await MockDataSeeder.seedAll();
      return NextResponse.json({
        success: true,
        message: 'Mock data seeded successfully',
        data: {
          operators: result.operators.length,
          influencers: result.influencers.length,
          campaigns: result.campaigns.length,
          customers: result.customers.length
        }
      });
    }

    if (action === 'reset') {
      await MockDataSeeder.clearAll();
      const result = await MockDataSeeder.seedAll();
      return NextResponse.json({
        success: true,
        message: 'Database reset and seeded successfully',
        data: {
          operators: result.operators.length,
          influencers: result.influencers.length,
          campaigns: result.campaigns.length,
          customers: result.customers.length
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "seed", "clear", or "reset"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in seed-mock-data:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Mock Data Seeder API',
    endpoints: {
      'POST /api/seed-mock-data': 'Seed, clear, or reset mock data',
      actions: {
        seed: 'Add mock data to database',
        clear: 'Remove all mock data',
        reset: 'Clear and re-seed all data'
      }
    }
  });
}
