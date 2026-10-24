// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { deliverNotifications } from './notifications.js';
function setup() {
 const db=new DatabaseSync(':memory:');
 for(const file of ['0001_enquiries.sql','0002_notification_delivery.sql']) db.exec(readFileSync(new URL(`./migrations/${file}`,import.meta.url),'utf8'));
 db.prepare('INSERT INTO enquiries VALUES (?,?,?,?,?,?,?,?,?,?)').run('test-id','2026-10-24','<script>Client</script>','test@example.test','','wallpaper','email','Toronto','Estimate next week','{}');
 db.prepare('INSERT INTO enquiry_outbox (enquiry_id,created_at) VALUES (?,?)').run('test-id','2026-10-24');
 const env = {
  NOTIFY_FROM: 'sender@example.test', NOTIFY_TO: 'team@example.test',
  EMAIL: { send: vi.fn(async () => ({ messageId: 'ack-id' })) },
  LEADS_DB: {
   prepare(sql) {
    return { bind(...args) { return {
     async all() { return { success: true, results: db.prepare(sql).all(...args) }; },
     async run() { return { success: true, meta: { changes: Number(db.prepare(sql).run(...args).changes) } }; }
    }; } };
   }
  }
 };

 return {db,env};
}
describe('durable enquiry notifications',()=>{
 it('marks accepted only after provider acknowledgement and escapes user HTML',async()=>{const{db,env}=setup();try{expect(await deliverNotifications(env,1000)).toMatchObject({accepted:1});expect(db.prepare('SELECT * FROM enquiry_outbox').get()).toMatchObject({status:'sent',provider_message_id:'ack-id',attempts:1});const email=env.EMAIL.send.mock.calls[0][0];expect(email.to).toBe(env.NOTIFY_TO);expect(email.html).not.toContain('<script>');expect(email.text).toContain('<script>Client</script>');await deliverNotifications(env,2000);expect(env.EMAIL.send).toHaveBeenCalledTimes(1);}finally{db.close();}});
 it('leaves failed sends pending with a retry delay',async()=>{const{db,env}=setup();try{env.EMAIL.send.mockRejectedValue(new Error('provider failure'));expect(await deliverNotifications(env,1000)).toMatchObject({retrying:1});expect(db.prepare('SELECT * FROM enquiry_outbox').get()).toMatchObject({status:'pending',next_attempt_at:61000,lease_until:0});await deliverNotifications(env,2000);expect(env.EMAIL.send).toHaveBeenCalledTimes(1);env.EMAIL.send.mockResolvedValue({messageId:'retried'});expect(await deliverNotifications(env,61000)).toMatchObject({accepted:1});}finally{db.close();}});
 it('does not count an empty acknowledgement as sent',async()=>{const{db,env}=setup();try{env.EMAIL.send.mockResolvedValue({});expect(await deliverNotifications(env,1000)).toMatchObject({accepted:0,retrying:1});}finally{db.close();}});
 it('skips active leases and recovers expired ones',async()=>{const{db,env}=setup();try{db.exec('UPDATE enquiry_outbox SET lease_until=5000');expect(await deliverNotifications(env,1000)).toMatchObject({accepted:0});expect(await deliverNotifications(env,5001)).toMatchObject({accepted:1});}finally{db.close();}});
 it('fails closed without a configured recipient',async()=>{const{db,env}=setup();try{env.NOTIFY_TO='';expect(await deliverNotifications(env)).toMatchObject({configured:false});expect(env.EMAIL.send).not.toHaveBeenCalled();}finally{db.close();}});
 it('claims each row once when batches overlap',async()=>{const{db,env}=setup();try{const results=await Promise.all([deliverNotifications(env,1000),deliverNotifications(env,1000)]);expect(results.reduce((n,r)=>n+r.accepted,0)).toBe(1);expect(env.EMAIL.send).toHaveBeenCalledTimes(1);}finally{db.close();}});
});

it('retains exhausted notifications for operator review without sending again', async () => {
 const {db,env}=setup(); try {
  db.exec('UPDATE enquiry_outbox SET attempts=12');
  expect(await deliverNotifications(env,1000)).toMatchObject({accepted:0,retained:1});
  expect(env.EMAIL.send).not.toHaveBeenCalled();
  expect(db.prepare('SELECT status FROM enquiry_outbox').get().status).toBe('pending');
 } finally {db.close();}
});
it('retries after provider acceptance when D1 acknowledgement fails, exposing the documented duplicate risk', async () => {
 const {db,env}=setup(); try {
  const prepare=env.LEADS_DB.prepare;
  let failAck=true;
  env.LEADS_DB.prepare=sql=> sql.includes("status = 'sent'") && failAck ? {bind:()=>({run:async()=>({success:false,meta:{changes:0}})})} : prepare(sql);
  expect(await deliverNotifications(env,1000)).toMatchObject({accepted:0,retrying:1});
  expect(db.prepare('SELECT status FROM enquiry_outbox').get().status).toBe('pending');
  failAck=false;
  expect(await deliverNotifications(env,61000)).toMatchObject({accepted:1});
  expect(env.EMAIL.send).toHaveBeenCalledTimes(2);
 } finally {db.close();}
});
it.each(['team@example.test,other@example.test','team@example.test;other@example.test','team@example.test\n'])('rejects recipient delimiters before sending: %s',async recipient=>{
 const {db,env}=setup();try{env.NOTIFY_TO=recipient;expect(await deliverNotifications(env,1000)).toMatchObject({configured:false});expect(env.EMAIL.send).not.toHaveBeenCalled();}finally{db.close();}
});
