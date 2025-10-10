// Lead ingestion endpoint
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log('Lead ingestion request:', req.body);

    const {
      name,
      email,
      phone,
      campaign,
      source,
      medium,
      referrer,
      landingPage,
      userAgent,
      language,
      platform,
      clickId,
      subId1,
      subId2,
      subId3,
      subId4,
      subId5,
      timestamp
    } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Airtable configuration - from environment variables
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'app2I0jOClbHteBNP';
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Leads';
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

    const baseEndpoint = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

    // Prepare Airtable record
    const airtableRecord = {
      fields: {
        'Full Name': name || '',
        'Email': email || '',
        'Phone Number': phone,
        'Campaign': campaign || '',
        'Traffic Source': source || '',
        'Medium': medium || '',
        'Referrer': referrer || '',
        'Landing Page': landingPage || '',
        'User Agent': userAgent || '',
        'Language': language || '',
        'Platform': platform || '',
        'Click ID': clickId || '',
        'Sub ID 1': subId1 || '',
        'Sub ID 2': subId2 || '',
        'Sub ID 3': subId3 || '',
        'Sub ID 4': subId4 || '',
        'Sub ID 5': subId5 || '',
        'Created At': timestamp || new Date().toISOString(),
        'Status': 'New'
      }
    };

    console.log('Creating Airtable record:', airtableRecord);

    // Send to Airtable
    const response = await fetch(baseEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableRecord)
    });

    console.log('Airtable response status:', response.status);

    if (!response.ok) {
      let errorData = {};
      try {
        const errorText = await response.text();
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Failed to parse error response' };
      }
      console.error('Airtable error:', response.status, errorData);

      return res.status(response.status).json({
        success: false,
        error: 'Failed to save lead',
        details: errorData
      });
    }

    const result = await response.json();
    console.log('Lead saved successfully:', result.id);

    return res.status(200).json({
      success: true,
      message: 'Lead submitted successfully',
      data: {
        leadId: result.id,
        recordId: result.id
      }
    });

  } catch (error) {
    console.error('Lead ingestion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};
