import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
test.use({trace:'off',screenshot:'only-on-failure'});
test('controlled synthetic enquiry reaches private intake and saves before redirect', async({page,baseURL})=>{
 test.skip(!process.env.ARCAN_STAGING_TEST_KEY,'Requires a short-lived operator-only staging credential');
 const key=process.env.ARCAN_STAGING_TEST_KEY!;
 let payload:Record<string,unknown>;
 let actualStatus=0; let actualBody:unknown;
 await page.route(`${baseURL}/api/contact`,async route=>{
  payload=route.request().postDataJSON();
  writeFileSync('/tmp/arcan-synthetic-evidence.json',JSON.stringify({submissionId:payload.submissionId}));
  const response=await route.fetch({headers:{...route.request().headers(),'x-arcan-staging-test':key}});
  actualStatus=response.status(); actualBody=await response.json();
  await route.fulfill({response});
 });
 await page.goto('/contact');
 await page.getByLabel('Your name',{exact:true}).fill('ARCAN SYNTHETIC STORAGE TEST');
 await page.getByLabel('Email address',{exact:true}).fill('synthetic@example.test');
 await page.getByLabel('Project location',{exact:true}).fill('Synthetic test location');
 await page.getByLabel('Preferred estimate date / timing (optional)',{exact:true}).fill('Synthetic preference only');
 await page.getByLabel('Tell us about your project',{exact:true}).fill('Clearly identified deployment test. Fabricated data. Do not contact.');
 const result=page.waitForResponse(r=>r.url()===`${baseURL}/api/contact`&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Send project enquiry'}).click();
 const response=await result;expect(response.status()).toBe(200);expect(actualStatus).toBe(200);expect(actualBody).toEqual({success:true,lead_saved:true});
 await expect(page).toHaveURL(`${baseURL}/thank-you`);
 const retry=await fetch(`${baseURL}/api/contact`,{method:'POST',headers:{Origin:baseURL!,'Content-Type':'application/json','x-arcan-staging-test':key},body:JSON.stringify(payload!)});
 expect(retry.status).toBe(200);expect(await retry.json()).toEqual({success:true,lead_saved:true});
 writeFileSync('/tmp/arcan-synthetic-evidence.json',JSON.stringify({submissionId:payload!.submissionId,formStatus:response.status(),duplicateRetryStatus:retry.status,thankYouUrl:page.url()}));
});
