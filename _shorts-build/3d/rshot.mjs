// 시험판 렌더러 — 렌더러(render.mjs) 사본 + GPU 옵션 + READY 대기
import {chromium} from 'playwright-core'; import {spawn} from 'child_process'; import fs from 'fs';
const [mode, arg, out] = process.argv.slice(2);
const b=await chromium.launch({executablePath:process.env.C,args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:540,height:960},deviceScaleFactor:2});
p.on('pageerror',e=>console.log('err:',e.message)); p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') console.log('console:',m.text().slice(0,200)); });
await p.goto('http://127.0.0.1:8765/index.html?lang='+(process.env.VLANG||'ko')); await p.waitForFunction('window.READY',null,{timeout:60000});
const shot=async ms=>{await p.evaluate(m=>window.render(m),ms);return p.screenshot({type:'png'});};
if(mode==='stills'){ fs.mkdirSync(out,{recursive:true}); for(const s of arg.split(',')) fs.writeFileSync(`${out}/${s}.png`, await shot(Number(s)*1000)); }
else { const dur=await p.evaluate(()=>window.DURATION), T0=Number(process.env.T0||0), T1=Number(process.env.T1||dur), n=Math.round((T1-T0)*30);
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-i','-','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',arg],{stdio:['pipe','inherit','inherit']});
  const t0=Date.now(); for(let i=0;i<n;i++){const buf=await shot(T0*1000+i*1000/30); if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); if(i%150===0) process.stdout.write(`\r${i}/${n} ${((Date.now()-t0)/1000).toFixed(0)}s`);}
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); console.log(`\rdone ${n} frames ${((Date.now()-t0)/1000).toFixed(0)}s`); }
if(mode==='cues'){}
await b.close();
