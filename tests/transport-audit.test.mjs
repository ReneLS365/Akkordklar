import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateTransport} from '../dist/engine.mjs';
import {quickPriceResult} from '../dist/transport-price.mjs';
import {traceMarkup} from '../dist/transport-visual.mjs';

test('A8 total agreement includes reload once in both amount and explanation',()=>{
 for(const config of [{ground:60,method:'manual'},{ground:20,special:true}]){
  const route=calculateTransport({...config,reload:true,agreementConfirmed:true,agreementNote:'Samlet aftale inkl. omlæsning',agreedRate:40});
  assert.equal(route.percent,40);
  assert.equal(route.reloadPercent,0);
  assert.equal(route.agreedIncludesReload,true);
  assert.equal(quickPriceResult({base:1000,transport:route}).amount,400);
  assert.doesNotMatch(traceMarkup(route),/Omlæsning på arbejdsstedet A31 →/);
 }
});
test('Missing whitespace price cannot silently become a zero without-T amount',()=>{
 assert.equal(quickPriceResult({base:1000,withoutT:'   ',transport:calculateTransport({ground:25})}).complete,false);
});
test('A6/A7 route boundaries retain full T basis in dismantling',()=>{
 for(const [method,d,pct] of [['manual',25,7],['manual',25.01,14],['wheels',35.01,21],['wheels',45.01,28],['wheels',55.01,35],['truck',150.01,14]]){
  const transport=calculateTransport({ground:d,method});
  const result=quickPriceResult({base:1000,withoutT:200,operation:'demontage',extra:50,transport});
  assert.equal(result.workBase,500);assert.equal(result.transportBase,800);
  assert.equal(result.amount,800*pct/100);assert.equal(result.workWithTransport,550+800*pct/100);
 }
});
