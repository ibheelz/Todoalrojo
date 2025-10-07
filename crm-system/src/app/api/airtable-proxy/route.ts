import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body || {};

    // Airtable configuration
    const AIRTABLE_BASE_ID = 'app2I0jOClbHteBNP';
    const AIRTABLE_TABLE_NAME = 'Leads';
    const AIRTABLE_API_KEY = 'patCu0mKmtp2MPQIw.a90c3234fc52abb951cdacc3725d97442bc7f364ac822eee5960ce09ce2f86cd';

    const baseEndpoint = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

    console.log('Airtable proxy request:', body);

    if (action === 'create') {
      const { payload } = body;
      const response = await fetch(baseEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Airtable response status:', response.status);

      if (!response.ok) {
        let errorData: any = {};
        try {
          const errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('Airtable error:', response.status, errorData);
        return NextResponse.json(errorData, { status: response.status });
      }

      const result = await response.json();
      console.log('Airtable success:', result);
      return NextResponse.json(result);
    }

    if (action === 'check-duplicate') {
      // Legacy: exact match Phone + Campaign
      const { phoneNumber, campaign } = body;
      const formula = `AND({Phone Number}="${phoneNumber}", {Campaign}="${campaign}")`;
      const url = `${baseEndpoint}?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('Airtable duplicate check failed', response.status);
        return NextResponse.json({ isDuplicate: false, error: 'check failed' }); // fail-open
      }

      const data = await response.json();
      return NextResponse.json({ isDuplicate: (data.records?.length || 0) > 0, count: data.records?.length || 0 });
    }

    if (action === 'check-duplicate-by-source') {
      // Legacy rule: same phone + same source, but campaign different
      const { phoneNumber, source, currentCampaign } = body;
      if (!phoneNumber || !source) {
        return NextResponse.json({ isDuplicate: false, error: 'missing phone or source' });
      }
      const formula = `AND({Phone Number}="${phoneNumber}", LOWER({Traffic Source})=LOWER("${source}"), NOT(LOWER({Campaign})=LOWER("${currentCampaign || ''}")))`;
      const url = `${baseEndpoint}?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('Airtable cross-campaign duplicate check failed', response.status);
        return NextResponse.json({ isDuplicate: false, error: 'check failed' }); // fail-open
      }

      const data = await response.json();
      const count = data.records?.length || 0;
      return NextResponse.json({ isDuplicate: count > 0, count });
    }

    if (action === 'check-duplicate-phone-source') {
      // New rule: same phone + same source (any campaign)
      // Blocks promoters from inviting same person to multiple campaigns
      const { phoneNumber, source, currentCampaign } = body;
      if (!phoneNumber || !source) {
        return NextResponse.json({ isDuplicate: false, error: 'missing phone or source' });
      }

      console.log('Checking phone + source duplicate:', { phoneNumber, source, currentCampaign });

      const formula = `AND({Phone Number}="${phoneNumber}", LOWER({Traffic Source})=LOWER("${source}"))`;
      const url = `${baseEndpoint}?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('Airtable phone + source duplicate check failed', response.status);
        return NextResponse.json({ isDuplicate: false, error: 'check failed' }); // fail-open
      }

      const data = await response.json();
      const count = data.records?.length || 0;
      const isDuplicate = count > 0;

      if (isDuplicate) {
        console.log(`Found ${count} existing records with phone ${phoneNumber} and source ${source}`);
      }

      return NextResponse.json({ isDuplicate, count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
