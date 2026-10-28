import {addDays,periodFor,mondayOf} from './domain.js';
export const periodLength=mode=>mode==='week'?7:14;
export const periodStart=(mode,anchor,date)=>mode==='week'?mondayOf(date):periodFor(anchor,date);
export const periodLast=(start,mode)=>addDays(start,periodLength(mode)-1);
export const periodName=mode=>mode==='week'?'semana':'quincena';
export const periodTitle=mode=>mode==='week'?'Semana':'Quincena';
export function optionalNumber(value,label,{integer=false,min=0,max=999999}={}){
 const raw=String(value??'').trim().replace(',','.');if(raw==='')return null;
 const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error(`Revisa ${label}: introduce ${integer?'un número entero':'un número'} entre ${min} y ${max}.`);
 return n;
}
export function modeChoices(mode='fortnight'){
 return `<div class="mode-choices"><label class="mode-choice"><input type="radio" name="tracking_mode" value="fortnight" ${mode!=='week'?'checked':''}><span><strong>Quincenas · seguimiento con nutricionista o médico</strong><small>Periodos de 14 días desde el inicio de tu diario.</small></span></label><label class="mode-choice"><input type="radio" name="tracking_mode" value="week" ${mode==='week'?'checked':''}><span><strong>Semanas · control personal</strong><small>Semana natural, de lunes a domingo.</small></span></label></div>`;
}
