import {chromium} from 'playwright-core';
const b=await chromium.launch({executablePath:process.env.C,args:['--use-angle=metal','--enable-gpu']});
const WIDE=process.env.FMT==='wide';
const p=await b.newPage({viewport:WIDE?{width:960,height:540}:{width:540,height:960},deviceScaleFactor:2});
await p.goto('http://127.0.0.1:8777/index.html'+(WIDE?'?fmt=wide':'')); await p.waitForFunction('window.READY');
const ts=process.argv.slice(2).map(Number);
for(const t of ts){ const r=await p.evaluate(m=>window.PROBE(m),t*1000); console.log(String(t).padStart(4),'dot',JSON.stringify(r.dot).padEnd(12),'E',JSON.stringify(r.E).padEnd(12),'cam',JSON.stringify(r.cam)); }
await b.close();
