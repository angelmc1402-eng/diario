import {normalizeDashboard} from './dashboard.js';
export async function saveDashboard(db,layout){
 const next=normalizeDashboard(layout),{data,error}=await db.rpc('update_diary_dashboard',{p_layout:next});
 if(error)throw error;
 if(!data||data.version!==1||JSON.stringify(normalizeDashboard(data))!==JSON.stringify(next))throw Error('No se pudo confirmar el diseño. Tus cambios siguen en el formulario.');
 return normalizeDashboard(data);
}
