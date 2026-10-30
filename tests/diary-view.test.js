import test from 'node:test';
import assert from 'node:assert/strict';
import {diaryDates,diaryCalendar,diaryModeControl} from '../src/diary-view.js';
import {dashboardPreset,normalizeDashboard,changeDashboard} from '../src/dashboard.js';
import {saveDashboard} from '../src/dashboard-store.js';

test('calendar preserves all seven or fourteen consecutive dates across months and years',()=>{
 const dates=diaryDates({mode:'calendar',start:'2026-12-28',days:14});
 assert.equal(dates.length,14);assert.equal(dates[0],'2026-12-28');assert.equal(dates[13],'2027-01-10');
 assert.equal(diaryDates({mode:'calendar',start:'2026-10-26',days:7}).length,7);
 const html=diaryCalendar({dates,today:'2027-01-01',meals:[{date:'2027-01-01'},{date:'2027-01-01'},{date:'2026-01-01'}],exercise:[{date:'2027-01-01'}]});
 assert.equal((html.match(/data-action="day-dialog"/g)||[]).length,14);
 assert.equal((html.match(/aria-current="date"/g)||[]).length,1);
 assert.ok(html.includes('hoy · 2 comidas · Deporte'));assert.ok(html.includes('data-date="2027-01-10"'));
});
test('compact includes yesterday today tomorrow, including a neighbour outside the period, and supports historical periods',()=>{
 const args={mode:'compact',start:'2026-10-28',days:14,today:'2026-10-28'};
 assert.deepEqual(diaryDates(args),['2026-10-27','2026-10-28','2026-10-29']);
 assert.deepEqual(diaryDates({...args,today:'2027-01-01'}),['2026-10-28','2026-10-29','2026-10-30']);
 assert.deepEqual(diaryDates({...args,today:'2027-01-01',focus:'2026-11-05'}),['2026-11-04','2026-11-05','2026-11-06']);
 assert.equal(diaryDates({...args,mode:'list'}).length,14);
});
test('day mode saves with the account layout, defaults safely, and preserves all panel and phone choices',async()=>{
 const original=dashboardPreset('habits'),next=changeDashboard(original,{type:'diary-mode',value:'calendar'});
 assert.equal(original.diary_mode,'list');assert.equal(next.diary_mode,'calendar');assert.deepEqual(next.panels,original.panels);assert.equal(next.mobile_stats,original.mobile_stats);
 const old={...next};delete old.diary_mode;assert.equal(normalizeDashboard(old).diary_mode,'list');assert.equal(normalizeDashboard({...next,diary_mode:'<script>'}).diary_mode,'list');
 const saved=await saveDashboard({rpc:async(name,args)=>({data:structuredClone(args.p_layout),error:null})},next);assert.equal(saved.diary_mode,'calendar');
 assert.equal((diaryModeControl('calendar').match(/<option /g)||[]).length,3);assert.ok(diaryModeControl('calendar').includes('value="calendar" selected'));
});
