import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboardPreset,normalizeDashboard,changeDashboard,dashboardName,presetChoices,dashboardEditor,dashboardFrame} from '../src/dashboard.js';
import {dashboardExtras} from '../src/dashboard-widgets.js';
import {saveDashboard} from '../src/dashboard-store.js';
import {makeDemoData} from '../src/demo-data.js';

test('existing profiles keep the original homepage and three distinct starting layouts are independent',()=>{
 const original=normalizeDashboard(null);
 assert.deepEqual(original.stats.filter(x=>x.visible).map(x=>x.id),['logged_days','sport_days','weight']);
 assert.deepEqual(original.panels.filter(x=>x.visible&&x.column==='left').map(x=>x.id),['diary']);
 assert.deepEqual(original.panels.filter(x=>x.visible&&x.column==='right').map(x=>x.id),['goals','appointment']);
 const habits=dashboardPreset('habits'),evolution=dashboardPreset('evolution');
 assert.equal(habits.panels.find(x=>x.visible&&x.column==='left').id,'goals');
 assert.equal(evolution.panels.find(x=>x.visible&&x.column==='left').id,'weight_trend');
 evolution.stats[0].visible=false;assert.equal(dashboardPreset('evolution').stats[0].visible,true);
});
test('normalization drops unknown/duplicate entries and preserves an intentional empty homepage',()=>{
 const input={version:1,preset:'custom',columns:'malicious',stats:[{id:'weight',visible:true},{id:'weight',visible:true},{id:'<script>',visible:true}],panels:[]};
 const value=normalizeDashboard(input);assert.equal(value.columns,'left-wide');assert.equal(value.stats.filter(x=>x.id==='weight').length,1);assert.equal(value.stats.filter(x=>x.visible).length,1);assert.equal(value.panels.filter(x=>x.visible).length,0);assert.ok(!JSON.stringify(value).includes('script'));
 assert.ok(dashboardFrame({...value,stats:[]},{},{}).includes('Elegir paneles'));
 assert.equal(normalizeDashboard({version:99}).preset,'diary');
});
test('customizing order, visibility and columns changes only a detached draft',()=>{
 const original=dashboardPreset(),snapshot=JSON.stringify(original);
 let next=changeDashboard(original,{type:'move',section:'stats',id:'weight',direction:-1});
 next=changeDashboard(next,{type:'move',section:'stats',id:'weight',direction:-1});
 assert.equal(next.stats[0].id,'weight');assert.equal(next.preset,'custom');
 next=changeDashboard(next,{type:'toggle',section:'stats',id:'logged_days',visible:false});
 next=changeDashboard(next,{type:'column',section:'panels',id:'diary',value:'right'});
 next=changeDashboard(next,{type:'columns',value:'right-wide'});
 assert.equal(next.panels.find(x=>x.id==='diary').column,'right');assert.equal(next.columns,'right-wide');
 assert.equal(next.stats.find(x=>x.id==='logged_days').visible,false);assert.equal(JSON.stringify(original),snapshot);
 assert.equal(dashboardName(next),'Personalizado');
 const phone=changeDashboard(next,{type:'mobile-stats',value:'comfortable'});assert.equal(phone.mobile_stats,'comfortable');assert.equal(phone.columns,next.columns);assert.deepEqual(phone.panels,next.panels);assert.equal(next.mobile_stats,'compact');
 const legacy={...phone};delete legacy.mobile_stats;assert.equal(normalizeDashboard(legacy).mobile_stats,'compact');assert.equal(normalizeDashboard({...phone,mobile_stats:'invalid'}).mobile_stats,'compact');
});
test('panel reordering respects each column and frame uses the actual selected order',()=>{
 let l=dashboardPreset('evolution');l=changeDashboard(l,{type:'move',section:'panels',id:'diary',direction:-1});
 const markup=dashboardFrame(l,{weight:'WEIGHT',logged_days:'LOGGED',sport_days:'SPORT'},{diary:'DIARY',weight_trend:'CHART',measurements:'MEASURES',body:'BODY',goals:'GOALS',appointment:'APPOINTMENT'});
 assert.ok(markup.indexOf('DIARY')<markup.indexOf('CHART'));assert.ok(markup.indexOf('WEIGHT')<markup.indexOf('LOGGED'));
 l=changeDashboard(l,{type:'toggle',section:'panels',id:'weight_trend',visible:false});
 assert.ok(!dashboardFrame(l,{}, {weight_trend:'HIDDEN_CHART'}).includes('HIDDEN_CHART'));
});
test('onboarding offers exactly three radio choices and editor has explicit accessible ordering controls',()=>{
 const choices=presetChoices('diary',{onboarding:true});assert.equal((choices.match(/type="radio"/g)||[]).length,3);assert.equal((choices.match(/ checked/g)||[]).length,1);
 const html=dashboardEditor(dashboardPreset());assert.ok(html.includes('Subir Último peso'));assert.ok(html.includes('Columna de Registro de los días'));assert.ok(html.includes('En móvil'));assert.ok(html.includes('Vista previa'));
});
test('preference persistence confirms the exact layout, and failures do not mutate or claim success',async()=>{
 const input=changeDashboard(dashboardPreset('habits'),{type:'mobile-stats',value:'comfortable'}),snapshot=JSON.stringify(input),calls=[];
 const db={rpc:async(name,args)=>{calls.push({name,args});return {data:structuredClone(args.p_layout),error:null};}};
 assert.deepEqual(await saveDashboard(db,input),input);assert.equal(calls[0].name,'update_diary_dashboard');assert.deepEqual(Object.keys(calls[0].args),['p_layout']);assert.equal(JSON.stringify(input),snapshot);
 await assert.rejects(()=>saveDashboard({rpc:async()=>({data:null,error:Error('offline')})},input),/offline/);
 await assert.rejects(()=>saveDashboard({rpc:async()=>({data:dashboardPreset(),error:null})},input),/confirmar/);
 await assert.rejects(()=>saveDashboard({rpc:async()=>({data:null,error:null})},dashboardPreset()),/confirmar/);
});
test('nutrition and activity widgets honor selected dates and leave missing estimates unknown',()=>{
 const data=makeDemoData('2026-10-30');data.meals=[{date:'2026-10-29',kcal:2000,protein_g:null},{date:'2026-10-20',kcal:99999,protein_g:9999}];data.exercise=[{date:'2026-10-29',minutes:null,kcal_burned:null,activity:'<img src=x onerror=alert(1)>'}];data.day_status=[];
 const value=dashboardExtras({data,start:'2026-10-26',end:'2026-11-01',focusDate:'2026-10-29'});
 assert.ok(value.panels.nutrition.includes('2000'));assert.ok(!value.panels.nutrition.includes('99.999'));assert.ok(value.panels.nutrition.includes('0 días con cifras'));assert.ok(value.stats.activity_minutes.includes('—'));assert.ok(value.panels.activity.includes('&lt;img'));assert.ok(!value.panels.activity.includes('<img src=x'));
});
test('evolution panels exclude future data and never include private body photo paths',()=>{
 const data=makeDemoData('2026-10-30');data.weights.push({date:'2027-01-01',weight_kg:999});data.measurements.push({date:'2027-01-01',waist_cm:499});data.body_photos.push({date:'2026-10-29',front_photo:'body:private-owner/sensitive.jpg'});
 const value=dashboardExtras({data,start:'2026-10-26',end:'2026-11-01',focusDate:'2026-10-30'});
 assert.ok(!value.panels.weight_trend.includes('999'));assert.ok(!value.panels.measurements.includes('499'));assert.ok(!value.panels.body.includes('sensitive.jpg'));assert.ok(value.panels.body.includes('Con foto'));
});
