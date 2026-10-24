import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

test('retires an installed root CRM worker and only its named caches',async({browser,request,baseURL})=>{
 let legacy=true;
 const neutralizer=readFileSync('public/sw.js','utf8');
 const helper=readFileSync('src/utils/retireLegacyWorker.js','utf8');
 const server=createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.url==='/sw.js'){
   res.setHeader('Content-Type','application/javascript');
   res.end(legacy?"self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));":neutralizer);return;
  }
  if(req.url==='/retireLegacyWorker.js'){res.setHeader('Content-Type','application/javascript');res.end(helper);return;}
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><title>Synthetic migration fixture</title><p>Synthetic test only</p>${legacy?'':'<script type="module">import {retireLegacyWorker} from "/retireLegacyWorker.js";retireLegacyWorker();</script>'}`);
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw new Error('No fixture address');
 const origin=`http://127.0.0.1:${address.port}`;
 const context=await browser.newContext({serviceWorkers:'allow'});
 try {
  const page=await context.newPage();await page.goto(origin);
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js',{scope:'/'});await navigator.serviceWorker.ready;});
  await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL)).toBe(`${origin}/sw.js`);
  await page.evaluate(async()=>{for(const name of ['arcan-crm-v1','arcan-static-v1','arcan-dynamic-v1','unrelated-test-cache']){const cache=await caches.open(name);await cache.put('/synthetic-cache-test',new Response('synthetic data only'));}});
  legacy=false;await page.reload();
  await expect.poll(()=>page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
  expect(await page.evaluate(()=>caches.keys())).toEqual(['unrelated-test-cache']);
  const response=await request.get(`${baseURL}/sw.js`);expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.text()).toContain('ARCAN_CACHE_NAMES');
 } finally {await context.close();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
