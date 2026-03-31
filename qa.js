const pages = [
  { url: '/admin/marketing/facebook', expected: 'Facebook' },
  { url: '/admin/marketing/google-ads', expected: 'Google Ads' },
  { url: '/admin/marketing/google-business', expected: 'Google Business' },
  { url: '/admin/marketing/email-outreach', expected: 'Email' },
  { url: '/admin/marketing/linkedin', expected: 'LinkedIn' },
  { url: '/admin/system', expected: 'System' }
];

async function runQA() {
  console.log("Starting Live QA on Arcan Painting Marketing Modules...\n");
  let allPassed = true;
  for (const page of pages) {
    try {
      const res = await fetch(`http://localhost:3001${page.url}`);
      const data = await res.text();
      const containsKeyword = data.includes(page.expected) || data.includes(page.expected.toLowerCase());
      const passed = res.status === 200 && containsKeyword;
      console.log(`[QA] ${page.url} -> Status: ${res.status} | Content Match: ${containsKeyword ? 'YES' : 'NO'} | Result: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    } catch (err) {
      console.log(`[QA] ${page.url} -> Error: ${err.message}`);
      allPassed = false;
    }
  }
  console.log(`\nQA Complete. Overall Status: ${allPassed ? 'PASS' : 'FAIL'}`);
}

runQA();
