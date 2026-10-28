export const localDate = (d = new Date(), zone = 'Europe/Madrid') => new Intl.DateTimeFormat('en-CA', {timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
export function addDays(date, count) { const d = new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+count); return d.toISOString().slice(0,10); }
export function daysBetween(a,b) { return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000); }
export function periodFor(anchor, date) { const n = Math.floor(daysBetween(anchor,date)/14); return addDays(anchor,n*14); }
export function weekCount(exercise,start) {return new Set(exercise.filter(x=>x.date>=start && x.date<=addDays(start,6)).map(x=>x.date)).size;}
export function escapeHtml(value='') {return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function weightPoints(weights) { const rows=[...weights].sort((a,b)=>a.date.localeCompare(b.date)); if(!rows.length)return []; const min=Math.min(...rows.map(x=>+x.weight_kg))-1,max=Math.max(...rows.map(x=>+x.weight_kg))+1; const span=Math.max(1,daysBetween(rows[0].date,rows.at(-1).date)); return rows.map(x=>({...x,x:40+daysBetween(rows[0].date,x.date)/span*620,y:180-(+x.weight_kg-min)/(max-min)*140})); }
