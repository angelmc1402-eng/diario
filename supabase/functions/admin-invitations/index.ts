import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
import {createAdminHandler} from './handler.js';

const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{
  auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
});
const fail=(error:unknown)=>{if(error)throw error;};
Deno.serve(createAdminHandler({
  authenticate:async(token:string)=>{const {data,error}=await client.auth.getUser(token);fail(error);return data.user;},
  isAdmin:async(id:string)=>{const {data,error}=await client.from('diary_admins').select('user_id').eq('user_id',id).maybeSingle();fail(error);return !!data;},
  history:async()=>{const {data,error}=await client.from('diary_invitations').select('id,email,delivery,status,created_at').order('created_at',{ascending:false}).limit(30);fail(error);return data;},
  reserve:async({requestId,actor,email,delivery})=>{const {error}=await client.rpc('reserve_diary_invitation',{p_id:requestId,p_actor:actor,p_email:email,p_delivery:delivery});fail(error);},
  invite:async({email,delivery})=>{
    if(delivery==='email'){
      const {data,error}=await client.auth.admin.inviteUserByEmail(email,{redirectTo:'https://goingfit.es/?invitation=1'});fail(error);return {userId:data.user?.id};
    }
    const {data,error}=await client.auth.admin.generateLink({type:'invite',email,options:{redirectTo:'https://goingfit.es/?invitation=1'}});fail(error);
    return {userId:data.user?.id,tokenHash:data.properties?.hashed_token};
  },
  finish:async(id:string,values:Record<string,unknown>)=>{const {error}=await client.from('diary_invitations').update(values).eq('id',id);fail(error);}
}));
