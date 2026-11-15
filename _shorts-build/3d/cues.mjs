import {chromium} from 'playwright-core'; import fs from 'fs';
const b=await chromium.launch({executablePath:process.env.C,args:['--use-angle=metal']});
const p=await b.newPage(); await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForFunction('window.READY');
fs.writeFileSync('cues.json', JSON.stringify(await p.evaluate(()=>window.SFX))); await b.close();
