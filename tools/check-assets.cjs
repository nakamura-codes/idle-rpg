/* Verify active local dependencies, computed art paths and retained source assets. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),seen=new Set(),missing=[];
function visit(file){
 file=file.split(/[?#]/)[0];if(!file||/^(https?:|data:|#|%23)/i.test(file))return;
 if(seen.has(file))return;seen.add(file);
 const local=path.resolve(root,file);assert.ok(local.startsWith(root+path.sep));
 if(!fs.existsSync(local)){missing.push(file);return;}
 if(!/\.(html|css|js|svg)$/.test(file))return;
 const text=fs.readFileSync(local,'utf8');
 if(file.endsWith('.html'))for(const m of text.matchAll(/(?:src|href)="([^"]+)"/g))visit(m[1]);
 if(file.endsWith('.css'))for(const m of text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))visit(m[1]);
 for(const m of text.matchAll(/['"](assets\/[^'"`$]+\.(?:png|webp|jpg|svg|mp3|woff|ttf)(?:\?[^'"]*)?)['"]/g))visit(m[1]);
}
visit('index.html');
const context={window:{},document:{addEventListener(){}}};vm.createContext(context);
for(const file of ['item-catalog.js','game-art.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8').replace('  new Game();','  window.__assetAudit={monsterSrc,ZONES};'),context);
for(const descriptor of [...Object.values(context.window.HELLWARD_ART.items),...Object.values(context.window.HELLWARD_ART.status)])visit(descriptor.src);
const roster=[];
for(let z=0;z<6;z++)for(let n=0;n<7;n++){const file=context.window.__assetAudit.monsterSrc(z,n).split('?')[0];visit(file);roster.push(file);}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'CATALOGO_ITENS.json'),'utf8'));
assert.equal(JSON.stringify(catalog.itens),JSON.stringify(context.window.HELLWARD_ITEMS),'Rebuild item-catalog.js from its JSON source');
assert.equal(catalog.itens.length,100);
for(const item of catalog.itens){
 const art=context.window.HELLWARD_ART.items[item.id];assert.ok(art,item.id);
 assert.equal(item.imagem,art.src);assert.equal(item.icone_atlas.coluna,art.col);assert.equal(item.icone_atlas.linha,art.row);
}
const creatures=JSON.parse(fs.readFileSync(path.join(root,'CREATURES.json'),'utf8'));
assert.equal(creatures.length,42);
for(const creature of creatures){visit(creature.asset);assert.equal(creature.asset,roster[(creature.region-1)*7+creature.slot]);}
// Retain the original licensed typeface required by the reproducible font build.
visit('assets/fonts/Dornen.ttf');visit('assets/fonts/LICENSE-Dornen.txt');
const allAssets=[];function list(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const f=dir+'/'+e.name;if(e.isDirectory())list(f);else allAssets.push(f);}}list('assets');
const orphans=allAssets.filter(file=>!seen.has(file));
assert.deepEqual(missing,[],'Missing active dependencies');
assert.deepEqual(orphans,[],'Unreferenced assets require review');
assert.deepEqual(fs.readdirSync(root).filter(file=>/\.(js|css)$/.test(file)&&!seen.has(file)),[],'Unloaded runtime code/styles require review');
console.log(`PASS active dependencies, 100 catalog icons, 42 creature sprites and licensed font sources; ${allAssets.length} assets, no missing/orphaned files`);
