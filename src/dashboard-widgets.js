import {addDays,daysBetween,escapeHtml as e,weightPoints} from './domain.js';
import {dayTotals,meanMetric,known,sumField} from './nutrition.js';
import {MEASURES} from './measurements.js';
import {goalDayValue,goalFrequency,goalTarget} from './goal-templates.js';
const fmt=d=>new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short'}).format(new Date(d+'T12:00:00'));
const num=n=>known(n)?Number(n).toLocaleString('es-ES',{maximumFractionDigits:1}):'—';
const nav=(view,label='Ver todos')=>`<button type="button" class="text-button" data-action="nav" data-view="${view}">${label}</button>`;
const head=(title,view)=>`<div class="panel-head"><h2>${title}</h2>${nav(view)}</div>`;
const empty=text=>`<p class="muted dashboard-widget-empty">${text}</p>`;
export function dashboardExtras({data,start,end,focusDate}){
 const inPeriod=x=>x.date>=start&&x.date<=end,meals=data.meals.filter(inPeriod),exercise=data.exercise.filter(inPeriod);
 const daily=data.goals.filter(g=>goalFrequency(g)==='daily'&&g.start_date<=focusDate&&g.end_date>=focusDate);
 const complete=daily.filter(g=>goalDayValue(g,focusDate,data.goal_checks,data.exercise)>=goalTarget(g)).length;
 const minutes=sumField(exercise,'minutes');
 const stats={
  meals:`<span>Comidas registradas</span><strong>${meals.length}<small>comidas</small></strong><p>${fmt(start)} — ${fmt(end)}</p>`,
  activity_minutes:`<span>Minutos de actividad</span><strong>${num(minutes.value)}<small>min</small></strong><p>${exercise.length?`${minutes.known} de ${exercise.length} sesiones con duración`:'Sin sesiones en este periodo'}</p>`,
  goals_done:`<span>Objetivos del día</span><strong>${daily.length?complete:'—'}<small>${daily.length?'/ '+daily.length:'sin objetivos diarios'}</small></strong><p>${fmt(focusDate)} · objetivos diarios completados</p>`,
 };
 const w=data.weights.filter(x=>x.date<=end&&known(x.weight_kg)&&Number(x.weight_kg)>0).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12),points=weightPoints(w);
 const weight=`<section class="panel dashboard-weight">${head('Evolución del peso','weights')}${points.length?`<div class="dashboard-feature-value">${num(w.at(-1).weight_kg)} <small>kg · ${fmt(w.at(-1).date)}</small></div><svg viewBox="0 0 710 230" class="dashboard-weight-chart" role="img" aria-label="Evolución de los últimos ${w.length} pesajes. Último registro: ${e(num(w.at(-1).weight_kg))} kg"><path d="M40 40H680M40 110H680M40 180H680" class="dashboard-chart-grid"/><polyline points="${points.map(x=>`${x.x},${x.y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="3"/>${points.map(x=>`<circle cx="${x.x}" cy="${x.y}" r="5" fill="currentColor"><title>${fmt(x.date)}: ${num(x.weight_kg)} kg</title></circle>`).join('')}<text x="40" y="218">${fmt(w[0].date)}</text><text x="660" y="218" text-anchor="end">${w.length>1?fmt(w.at(-1).date):''}</text></svg><p class="muted">Últimos ${w.length} pesajes hasta el ${fmt(end)}.</p>`:empty('La gráfica aparecerá cuando registres tu peso.')}</section>`;
 const measurement=[...data.measurements].filter(x=>x.date<=end).sort((a,b)=>b.date.localeCompare(a.date))[0];
 const measures=`<section class="panel">${head('Últimas medidas','measurements')}${measurement?`<p class="muted">${fmt(measurement.date)}</p><dl class="dashboard-measures">${MEASURES.map(x=>`<div><dt>${x.label}</dt><dd>${num(measurement[x.key])}${known(measurement[x.key])?' <small>cm</small>':''}</dd></div>`).join('')}</dl>`:empty('Añade las medidas que quieras seguir.')}</section>`;
 const milestones=data.milestones.filter(x=>x.period_start<=end&&x.period_end>=start);
 const hits=`<section class="panel">${head('Hitos del periodo','milestones')}${milestones.length?`<p class="muted">${milestones.filter(x=>x.completed_on).length} de ${milestones.length} completados</p><ul class="dashboard-compact-list">${milestones.slice(0,4).map(x=>`<li><span>${e(x.title)}</span><small>${x.completed_on?'Hecho':'Pendiente'}</small></li>`).join('')}</ul>`:empty('Sin hitos en este periodo.')}</section>`;
 const days=Array.from({length:daysBetween(start,end)+1},(_,i)=>dayTotals(addDays(start,i),data.meals,data.exercise,data.day_status));
 const kcal=meanMetric(days,'kcal'),protein=meanMetric(days,'protein_g'),burn=meanMetric(days,'burn');
 const nutrition=`<section class="panel">${head('Alimentación registrada','nutrition')}<dl class="dashboard-measures">${[['Comidas',kcal,'kcal/día'],['Proteína',protein,'g/día'],['Ejercicio',burn,'kcal/día']].map(([label,metric,unit])=>`<div><dt>${label}<small>${metric.days} días con cifras</small></dt><dd>${num(metric.value)} <small>${unit}</small></dd></div>`).join('')}</dl><p class="muted">Medias de los días con cifras en este periodo. Los huecos no se cuentan como cero.</p></section>`;
 const sessions=[...exercise].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
 const activity=`<section class="panel">${head('Últimas sesiones','training')}${sessions.length?`<ul class="dashboard-compact-list">${sessions.map(x=>`<li><span>${e(x.activity)}<small>${fmt(x.date)}</small></span><small>${known(x.minutes)?num(x.minutes)+' min':'Sin duración'}</small></li>`).join('')}</ul>`:empty('Sin sesiones en este periodo.')}</section>`;
 const body=[...data.body_photos].filter(x=>x.date<=end).sort((a,b)=>b.date.localeCompare(a.date))[0];
 const bodyPanel=`<section class="panel">${head('Registro corporal','body')}${body?`<p>Último registro: <strong>${fmt(body.date)}</strong></p><div class="dashboard-body-views">${[['front_photo','Frontal'],['side_photo','Lateral'],['back_photo','Trasera']].map(([key,label])=>`<span class="pill">${label} · ${body[key]?'Con foto':'Sin foto'}</span>`).join('')}</div>${nav('body','Ver comparación')}`:empty('Puedes añadir fotos y comparar fechas desde Mi cuerpo.')}</section>`;
 return {stats,panels:{weight_trend:weight,measurements:measures,milestones:hits,nutrition,activity,body:bodyPanel}};
}
