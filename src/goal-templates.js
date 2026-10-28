import {addDays,calendarWeeks,escapeHtml as e} from './domain.js';
import {optionalNumber} from './periods.js';
export const GOAL_TEMPLATES={
 walk:{label:'Caminar',detail:'Minutos al día, desde tus sesiones o con registro manual.',unit:'min',target:20,frequency:'daily'},
 exercise:{label:'Hacer ejercicio',detail:'Días distintos de actividad por semana.',unit:'días',target:3,frequency:'weekly'},
 water:{label:'Beber agua',detail:'Elige tu cantidad y registra los litros del día.',unit:'l',target:'',frequency:'daily'},
 read:{label:'Leer',detail:'Minutos de lectura, a tu ritmo.',unit:'min',target:30,frequency:'daily'},
 custom:{label:'Personalizado',detail:'Nombre, cantidad, unidad, frecuencia y notas.',unit:'veces',target:1,frequency:'daily'},
};
export const goalKind=g=>g.tracking==='weekly_exercise'?'exercise':g.template||'custom';
export const goalFrequency=g=>goalKind(g)==='exercise'?'weekly':g.frequency||'daily';
export const goalTarget=g=>Number(g.target_value??g.weekly_target??1);
export const goalUnit=g=>goalKind(g)==='exercise'?'días':g.target_unit||'veces';
export const isBinaryGoal=g=>goalKind(g)==='custom'&&goalFrequency(g)==='daily'&&goalTarget(g)===1&&goalUnit(g)==='veces';
export function isWalking(session){return session.workout_type==='walking'||(!session.workout_type&&/\b(caminar|caminata|paseo|walking|walk)\b/i.test(session.activity||''));}
export function goalDayValue(g,date,checks,exercise){
 const check=checks.find(x=>x.goal_id===g.id&&x.date===date);
 if(check?.value!==null&&check?.value!==undefined)return Number(check.value);
 if(check?.completed)return goalTarget(g);
 if(goalKind(g)==='exercise')return exercise.some(x=>x.date===date)?1:0;
 if(goalKind(g)==='walk'){const rows=exercise.filter(x=>x.date===date&&isWalking(x));return rows.reduce((s,x)=>s+(Number(x.minutes)||0),0);}
 return 0;
}
export function goalWindows(g,start,end,reference){
 const a=g.start_date>start?g.start_date:start,b=g.end_date<end?g.end_date:end;if(a>b)return [];
 if(goalFrequency(g)==='weekly')return calendarWeeks(a,b,reference);
 if(goalFrequency(g)==='period')return [{start:g.start_date,end:g.end_date,partial:a!==g.start_date||b!==g.end_date,status:reference<g.start_date?'upcoming':reference>g.end_date?'finished':'current'}];
 return [{start:a,end:b,partial:false,status:reference<a?'upcoming':reference>b?'finished':'current'}];
}
export function goalWindowValue(g,window,checks,exercise){
 if(goalKind(g)==='exercise')return new Set(exercise.filter(x=>x.date>=window.start&&x.date<=window.end).map(x=>x.date)).size;
 let total=0;for(let d=window.start;d<=window.end;d=addDays(d,1))total+=goalDayValue(g,d,checks,exercise);return total;
}
export function parseGoal(fields,template){
 const kind=GOAL_TEMPLATES[template]?template:'custom',t=GOAL_TEMPLATES[kind];
 const target=optionalNumber(fields.target_value,'la cantidad del objetivo',{min:kind==='exercise'?1:0.01,max:kind==='exercise'?7:999999,integer:kind==='exercise'});
 if(target===null)throw Error('Indica la cantidad que quieres registrar.');
 const frequency=kind==='exercise'?'weekly':fields.frequency;
 if(!['daily','weekly','period'].includes(frequency))throw Error('Elige la frecuencia del objetivo.');
 const unit=kind==='custom'?String(fields.target_unit||'veces').trim():t.unit;
 if(!unit||unit.length>30)throw Error('La unidad debe tener entre 1 y 30 caracteres.');
 if(![fields.start_date,fields.end_date].every(d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d)||fields.end_date<fields.start_date)throw Error('Revisa las fechas del objetivo.');
 const suffix={daily:'al día',weekly:'a la semana',period:'en este periodo'}[frequency];
 const title=String(fields.title||'').trim()||`${t.label} ${target.toLocaleString('es-ES')} ${unit} ${suffix}`;
 if(title.length>200)throw Error('El nombre del objetivo es demasiado largo.');
 return {title,start_date:fields.start_date,end_date:fields.end_date,template:kind,target_value:target,target_unit:unit,frequency,notes:String(fields.notes||'').trim(),tracking:kind==='exercise'?'weekly_exercise':'daily',weekly_target:kind==='exercise'?target:null};
}
export function templatePicker(){return `<div class="goal-template-intro"><p>Elige una idea y ajusta la cantidad.</p><div class="goal-template-grid">${Object.entries(GOAL_TEMPLATES).map(([key,t])=>`<button type="button" data-action="goal-template" data-template="${key}" class="goal-template"><strong>${t.label}</strong><span>${t.detail}</span><small>${key==='custom'?'Crear a mi medida':'Personalizar →'}</small></button>`).join('')}</div></div>`;}
export function goalProgressLabel(g,value){return `${Number(value).toLocaleString('es-ES',{maximumFractionDigits:2})} / ${goalTarget(g).toLocaleString('es-ES')} ${e(goalUnit(g))}`;}
