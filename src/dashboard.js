
export const DASHBOARD_STATS=[
 {id:'logged_days',label:'Días con registro'}, {id:'sport_days',label:'Días de deporte'},
 {id:'weight',label:'Último peso'}, {id:'meals',label:'Comidas registradas'},
 {id:'activity_minutes',label:'Minutos de actividad'}, {id:'goals_done',label:'Objetivos del día'},
];
export const DASHBOARD_PANELS=[
 {id:'diary',label:'Registro de los días',column:'left'},
 {id:'goals',label:'Objetivos',column:'right'},
 {id:'appointment',label:'Próxima cita',column:'right'},
 {id:'weight_trend',label:'Gráfica de peso',column:'left'},
 {id:'measurements',label:'Últimas medidas',column:'right'},
 {id:'milestones',label:'Hitos del periodo',column:'right'},
 {id:'nutrition',label:'Alimentación registrada',column:'right'},
 {id:'activity',label:'Últimas sesiones',column:'right'},
 {id:'body',label:'Registro corporal',column:'right'},
];
export const DASHBOARD_PRESETS={
 diary:{name:'Diario',description:'Comidas y actividad, con tus objetivos al lado.',stats:['logged_days','sport_days','weight'],left:['diary'],right:['goals','appointment'],columns:'left-wide'},
 habits:{name:'Hábitos',description:'Objetivos y constancia, con el diario a mano.',stats:['goals_done','sport_days','logged_days'],left:['goals','diary'],right:['activity','nutrition','appointment'],columns:'left-wide'},
 evolution:{name:'Evolución',description:'Peso y medidas, con gráficas y tus registros.',stats:['weight','logged_days','sport_days'],left:['weight_trend','diary'],right:['measurements','body','goals','appointment'],columns:'balanced'},
};
const clone=x=>JSON.parse(JSON.stringify(x));
export function dashboardPreset(id='diary'){
 const p=DASHBOARD_PRESETS[id]||DASHBOARD_PRESETS.diary,key=DASHBOARD_PRESETS[id]?id:'diary';
 const stats=[...p.stats,...DASHBOARD_STATS.map(x=>x.id).filter(x=>!p.stats.includes(x))].map(id=>({id,visible:p.stats.includes(id)}));
 const enabled=[...p.left,...p.right];
 const panels=[...enabled,...DASHBOARD_PANELS.map(x=>x.id).filter(x=>!enabled.includes(x))].map(id=>({id,visible:enabled.includes(id),column:p.left.includes(id)?'left':p.right.includes(id)?'right':DASHBOARD_PANELS.find(x=>x.id===id).column}));
 return {version:1,preset:key,columns:p.columns,stats,panels};
}
export function normalizeDashboard(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1)return dashboardPreset();
 const fallback=dashboardPreset(value.preset),seen=new Set();
 const list=(items,defs,panels=false)=>{
  seen.clear();const result=[];
  if(!Array.isArray(items))return clone(panels?fallback.panels:fallback.stats);
  for(const item of items){const def=defs.find(x=>x.id===item?.id);if(!def||seen.has(def.id))continue;seen.add(def.id);result.push({id:def.id,visible:item.visible===true,...(panels?{column:['left','right'].includes(item.column)?item.column:def.column}:{})});}
  for(const def of defs)if(!seen.has(def.id))result.push({id:def.id,visible:false,...(panels?{column:def.column}:{})});
  return result;
 };
 return {version:1,preset:[...Object.keys(DASHBOARD_PRESETS),'custom'].includes(value.preset)?value.preset:'custom',columns:['left-wide','balanced','right-wide'].includes(value.columns)?value.columns:'left-wide',stats:list(value.stats,DASHBOARD_STATS),panels:list(value.panels,DASHBOARD_PANELS,true)};
}
export function changeDashboard(value,action){
 const next=normalizeDashboard(value),section=action.section==='stats'?'stats':action.section==='panels'?'panels':null;
 if(action.type==='columns'&&['left-wide','balanced','right-wide'].includes(action.value))next.columns=action.value;
 else if(section){const list=next[section],index=list.findIndex(x=>x.id===action.id);if(index<0)return next;const item=list[index];
  if(action.type==='toggle')item.visible=!!action.visible;
  else if(action.type==='column'&&section==='panels'&&['left','right'].includes(action.value)){item.column=action.value;list.splice(index,1);list.push(item);}
  else if(action.type==='move'&&[-1,1].includes(action.direction)){const group=list.filter(x=>section==='stats'||x.column===item.column),target=group[group.indexOf(item)+action.direction];if(!target)return next;const other=list.indexOf(target);[list[index],list[other]]=[list[other],list[index]];}
  else return next;
 }else return next;
 next.preset='custom';return next;
}
export function dashboardName(layout){const value=normalizeDashboard(layout);return DASHBOARD_PRESETS[value.preset]?.name||'Personalizado';}
export function presetChoices(selected='diary',{onboarding=false}={}){
 const cards=Object.entries(DASHBOARD_PRESETS).map(([id,p])=>{
  const content=`<span class="dashboard-preset-preview" data-preset="${id}" aria-hidden="true"><span class="preview-stats"><i></i><i></i><i></i></span><span class="preview-columns"><i></i><i></i><i></i></span></span><strong>${p.name}</strong><small>${p.description}</small>`;
  return onboarding?`<label class="dashboard-preset"><input type="radio" name="dashboard_preset" value="${id}" ${selected===id?'checked':''}><span>${content}</span></label>`:`<button type="button" class="dashboard-preset ${selected===id?'selected':''}" data-action="dashboard-preset" data-preset="${id}" aria-pressed="${selected===id}">${content}</button>`;
 }).join('');
 return onboarding?`<fieldset class="dashboard-setup"><legend>Cómo quieres ver tu inicio</legend><p class="muted">Elige un diseño para empezar. Podrás personalizarlo cuando quieras.</p><div class="dashboard-presets">${cards}</div></fieldset>`:`<div class="dashboard-presets" role="group" aria-label="Diseños de inicio">${cards}</div>`;
}
function editorRow(item,section,group){
 const def=(section==='stats'?DASHBOARD_STATS:DASHBOARD_PANELS).find(x=>x.id===item.id),position=group.findIndex(x=>x.id===item.id);
 return `<div class="dashboard-edit-row ${item.visible?'':'is-hidden'}" data-dashboard-row="${item.id}"><label class="dashboard-visible"><input type="checkbox" data-dashboard-toggle data-section="${section}" data-id="${item.id}" ${item.visible?'checked':''}><span>${def.label}</span></label><div class="dashboard-row-actions">${section==='panels'?`<label class="sr-only" for="column-${item.id}">Columna de ${def.label}</label><select id="column-${item.id}" data-dashboard-column data-id="${item.id}"><option value="left" ${item.column==='left'?'selected':''}>Izquierda</option><option value="right" ${item.column==='right'?'selected':''}>Derecha</option></select>`:''}<button type="button" class="icon-button" data-action="dashboard-move" data-section="${section}" data-id="${item.id}" data-direction="-1" aria-label="Subir ${def.label}" ${position===0?'disabled':''}>↑</button><button type="button" class="icon-button" data-action="dashboard-move" data-section="${section}" data-id="${item.id}" data-direction="1" aria-label="Bajar ${def.label}" ${position===group.length-1?'disabled':''}>↓</button></div></div>`;
}
export function dashboardPreview(value){
 const l=normalizeDashboard(value),label=(id,defs)=>defs.find(x=>x.id===id).label;
 return `<div class="dashboard-live-preview" data-columns="${l.columns}" aria-label="Vista previa de la distribución"><div class="dashboard-preview-stats">${l.stats.filter(x=>x.visible).map(x=>`<span>${label(x.id,DASHBOARD_STATS)}</span>`).join('')}</div><div class="dashboard-preview-columns">${['left','right'].map(col=>`<div>${l.panels.filter(x=>x.visible&&x.column===col).map(x=>`<span>${label(x.id,DASHBOARD_PANELS)}</span>`).join('')||'<small>Sin paneles</small>'}</div>`).join('')}</div></div>`;
}
export function dashboardEditor(value,{demo=false}={}){
 const l=normalizeDashboard(value);return `<div class="dashboard-editor-content"><p class="muted">Elige un diseño o ajusta cada panel. ${demo?'Se aplicará solo en esta prueba.':'Se guardará en tu cuenta.'}</p>${presetChoices(l.preset)}<div class="dashboard-editor-heading"><h3>Tu distribución</h3><span class="pill" role="status">${dashboardName(l)}</span></div><label class="field"><span>Ancho de las columnas en ordenador</span><select data-dashboard-columns><option value="left-wide" ${l.columns==='left-wide'?'selected':''}>Izquierda amplia</option><option value="balanced" ${l.columns==='balanced'?'selected':''}>Equilibradas</option><option value="right-wide" ${l.columns==='right-wide'?'selected':''}>Derecha amplia</option></select></label><p class="muted dashboard-mobile-order">En móvil, primero aparece la columna izquierda y después la derecha.</p><details class="dashboard-editor-section" id="dashboard-stats-editor" open><summary>Indicadores de arriba</summary><p class="muted">Marca los que quieras ver y ordénalos de izquierda a derecha.</p>${l.stats.map(x=>editorRow(x,'stats',l.stats)).join('')}</details>${['left','right'].map(col=>{const group=l.panels.filter(x=>x.column===col);return `<details class="dashboard-editor-section" id="dashboard-${col}-editor" open><summary>Paneles · ${col==='left'?'izquierda':'derecha'}</summary>${group.map(x=>editorRow(x,'panels',group)).join('')}</details>`;}).join('')}<details class="dashboard-editor-section" id="dashboard-preview-editor"><summary>Vista previa</summary>${dashboardPreview(l)}</details><p class="muted">Ocultar un panel solo cambia el inicio. Tus registros siguen disponibles en el menú.</p></div>`;
}
export function dashboardFrame(layout,stats,panels){
 const l=normalizeDashboard(layout),shown=l.panels.filter(x=>x.visible),s=l.stats.filter(x=>x.visible);
 const column=col=>shown.filter(x=>x.column===col).map(x=>`<div class="dashboard-widget" data-dashboard-widget="${x.id}">${panels[x.id]||''}</div>`).join('');
 const left=column('left'),right=column('right');
 return `${s.length?`<div class="stat-grid dashboard-stats" style="--stat-count:${Math.min(s.length,3)}">${s.map(x=>`<section class="stat" data-dashboard-stat="${x.id}">${stats[x.id]||''}</section>`).join('')}</div>`:''}${shown.length?`<div class="dashboard-columns ${!left||!right?'single-column':''}" data-columns="${l.columns}">${left?`<div class="dashboard-column" data-dashboard-side="left">${left}</div>`:''}${right?`<div class="dashboard-column" data-dashboard-side="right">${right}</div>`:''}</div>`:!s.length?'<section class="panel dashboard-empty"><h2>Tu inicio está vacío</h2><p class="muted">Elige qué quieres ver desde Personalizar.</p><button type="button" class="secondary" data-action="dashboard-customize">Elegir paneles</button></section>':''}`;
}
