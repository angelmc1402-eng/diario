import {test} from 'node:test';
import assert from 'node:assert/strict';
import {updateGoal} from '../src/goal-store.js';
const values={title:'Objetivo de prueba',start_date:'2026-10-28',end_date:'2026-11-10',tracking:'daily',weekly_target:null};
function mock(patchResult,rpcResult){
 const calls=[];
 const finish=result=>({select:()=>({single:async()=>{if(result instanceof Error)throw result;return result;}})});
 const client={from:table=>({update:row=>({eq:(key,id)=>{calls.push({method:'patch',table,row,key,id});return finish(patchResult);}})}),rpc:(name,params)=>{calls.push({method:'rpc',name,params});return finish(rpcResult);}};
 return {client,calls};
}
test('confirma la actualización por PATCH sin duplicar la operación',async()=>{const {client,calls}=mock({data:{id:'goal-1'}});await updateGoal(client,'goal-1',values);assert.equal(calls.length,1);});
test('un fallo de red en PATCH usa POST con el mismo objetivo y contenido',async()=>{const {client,calls}=mock({error:{message:'TypeError: Failed to fetch'}},{data:{id:'goal-1'}});await updateGoal(client,'goal-1',values);assert.equal(calls[1].name,'update_diary_goal');assert.deepEqual(calls[1].params,{p_id:'goal-1',p_title:values.title,p_start_date:values.start_date,p_end_date:values.end_date,p_tracking:'daily',p_weekly_target:null});});
test('también recupera excepciones de transporte',async()=>{const {client,calls}=mock(new TypeError('Failed to fetch'),{data:{id:'goal-1'}});await updateGoal(client,'goal-1',values);assert.equal(calls.length,2);});
test('los errores de permisos no se reintentan por otra vía',async()=>{const error={code:'42501',message:'permission denied'};const {client,calls}=mock({error});await assert.rejects(updateGoal(client,'goal-1',values),x=>x===error);assert.equal(calls.length,1);});
test('nunca anuncia guardado si ambas vías fallan',async()=>{const error={message:'Failed to fetch'};const {client}=mock({error},{error});await assert.rejects(updateGoal(client,'goal-1',values),x=>x===error);});
test('cero filas o un identificador diferente no cuentan como guardado',async()=>{for(const data of [null,{id:'another-goal'}]){const {client}=mock({data});await assert.rejects(updateGoal(client,'goal-1',values),/confirmar/);}});
