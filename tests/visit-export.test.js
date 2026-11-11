import test from 'node:test';
import assert from 'node:assert/strict';
import {withCover,savedMealPhotos} from '../src/meal-photos.js';
import {visitData} from '../src/visit-data.js';
import {buildVisitPdf,visitFilename} from '../src/visit-pdf.js';
import {makeDemoData} from '../src/demo-data.js';
test('cover selection preserves every photo and the relative order of remaining photos',()=>{const photos=['a','b','c'];assert.deepEqual(withCover(photos,'c'),['c','a','b']);assert.deepEqual(photos,['a','b','c']);assert.deepEqual(withCover(photos,'absent'),photos);assert.deepEqual(withCover([],null),[]);});
test('new draft cover maps to its uploaded path and can follow an existing cover',()=>{const drafts=[{key:'draft:1'},{key:'draft:2'}];assert.deepEqual(savedMealPhotos(['old'],drafts,['new1','new2'],'draft:2'),['new2','old','new1']);assert.deepEqual(savedMealPhotos(['old'],drafts,['new1','new2'],'old'),['old','new1','new2']);assert.throws(()=>savedMealPhotos([],drafts,['new1'],'draft:2'));});
test('period export includes only selected daily records and explicitly labelled references',()=>{const data=makeDemoData('2026-10-28'),model=visitData(data,'2026-10-26','2026-11-01','2026-10-28');assert.equal(model.days.length,7);assert.equal(model.meals.length,15);assert.equal(model.summary.kcal.days,3);assert.equal(model.days.filter(d=>d.hasRecords).length,3);assert.ok(model.previousWeight.date<'2026-10-26');assert.ok(model.weights.every(w=>w.date>='2026-10-26'));assert.equal(model.nextAppointment.local_date,'2026-11-04');assert.equal(model.body.length,0);assert.equal(visitFilename(model),'GoingFit-semana-2026-10-26-2026-11-01.pdf');});
test('fortnight goal includes natural-week exercise outside the exported date range',()=>{const data={profiles:[{}],exercise:[{id:'a',date:'2026-10-27',activity:'Caminar',minutes:20},{id:'b',date:'2026-10-28',activity:'Caminar',minutes:20}],goals:[{id:'g',title:'Deporte',tracking:'weekly_exercise',weekly_target:3,start_date:'2026-10-28',end_date:'2026-11-10'}]};const model=visitData(data,'2026-10-28','2026-11-10','2026-10-28');assert.equal(model.exercise.length,1);assert.equal(model.goals[0].windows[0].value,2);assert.deepEqual(model.contextExercise.map(x=>x.id),['a']);assert.equal(model.days[0].burn.value,null);});
test('unknown nutrition is not zero and a confirmed rest day is recorded',()=>{const model=visitData({profiles:[{}],meals:[{date:'2026-10-28',meal_type:'comida',kcal:0}],day_status:[{date:'2026-10-29',exercise_complete:true}]},'2026-10-26','2026-11-01');assert.equal(model.summary.kcal.value,0);assert.equal(model.summary.kcal.days,1);assert.equal(model.summary.protein.value,null);assert.equal(model.summary.burn.value,0);assert.equal(model.summary.burn.days,1);assert.equal(model.days.filter(x=>x.hasRecords).length,2);});
test('rejects inverted or oversized periods',()=>{assert.throws(()=>visitData({},'2026-11-01','2026-10-26'));assert.throws(()=>visitData({},'2026-10-01','2026-11-01'));});
test('PDF excludes body images unless explicitly selected and tolerates missing food photos',async()=>{const data=makeDemoData('2026-10-28'),model=visitData(data,'2026-10-21','2026-10-27','2026-10-28'),requested=[];const {doc,warnings}=await buildVisitPdf(model,{report:'complete',getImage:async path=>{requested.push(path);throw Error('Offline');}});assert.ok(requested.length>0);assert.ok(requested.every(path=>!path.startsWith('demo:body')));assert.equal(warnings,new Set(requested).size);assert.ok(doc.getNumberOfPages()>7);const included=[];await buildVisitPdf(model,{report:'complete',mealPhotos:false,bodyPhotos:true,getImage:async path=>{included.push(path);return null;}});assert.equal(included.length,3);assert.ok(included.every(path=>path.startsWith('demo:body')));});
test('long notes paginate, preserve source and produce an actual PDF',async()=>{const data={profiles:[{display_name:'Prueba de exportación'}],meals:[{date:'2026-10-28',meal_type:'comida',notes:'Verduras y pescado. '.repeat(1000),photos:[]}]};const original=JSON.stringify(data),model=visitData(data,'2026-10-26','2026-11-01');const {doc}=await buildVisitPdf(model,{report:'complete',mealPhotos:false});assert.ok(doc.getNumberOfPages()>5);assert.equal(doc.output().slice(0,5),'%PDF-');assert.equal(JSON.stringify(data),original);});
test('meal summary keeps exactly one page per day, including empty days and long notes',async()=>{
 const data={profiles:[{display_name:'Resumen de prueba'}],meals:[{date:'2026-10-28',meal_type:'comida',notes:'Nota muy larga. '.repeat(1000),photos:Array.from({length:7},(_,i)=>'meal-'+i)}],exercise:[{date:'2026-10-28',activity:'PRIVATE_EXERCISE'}],body_photos:[{date:'2026-10-28',front_photo:'PRIVATE_BODY'}]},original=JSON.stringify(data);
 for(const days of [7,14]){
  const model=visitData(data,'2026-10-26',days===7?'2026-11-01':'2026-11-08'),requested=[];
  const {doc,warnings}=await buildVisitPdf(model,{bodyPhotos:true,getImage:async path=>{requested.push(path);throw Error('offline');}});
  assert.equal(doc.getNumberOfPages(),days);assert.equal(warnings,5);assert.deepEqual(requested,['meal-0','meal-1','meal-2','meal-3','meal-4']);
  const pdf=doc.output();assert.ok(!pdf.includes('PRIVATE_EXERCISE'));assert.ok(!pdf.includes('PRIVATE_BODY'));assert.equal(JSON.stringify(data),original);
 }
});
test('summary without photos makes no image requests and complete filenames stay compatible',async()=>{
 const model=visitData({meals:[{date:'2026-10-28',meal_type:'cena',photos:['private']} ]},'2026-10-26','2026-11-01');
 const {doc,warnings}=await buildVisitPdf(model,{mealPhotos:false,getImage:async()=>{assert.fail('No photo request expected');}});
 assert.equal(doc.getNumberOfPages(),7);assert.equal(warnings,0);
 assert.equal(visitFilename(model,'meals'),'GoingFit-comidas-semana-2026-10-26-2026-11-01.pdf');
 assert.equal(visitFilename(model,'complete'),visitFilename(model));
 await assert.rejects(buildVisitPdf(model,{report:'invalid'}));
});
test('daily summary collapses absent meals and embeds exercise emoji with a brief session description',async()=>{
 const model=visitData({meals:[{date:'2026-11-09',meal_type:'desayuno',notes:'Tostadas'}],exercise:[{date:'2026-11-09',activity:'Caminar',minutes:30,notes:'Por el parque'},{date:'2026-11-09',activity:'Fuerza',notes:'Piernas'}],day_status:[{date:'2026-11-10',exercise_complete:true}]},'2026-11-09','2026-11-15');
 const {doc}=await buildVisitPdf(model,{mealPhotos:false});
 const page=n=>doc.internal.pages[n].join('\n');
 assert.equal(doc.getNumberOfPages(),7);
 assert.ok(page(1).includes('Merienda'));assert.ok(page(1).includes('Comida'));
 assert.equal((page(1).match(/No hubo/g)||[]).length,4);
 for(const detail of ['Caminar','30 min','Por el parque','Fuerza','Piernas'])assert.ok(page(1).includes(detail));
 assert.match(page(1),/\/I\d+ Do/);assert.doesNotMatch(page(2),/\/I\d+ Do/);
 assert.ok(page(2).includes('Descanso confirmado.'));assert.ok(page(3).includes('Sin ejercicio registrado.'));
});
test('five recorded meals and long exercise notes still fit on one daily summary page',async()=>{
 const model=visitData({meals:['desayuno','almuerzo','comida','merienda','cena'].map(meal_type=>({date:'2026-11-09',meal_type,notes:'Texto largo. '.repeat(300)})),exercise:[{date:'2026-11-09',activity:'Caminar',notes:'Ejercicio largo. '.repeat(300)}]},'2026-11-09','2026-11-15');
 const {doc}=await buildVisitPdf(model,{mealPhotos:false});assert.equal(doc.getNumberOfPages(),7);
 const first=doc.internal.pages[1].join('\n');assert.ok(!first.includes('No hubo'));assert.ok(first.includes('Texto abreviado.'));
});
