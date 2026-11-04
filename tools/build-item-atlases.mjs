/* node tools/build-item-atlases.mjs sources.json
   sources.json: seven absolute image paths, six region sheets then status sheet.
   Each region sheet is a 4x5 grid; the status sheet is 4x3. Requires sharp.
   Cropping/normalization are build-time only. The browser uses seven cached WebPs. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(await fs.readFile(path.join(root,'CATALOGO_ITENS.json'),'utf8'));
const items=catalog.itens,regions=[...new Set(items.map(i=>i.regiao))];
await fs.writeFile(path.join(root,'item-catalog.js'),'/* Generated from CATALOGO_ITENS.json; edit that source and run tools/build-item-atlases.mjs. */\nwindow.HELLWARD_ITEMS = '+JSON.stringify(items)+';\n');
const groups=regions.map(region=>items.filter(i=>i.regiao===region).map(i=>i.id));
const statusKeys=['click','dps','crit','luck','health','defense','strength','will','recovery','gold','compass','souls'];
const sources=process.argv[2]?JSON.parse(await fs.readFile(process.argv[2],'utf8')):null;
if(sources){
  if(sources.length!==7)throw Error('Expected six region sheets and one status sheet');
  await fs.mkdir(path.join(root,'assets/items/illustrated'),{recursive:true});
  for(let sheet=0;sheet<7;sheet++){
    const rows=sheet===6?3:5,count=sheet===6?12:groups[sheet].length;
    const input=sharp(sources[sheet]),meta=await input.metadata(),composite=[];
    for(let n=0;n<count;n++){
      const x=Math.floor((n%4)*meta.width/4),y=Math.floor(Math.floor(n/4)*meta.height/rows);
      const width=Math.floor((n%4+1)*meta.width/4)-x,height=Math.floor((Math.floor(n/4)+1)*meta.height/rows)-y;
      const tile=await input.clone().extract({left:x,top:y,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      let l=width,t=height,r=-1,b=-1;
      for(let py=0;py<height;py++)for(let px=0;px<width;px++)if(tile.data[(py*width+px)*4+3]>20){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}
      if(r<l||b<t)throw Error(`Empty icon: sheet ${sheet+1} tile ${n+1}`);
      const icon=await sharp(tile.data,{raw:tile.info}).extract({left:l,top:t,width:r-l+1,height:b-t+1}).resize(114,114,{fit:'inside'}).png().toBuffer({resolveWithObject:true});
      composite.push({input:icon.data,left:(n%4)*128+Math.floor((128-icon.info.width)/2),top:Math.floor(n/4)*128+Math.floor((128-icon.info.height)/2)});
    }
    const output=sheet===6?'assets/ui/status-icons.webp':`assets/items/illustrated/region-${sheet+1}.webp`;
    await sharp({create:{width:512,height:128*rows,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composite).webp({quality:90,alphaQuality:100}).toFile(path.join(root,output));
    console.log(`${output}: ${count} icons`);
  }
}
const monsters=JSON.parse(await fs.readFile(path.join(root,'data/monster-proportions.json'),'utf8'));
const script=`/* Bundled artwork lookup. Never accept image URLs from imported saves. */\n(()=>{\nconst groups=${JSON.stringify(groups)};\nconst descriptor=(src,n,rows)=>({src,col:n%4,row:Math.floor(n/4),cols:4,rows});\nconst items={};groups.forEach((ids,z)=>ids.forEach((id,n)=>items[id]=descriptor('assets/items/illustrated/region-'+(z+1)+'.webp',n,5)));\nconst status={};${JSON.stringify(statusKeys)}.forEach((key,n)=>status[key]=descriptor('assets/ui/status-icons.webp',n,3));\nwindow.HELLWARD_ART={items,status,monsters:${JSON.stringify(monsters)},sizeLabels:{small:'Pequeno',medium:'Médio',large:'Grande',giant:'Gigante',colossal:'Colossal'}};\n})();\n`;
await fs.writeFile(path.join(root,'game-art.js'),script);
console.log('game-art.js: 100 items, 12 status icons, 42 creature proportions');
