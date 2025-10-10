// Airtable proxy to handle CORS issues
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action } = req.body || {};

    // Airtable configuration
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'app2I0jOClbHteBNP';
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Leads';
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

    const baseEndpoint = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

    console.log('Airtable proxy request:', req.body);

    if (action === 'create') {
      const { payload } = req.body;
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
        let errorData = {};
        try {
          const errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('Airtable error:', response.status, errorData);
        return res.status(response.status).json(errorData);
      }

      const result = await response.json();
      console.log('Airtable success:', result);
      return res.status(200).json(result);
    }

    if (action === 'check-duplicate') {
      // Legacy: exact match Phone + Campaign
      const { phoneNumber, campaign } = req.body;
      const formula = `AND({Phone Number}=\"${phoneNumber}\", {Campaign}=\"${campaign}\")`;
      const url = `${baseEndpoint}?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('Airtable duplicate check failed', response.status);
        return res.status(200).json({ isDuplicate: false, error: 'check failed' }); // fail-open
      }

      const data = await response.json();
      return res.status(200).json({ isDuplicate: (data.records?.length || 0) > 0, count: data.records?.length || 0 });
    }

    if (action === 'check-duplicate-by-source') {
      // Legacy rule: same phone + same source, but campaign different
      const { phoneNumber, source, currentCampaign } = req.body;
      if (!phoneNumber || !source) {
        return res.status(200).json({ isDuplicate: false, error: 'missing phone or source' });
      }
      const formula = `AND({Phone Number}=\"${phoneNumber}\", LOWER({Traffic Source})=LOWER(\"${source}\"), NOT(LOWER({Campaign})=LOWER(\"${currentCampaign || ''}\")))`;
      const url = `${baseEndpoint}?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('Airtable cross-campaign duplicate check failed', response.status);
        return res.status(200).json({ isDuplicate: false, error: 'check failed' }); // fail-open
      }

      const data = await response.json();
      const count = data.records?.length || 0;
      return res.status(200).json({ isDuplicate: count > 0, count });
    }

    if (action === 'check-duplicate-phone-source') {
      // New rule: same phone + same source (any campaign)
      // Blocks promoters from inviting same person to multiple campaigns
      const { phoneNumber, source, currentCampaign } = req.body;
      if (!phoneNumber || !source) {
        return res.status(200).json({ isDuplicate: false, error: 'missing phone or source' });
      }

      console.log('Checking phone + source duplicate:', { phoneNumber, source, currentCampaign });

      const formula = `AND({Phone Number}=\"${phoneNumber}\", LOWER({Traffic Source})=LOWER(\"${source}\"))`;
      const url = `${baseEndpoint}?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('Airtable phone + source duplicate check failed', response.status);
        return res.status(200).json({ isDuplicate: false, error: 'check failed' }); // fail-open
      }

      const data = await response.json();
      const count = data.records?.length || 0;
      const isDuplicate = count > 0;

      if (isDuplicate) {
        console.log(`Found ${count} existing records with phone ${phoneNumber} and source ${source}`);
      }

      return res.status(200).json({ isDuplicate, count });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
