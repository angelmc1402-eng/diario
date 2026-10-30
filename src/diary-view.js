import {addDays,escapeHtml as e} from './domain.js';
export const DIARY_MODES={list:'Lista estándar',compact:'Compacto · 3 días',calendar:'Calendario'};
export const diaryMode=value=>Object.hasOwn(DIARY_MODES,value)?value:'list';
export function diaryDates({mode='list',start,days=14,today,focus}){
 if(diaryMode(mode)!=='compact')return Array.from({length:days},(_,i)=>addDays(start,i));
 const end=addDays(start,days-1),center=today>=start&&today<=end?today:focus>=start&&focus<=end?focus:addDays(start,1);
 return [-1,0,1].map(offset=>addDays(center,offset));
}
export function diaryModeControl(value,attribute='data-diary-mode'){
 return `<label class="diary-mode-control"><span>Modo</span><select ${attribute} aria-label="Modo de los días">${Object.entries(DIARY_MODES).map(([id,label])=>`<option value="${id}" ${diaryMode(value)===id?'selected':''}>${label}</option>`).join('')}</select></label>`;
}
export function diaryCalendar({dates,today,meals=[],exercise=[]}){
 const format=(date,opts)=>new Intl.DateTimeFormat('es-ES',opts).format(new Date(date+'T12:00:00Z'));
 return `<div class="diary-calendar" aria-label="Días del periodo">${dates.map(date=>{
 const count=meals.filter(x=>x.date===date).length,sport=exercise.some(x=>x.date===date),isToday=date===today;
 const label=`${format(date,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${isToday?', hoy':''} · ${count?`${count} comidas`:'Sin comidas'}${sport?' · Deporte':''}`;
 return `<button type="button" class="calendar-day ${isToday?'is-today':''} ${count||sport?'has-record':''}" data-action="day-dialog" data-date="${date}" aria-label="${e(label)}" ${isToday?'aria-current="date"':''}><span class="calendar-weekday">${format(date,{weekday:'short'})}</span><strong>${format(date,{day:'numeric'})}</strong><small>${format(date,{month:'short'})}</small><span class="calendar-marks" aria-hidden="true"><i class="${count?'filled':''}"></i>${sport?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h5l3-8 4 16 3-8h5"/></svg>':''}</span></button>`;
 }).join('')}</div>`;
}
