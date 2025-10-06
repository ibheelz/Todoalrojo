const REDTRACK_API_KEY = 'UcJFVQO4KPJJa86fjkOa';
const today = new Date().toISOString().split('T')[0];
const endpoint = `https://api.redtrack.io/report?group=sub1&date_from=${today}&date_to=${today}&api_key=${REDTRACK_API_KEY}`;

async function analyzeRedtrackData() {
  const response = await fetch(endpoint);
  const data = await response.json();

  console.log('📊 REDTRACK API RESPONSE STRUCTURE:\n');

  if (data && data.length > 0) {
    const sample = data[0];
    console.log('Key fields we get from Redtrack:');
    console.log('  - sub1:', sample.sub1, '(this is what we group by - should be click ID)');
    console.log('  - publisher_alias:', sample.publisher_alias, '(campaign/publisher name)');
    console.log('  - clicks:', sample.clicks, '(number of clicks)');
    console.log('  - unique_clicks:', sample.unique_clicks, '(unique clicks)');
    console.log('  - conversions:', sample.conversions, '(total conversions)');
    console.log('  - revenue:', sample.revenue, '(total revenue)');
    console.log('  - approved:', sample.approved, '(approved conversions)');
    console.log('  - convtype2:', sample.convtype2, '(conversion type 2)');
    console.log('\n');

    console.log('📋 ALL RECORDS FOR TODAY:\n');
    data.forEach((item: any, i: number) => {
      const sub1 = item.sub1 || '(empty)';
      const hasBraces = sub1.includes('{') || sub1.includes('}');
      const isEmpty = sub1 === '(empty)';
      const isShort = sub1.length < 10;
      const isValidClickId = !isEmpty && !hasBraces && !isShort;

      console.log(`${i+1}. sub1: ${sub1}`);
      console.log(`   Valid Click ID? ${isValidClickId ? '✅ YES' : '❌ NO'}`);
      if (!isValidClickId) {
        if (isEmpty) console.log('   Reason: Empty sub1');
        if (hasBraces) console.log('   Reason: Contains macro brackets');
        if (isShort && !isEmpty) console.log('   Reason: Too short (less than 10 chars)');
      }
      console.log(`   Publisher: ${item.publisher_alias || '(none)'}`);
      console.log(`   Clicks: ${item.clicks}, Unique: ${item.unique_clicks}`);
      console.log(`   Conversions: ${item.conversions}, Revenue: $${item.revenue}`);
      console.log('');
    });

    console.log('\n📊 SUMMARY:');
    const validRecords = data.filter((item: any) => {
      const sub1 = item.sub1 || '';
      return sub1 && !sub1.includes('{') && !sub1.includes('}') && sub1.length >= 10;
    });
    console.log(`Total records: ${data.length}`);
    console.log(`Valid click IDs: ${validRecords.length}`);
    console.log(`Invalid/Macro: ${data.length - validRecords.length}`);
  }
}

analyzeRedtrackData();
