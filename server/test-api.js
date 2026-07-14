const https = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/reports/dashboard-stats?startDate=2026-02-05&endDate=2026-02-05',
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('API Response:');
    const parsed = JSON.parse(data);
    console.log(JSON.stringify(parsed, null, 2));
    console.log('\n=== Checking for income fields ===');
    console.log('income:', parsed.income);
    console.log('prevIncome:', parsed.prevIncome);
    console.log('netProfit:', parsed.netProfit);
    console.log('prevNetProfit:', parsed.prevNetProfit);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
