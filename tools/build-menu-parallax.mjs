/* node tools/build-menu-parallax.mjs sources.json
   Six local source paths: sky, distant ruins, lava valley, cliff, knight, mist.
   Uses Sharp at build time only. The browser receives optimized WebP planes.
   Source artwork: user-provided 1672×941 transparent layers. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sources=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
if(!Array.isArray(sources)||sources.length!==6)throw Error('Expected six source paths');
const width=1672,height=941,out=path.join(root,'assets/menu/parallax');
await fs.mkdir(out,{recursive:true});
const blank=()=>sharp({create:{width,height,channels:4,background:'#00000000'}});
const buffers=await Promise.all(sources.map(src=>sharp(src).resize(width,height).ensureAlpha().png().toBuffer()));
// The supplied knight is centered on its own sheet. Reposition it onto the
// left cliff; baking both together guarantees their contact during movement.
const knight=await sharp(buffers[4]).resize(Math.round(width*.63),Math.round(height*.63)).png().toBuffer();
const cliff=await blank().composite([{input:buffers[3],left:0,top:210}]).png().toBuffer();
const foreground=await sharp(cliff).composite([{input:knight,left:-220,top:265}]).png().toBuffer();
const ruins=await blank().composite([{input:buffers[1],left:0,top:-60}]).png().toBuffer();
const background=await sharp(buffers[0]).composite([{input:ruins},{input:buffers[2]}]).png().toBuffer();
const near=await sharp(foreground).composite([{input:buffers[5]}]).png().toBuffer();
const planes=[background,near];
const names=['background','foreground'];
for(let n=0;n<planes.length;n++){
 await sharp(planes[n]).resize(1536).webp({quality:83,alphaQuality:95,effort:6}).toFile(path.join(out,names[n]+'.webp'));
}
const poster=await sharp(planes[0]).composite(planes.slice(1).map(input=>({input}))).png().toBuffer();
await sharp(poster).webp({quality:86,effort:6}).toFile(path.join(root,'assets/ui/menu-scene.webp'));
await sharp(poster).resize(960).webp({quality:80,effort:6}).toFile(path.join(root,'assets/ui/menu-scene-mobile.webp'));
console.log('Built two parallax planes and two static posters');
