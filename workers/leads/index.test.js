// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from './index.js';
const input = { submissionId: '11111111-1111-4111-8111-111111111111', name: 'Example Client', email: 'example@example.test', phone: '', serviceType: 'wallpaper', preferredContact: 'email', address: 'Toronto', projectDescription: 'Wallpaper installation. Estimate next month.', attribution: { utmSource: 'search', unwanted: 'discard' } };
const request = (body = input, headers = {}) => new Request('https://arcan.example/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://arcan.example', 'X-Arcan-Client-IP': '192.0.2.1', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
function setup() {
 const db = new DatabaseSync(':memory:');
 for (const file of ['0001_enquiries.sql', '0002_notification_delivery.sql', '0003_submission_id.sql']) {
  db.exec(readFileSync(new URL(`./migrations/${file}`, import.meta.url), 'utf8'));
 }
 const binding = { prepare: sql => ({ bind: (...args) => ({ sql, args, async first() { return db.prepare(sql).get(...args); } }) }), batch: vi.fn(async statements => {
  db.exec('BEGIN');
  try { const result = statements.map(({sql,args}) => ({success:true,meta:{changes:Number(db.prepare(sql).run(...args).changes)}})); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
 }) };
 return {db,env:{LEADS_DB:binding,ENQUIRY_LIMITER:{limit:vi.fn(async()=>({success:true}))}}};
}
describe('Workers enquiry intake',()=>{
 it('persists the real schema and a pending follow-up atomically, without returning contact details',async()=>{
  const {db,env}=setup();try{const r=await worker.fetch(request(),env);expect(r.status).toBe(200);expect(await r.json()).toEqual({success:true,lead_saved:true});
  const row=db.prepare('SELECT * FROM enquiries').get();expect(row.email).toBe(input.email);expect(row.submission_id).toBe(input.submissionId);expect(row.payload_hash).toMatch(/^[0-9a-f]{64}$/);expect(JSON.parse(row.attribution)).toEqual({utmSource:'search'});expect(db.prepare('SELECT * FROM enquiry_outbox').get()).toMatchObject({enquiry_id:row.id,status:'pending'});
  }finally{db.close();}
 });
 it('rolls back the lead if follow-up persistence fails',async()=>{const {db,env}=setup();try{db.exec('DROP TABLE enquiry_outbox');const r=await worker.fetch(request(),env);expect(r.status).toBe(503);expect((await r.json()).lead_saved).toBe(false);expect(db.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n).toBe(0);}finally{db.close();}});
 it.each([
  {...input,email:''}, {...input,preferredContact:'phone',phone:''}, {...input,serviceType:'admin'}, {...input,name:' '.repeat(3)}, {...input,email:'bad\nheader@example.test'}, {...input,projectDescription:'x'.repeat(4001)}, {...input,submissionId:'not-a-uuid'}, [], null,
 ])('rejects invalid input without writing',async body=>{const {db,env}=setup();try{expect((await worker.fetch(request(body),env)).status).toBe(400);expect(env.LEADS_DB.batch).not.toHaveBeenCalled();}finally{db.close();}});
 it('enforces streamed body limit even without Content-Length',async()=>{const {db,env}=setup();try{expect((await worker.fetch(request('x'.repeat(17000)),env)).status).toBe(413);expect(env.LEADS_DB.batch).not.toHaveBeenCalled();}finally{db.close();}});
 it('rejects wrong origin and rate-limited requests',async()=>{const {db,env}=setup();try{expect((await worker.fetch(request(input,{Origin:'https://other.example'}),env)).status).toBe(403);env.ENQUIRY_LIMITER.limit.mockResolvedValue({success:false});expect((await worker.fetch(request(),env)).status).toBe(429);expect(env.LEADS_DB.batch).not.toHaveBeenCalled();}finally{db.close();}});
 it('fails closed without infrastructure bindings',async()=>{expect((await worker.fetch(request(),{})).status).toBe(503);});
 it('does not treat an unacknowledged database batch as saved',async()=>{const {db,env}=setup();try{env.LEADS_DB.batch.mockResolvedValue([{success:true,meta:{changes:1}},{success:false}]);expect((await worker.fetch(request(),env)).status).toBe(503);}finally{db.close();}});
 it('accepts phone-only enquiries and parameterizes SQL',async()=>{const {db,env}=setup();try{const r=await worker.fetch(request({...input,name:"O'Brien",email:'',phone:'+1 (416) 555-0100',preferredContact:'phone'}),env);expect(r.status).toBe(200);expect(db.prepare('SELECT name FROM enquiries').get().name).toBe("O'Brien");}finally{db.close();}});
 it('returns the existing durable enquiry for a retried submission',async()=>{const {db,env}=setup();try{expect((await worker.fetch(request(),env)).status).toBe(200);expect((await worker.fetch(request(),env)).status).toBe(200);expect(db.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n).toBe(1);expect(db.prepare('SELECT COUNT(*) AS n FROM enquiry_outbox').get().n).toBe(1);}finally{db.close();}});
 it('rejects reuse of a submission key with different details',async()=>{const {db,env}=setup();try{expect((await worker.fetch(request(),env)).status).toBe(200);const response=await worker.fetch(request({...input,projectDescription:'Different scope.'}),env);expect(response.status).toBe(409);expect((await response.json()).lead_saved).toBe(false);expect(db.prepare('SELECT COUNT(*) AS n FROM enquiries').get().n).toBe(1);}finally{db.close();}});
 it('returns an ambiguous-save message when the batch acknowledgement fails',async()=>{const {db,env}=setup();try{env.LEADS_DB.batch.mockRejectedValueOnce(new Error('connection lost'));const response=await worker.fetch(request(),env);expect(response.status).toBe(503);expect((await response.json()).error).toContain('confirm whether your enquiry was saved');}finally{db.close();}});
 it('accepts legacy callers without a submission key',async()=>{const {db,env}=setup();try{const {submissionId: _submissionId, ...legacy} = input;const response=await worker.fetch(request(legacy),env);expect(response.status).toBe(200);expect(db.prepare('SELECT submission_id FROM enquiries').get().submission_id).toMatch(/^[0-9a-f-]{36}$/);}finally{db.close();}});
});
