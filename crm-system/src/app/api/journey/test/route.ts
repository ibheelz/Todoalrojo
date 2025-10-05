import { NextRequest, NextResponse } from 'next/server';
import * as journeyTests from '@/lib/test-journey';

/**
 * Journey Test API
 * Run automated tests for journey automation
 */

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testName = searchParams.get('test') || 'all';

    console.log(`🧪 Running journey test: ${testName}`);

    let result;

    switch (testName) {
      case 'acquisition':
        result = await journeyTests.testAcquisitionJourney();
        break;

      case 'retention':
        result = await journeyTests.testRetentionJourney();
        break;

      case 'postback':
        result = await journeyTests.testPostbackFlow();
        break;

      case 'frequency':
        result = await journeyTests.testFrequencyCaps();
        break;

      case 'all':
        await journeyTests.runAllTests();
        result = { success: true, message: 'All tests completed' };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown test: ${testName}. Available: acquisition, retention, postback, frequency, all` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      test: testName,
      result,
    });
  } catch (error: any) {
    console.error('❌ Test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}
