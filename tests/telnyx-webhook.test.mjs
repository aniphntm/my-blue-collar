import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { receiveTelnyx } from '../lib/telnyx-webhook.ts';
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const config = {publicKey: publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64'), databaseUrl:'https://example.supabase.co',databaseKey:'test-only',inboxSecret:'inbox-only'};
const now = Date.now();
const event = {data:{id:'test-event',event_type:'message.received',occurred_at:new Date(now).toISOString(),payload:{text:'private message'}}};
function request(body=JSON.stringify(event), timestamp=String(Math.floor(now/1000))) {
  return new Request('https://mybluework.com/api/webhooks',{method:'POST',body,headers:{'content-type':'application/json','telnyx-timestamp':timestamp,'telnyx-signature-ed25519':sign(null,Buffer.from(`${timestamp}|${body}`),privateKey).toString('base64')}});
}
for(const type of ['message.received','message.sent','message.finalized']) test(`durably saves ${type}`,async()=>{
 let calls=0;
 const send=async(url,options)=>{calls++; assert.match(url,/rpc\/receive_telnyx_event/); assert.equal(JSON.parse(options.body).p_secret,config.inboxSecret); assert.equal(JSON.parse(options.body).p_event.data.event_type,type); return new Response(null,{status:201});};
 const r=await receiveTelnyx(request(JSON.stringify({data:{...event.data,event_type:type}})),config,send,now);
 assert.equal(r.status,200);assert.equal(calls,1);
});
test('invalid signatures never reach storage',async()=>{const req=request();req.headers.set('telnyx-signature-ed25519',Buffer.alloc(64).toString('base64'));assert.equal((await receiveTelnyx(req,config,()=>assert.fail('storage called'),now)).status,401);});
test('body tampering is rejected',async()=>{const original=request();const req=new Request(original.url,{method:'POST',headers:original.headers,body:JSON.stringify(event)+' '}); assert.equal((await receiveTelnyx(req,config,()=>assert.fail(),now)).status,401);});
for(const delta of [-301,301]) test(`rejects timestamp offset ${delta}`,async()=>assert.equal((await receiveTelnyx(request(undefined,String(Math.floor(now/1000)+delta)),config,()=>assert.fail(),now)).status,401));
test('missing configuration fails closed',async()=>assert.equal((await receiveTelnyx(request(),{},()=>assert.fail(),now)).status,503));
test('malformed signed JSON rejected',async()=>assert.equal((await receiveTelnyx(request('{'),config,()=>assert.fail(),now)).status,400));
test('malformed signed envelope rejected',async()=>assert.equal((await receiveTelnyx(request('{}'),config,()=>assert.fail(),now)).status,400));
test('database errors request retries',async()=>assert.equal((await receiveTelnyx(request(),config,async()=>new Response(null,{status:500}),now)).status,503));
test('network errors request retries',async()=>assert.equal((await receiveTelnyx(request(),config,async()=>{throw new Error('timeout');},now)).status,503));
test('duplicates use database conflict handling',async()=>{const ids=new Set();const send=async(_url,options)=>{ids.add(JSON.parse(options.body).p_event.data.id);return new Response(null,{status:201});}; for(let i=0;i<2;i++) assert.equal((await receiveTelnyx(request(),config,send,now)).status,200);assert.equal(ids.size,1);});
test('oversized streamed body rejected',async()=>assert.equal((await receiveTelnyx(request('x'.repeat(1024*1024+1)),config,()=>assert.fail(),now)).status,413));
