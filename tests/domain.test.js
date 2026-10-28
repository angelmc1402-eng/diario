import {test} from 'node:test'; import assert from 'node:assert/strict';
import {addDays,periodFor,weekCount,escapeHtml,weightPoints,localDate} from '../src/domain.js';
test('quincenas de 14 días y cambio de año',()=>{assert.equal(addDays('2026-10-28',14),'2026-11-11');assert.equal(addDays('2026-12-28',6),'2027-01-03');assert.equal(periodFor('2026-10-28','2026-11-10'),'2026-10-28');assert.equal(periodFor('2026-10-28','2026-11-11'),'2026-11-11');});
test('deporte cuenta días distintos y respeta límites semanales',()=>assert.equal(weekCount([{date:'2026-10-28'},{date:'2026-10-28'},{date:'2026-11-03'},{date:'2026-11-04'}],'2026-10-28'),2));
test('escapa contenido introducido por el usuario',()=>assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;'));
test('gráfica respeta distancia temporal y pesos constantes',()=>{const p=weightPoints([{date:'2026-10-28',weight_kg:138},{date:'2026-11-11',weight_kg:138}]); assert.equal(p[1].x-p[0].x,620);assert.ok(p.every(x=>Number.isFinite(x.y)));});
test('fecha local de Madrid durante cambio de día UTC',()=>assert.equal(localDate(new Date('2026-10-28T23:30:00Z')),'2026-10-29'));
