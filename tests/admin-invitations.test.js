import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createAdminHandler,normalizeInvite} from '../supabase/functions/admin-invitations/handler.js';
import {readInvitation,readAuthCallbackError,adminView} from '../src/admin.js';
const id='b2653df9-eabc-40ba-9528-249b218f0f35',token=createHash('sha224').update('friend@example.test000000').digest('hex');
function fixture(overrides={}){
 const calls=[];const deps={authenticate:async()=>({id:'owner',user_metadata:{admin:true}}),isAdmin:async()=>true,
 history:async()=>[{email:'friend@example.test',status:'link_created'}],reserve:async x=>calls.push(['reserve',x]),
 invite:async x=>{calls.push(['invite',x]);return {userId:'new-user',tokenHash:token};},finish:async(id,x)=>calls.push(['finish',id,x]),...overrides};
 return {handler:createAdminHandler(deps),calls};
}
function request(body,{method='POST',auth='Bearer valid-user-token',origin='https://goingfit.es'}={}){return new Request('https://example.test/functions/v1/admin-invitations',{method,headers:{origin,...(auth?{authorization:auth}:{}),'content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});}
const input={email:' Friend@Example.test ',delivery:'link',requestId:id};
test('only a verified user with live server membership may invite; editable metadata is ignored',async()=>{
 for(const opts of [{auth:''},{auth:'Basic user'}]){const {handler,calls}=fixture();assert.equal((await handler(request(input,opts))).status,401);assert.equal(calls.length,0);}
 const invalid=fixture({authenticate:async()=>{throw Error('revoked');}});assert.equal((await invalid.handler(request(input))).status,401);
 const denied=fixture({isAdmin:async()=>false});assert.equal((await denied.handler(request(input))).status,403);assert.equal(denied.calls.length,0);
 assert.equal((await denied.handler(request(null,{method:'GET'}))).status,403);
});
test('CORS and malformed input are rejected before side effects',async()=>{
 const {handler,calls}=fixture();assert.equal((await handler(request(input,{origin:'https://attacker.example'}))).status,403);
 for(const body of [{...input,email:'x\n@example.test'},{...input,redirectTo:'https://attacker.test'},{...input,role:'admin'},{...input,requestId:'not-uuid'},{...input,delivery:'magiclink'},null])assert.equal((await handler(request(body))).status,400);
 assert.equal(calls.length,0);assert.equal(normalizeInvite(input).email,'friend@example.test');
});
test('link invitations use a fixed fragment, never return provider secrets, and are audited',async()=>{
 const {handler,calls}=fixture();const r=await handler(request(input));assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');const b=await r.json();assert.equal(b.link,'https://goingfit.es/#invite_token='+token);assert.equal(b.status,'link_created');assert.equal(b.userId,undefined);assert.equal(calls[0][0],'reserve');assert.equal(calls[2][2].status,'link_created');
});
test('email delivery cannot expose a token; history has no generated credential',async()=>{
 const {handler}=fixture();const b=await(await handler(request({...input,delivery:'email'}))).json();assert.equal(b.status,'email_sent');assert.equal(b.link,undefined);
 const list=await(await handler(request(null,{method:'GET'}))).json();assert.ok(list.invitations);assert.ok(!JSON.stringify(list).includes(token));
});
test('atomic reservation prevents duplicate and excessive sends',async()=>{
 for(const [error,status] of [['duplicate_request',409],['invite_rate_limit',429],['invite_email_cooldown',429],['admin_required',403]]){const {handler,calls}=fixture({reserve:async()=>{throw Error(error);}});assert.equal((await handler(request(input))).status,status);assert.equal(calls.length,0);}
});
test('SMTP failure is explicit, does not fabricate success or send a fallback email',async()=>{
 const {handler,calls}=fixture({invite:async()=>{throw {code:'email_address_not_authorized',message:'not authorized'};}});const r=await handler(request({...input,delivery:'email'}));assert.equal(r.status,503);const b=await r.json();assert.equal(b.error,'email_unavailable');assert.equal(b.link,undefined);assert.equal(calls.at(-1)[2].status,'failed');
});
test('delivery success is preserved if the audit update fails, with no retry',async()=>{
 const {handler,calls}=fixture({finish:async()=>{throw Error('db timeout');}});const b=await(await handler(request(input))).json();assert.equal(b.auditPending,true);assert.equal(calls.filter(c=>c[0]==='invite').length,1);assert.equal(b.link,'https://goingfit.es/#invite_token='+token);
});
test('broken provider data never becomes a usable invitation link',async()=>{
 const {handler}=fixture({invite:async()=>({tokenHash:'https://attacker.test'})});assert.equal((await handler(request(input))).status,502);
});
test('invitation callback parses fragment tokens without consuming them, and recognizes email callbacks',()=>{
 assert.deepEqual(readInvitation('https://goingfit.es/#invite_token='+token),{token,invalid:false,emailFlow:false,implicitInvite:false});
 assert.equal(readInvitation('https://goingfit.es/#invite_token=bad').invalid,true);
 assert.equal(readInvitation('https://goingfit.es/?invitation=1#access_token=example&type=invite').implicitInvite,true);
 assert.equal(readInvitation('https://goingfit.es/').token,null);
});
test('admin markup escapes addresses and private links and describes statuses accurately',()=>{
 const html=adminView({invitations:[{email:'<script>@example.test',created_at:'2026-10-30T12:00:00Z',status:'link_created'}],result:{email:'friend@example.test',status:'link_created',link:'https://goingfit.es/#invite_token='+token}});
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('no si la persona ya ha entrado'));assert.ok(html.includes('readonly'));
});

test('accepts provider SHA-224 hashes and does not confuse callback failure with sign-in',()=>{
 assert.equal(token.length,56);
 assert.equal(readInvitation('https://goingfit.es/#invite_token='+token).token,token);
 assert.equal(readInvitation('https://goingfit.es/#invite_token='+'a'.repeat(55)).invalid,true);
 assert.equal(readInvitation('https://goingfit.es/#invite_token='+'g'.repeat(56)).invalid,true);
 assert.match(readAuthCallbackError('https://goingfit.es/#error=access_denied&error_code=otp_expired&error_description=untrusted'),/ha caducado/);
 assert.ok(!readAuthCallbackError('https://goingfit.es/#error=access_denied&error_description=<script>').includes('<script>'));
 assert.equal(readAuthCallbackError('https://goingfit.es/#invite_token='+token),'');
});
