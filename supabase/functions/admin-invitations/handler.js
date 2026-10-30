const ORIGIN='https://goingfit.es';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function normalizeInvite(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('invalid_input');
  const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
  if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n<>]/.test(email))throw Error('invalid_email');
  if(!['email','link'].includes(input.delivery)||!UUID.test(input.requestId||''))throw Error('invalid_input');
  if(Object.keys(input).some(k=>!['email','delivery','requestId'].includes(k)))throw Error('invalid_input');
  return {email,delivery:input.delivery,requestId:input.requestId};
}
export function invitationError(error){
  const code=error?.code||'',message=String(error?.message||error||'');
  if(/duplicate_request/.test(message))return [409,'duplicate_request','Esta petición ya se procesó. Actualiza el historial antes de crear otra.'];
  if(/invite_email_cooldown/.test(message))return [429,'email_cooldown','Espera un minuto antes de invitar otra vez a ese correo.'];
  if(/invite_rate_limit/.test(message))return [429,'rate_limit','Has alcanzado el límite de invitaciones. Inténtalo más tarde.'];
  if(/email_exists|user_already_exists/.test(code)||/already (been )?registered|already exists/i.test(message))return [409,'already_registered','Ese correo ya tiene cuenta. Puede entrar o recuperar su contraseña.'];
  if(/email_address_not_authorized|over_email_send_rate_limit|email_provider_disabled|smtp/i.test(code+' '+message)||/error sending|not authorized|rate limit.*email/i.test(message))return [503,'email_unavailable','El envío de correo no está disponible. Puedes crear un enlace de invitación y compartirlo tú.'];
  if(/admin_required/.test(message))return [403,'admin_required','Solo el administrador puede invitar.'];
  return [502,'invite_failed','No se pudo completar la invitación. Revisa el historial antes de volver a intentarlo.'];
}
export function createAdminHandler(deps){return async req=>{
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Vary':'Origin',
    'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods':'POST, GET, OPTIONS'};
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  if(req.headers.get('origin')&&req.headers.get('origin')!==ORIGIN)return reply(403,{error:'origin_not_allowed',message:'Origen no permitido.'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!['GET','POST'].includes(req.method))return reply(405,{error:'method_not_allowed'});
  const match=/^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization')||'');
  if(!match)return reply(401,{error:'authentication_required',message:'Vuelve a iniciar sesión.'});
  let actor;
  try{actor=await deps.authenticate(match[1]);}catch{return reply(401,{error:'invalid_session',message:'La sesión no es válida. Vuelve a entrar.'});}
  if(!actor?.id)return reply(401,{error:'invalid_session',message:'Vuelve a iniciar sesión.'});
  try{
    // Read server-controlled membership on every request, even after JWT refresh/revocation.
    if(!await deps.isAdmin(actor.id))return reply(403,{error:'admin_required',message:'Solo el administrador puede invitar.'});
    if(req.method==='GET')return reply(200,{invitations:await deps.history()});
    if(!req.headers.get('content-type')?.includes('application/json'))return reply(415,{error:'json_required'});
    const raw=await req.text();if(raw.length>2048)return reply(413,{error:'body_too_large'});
    let input;try{input=normalizeInvite(JSON.parse(raw));}catch{return reply(400,{error:'invalid_input',message:'Escribe un correo válido y elige cómo invitar.'});}
    try{await deps.reserve({...input,actor:actor.id});}catch(error){const [status,code,message]=invitationError(error);return reply(status,{error:code,message});}
    let result;
    try{
      result=await deps.invite(input);
      // Never trust a caller-supplied redirect or return provider URLs / privileged tokens.
      if(input.delivery==='link'&&!/^[0-9a-f]{64}$/i.test(result.tokenHash||''))throw Error('invalid_provider_response');
    }catch(error){const [status,code,message]=invitationError(error);await deps.finish(input.requestId,{status:'failed',error_code:code}).catch(()=>{});return reply(status,{error:code,message});}
    const status=input.delivery==='email'?'email_sent':'link_created';
    // A send can succeed even if audit completion fails. Do not offer automatic retry.
    let auditPending=false;try{await deps.finish(input.requestId,{status,user_id:result.userId||null});}catch{auditPending=true;}
    const response={status,email:input.email,auditPending};
    if(input.delivery==='link')response.link=ORIGIN+'/#invite_token='+result.tokenHash;
    return reply(200,response);
  }catch{return reply(503,{error:'service_unavailable',message:'No se pudo consultar la administración. Inténtalo más tarde.'});}
};}
