/* Verify raster resolution, transparency and duplicate files/pixels. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
(async()=>{
  const all=files(path.join(root,'assets')),bytes=new Map(),pixels=new Map(),raster=[];
  for(const file of all){
    const relative=path.relative(root,file),hash=digest(fs.readFileSync(file));
    assert.ok(!bytes.has(hash),`Duplicate file: ${relative} / ${bytes.get(hash)}`);bytes.set(hash,relative);
    if(!/\.(png|webp|jpe?g)$/i.test(file))continue;
    const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    // Invisible RGB values are irrelevant when comparing transparent artwork.
    for(let i=0;i<data.length;i+=4)if(data[i+3]===0)data[i]=data[i+1]=data[i+2]=0;
    const pixelHash=info.width+'x'+info.height+':'+digest(data);
    assert.ok(!pixels.has(pixelHash),`Duplicate raster pixels: ${relative} / ${pixels.get(pixelHash)}`);
    pixels.set(pixelHash,relative);raster.push(relative);
  }
  const creatures=JSON.parse(fs.readFileSync(path.join(root,'CREATURES.json'),'utf8'));
  const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/sprite-review.json'),'utf8'));
  assert.equal(creatures.length,42);assert.equal(new Set(creatures.map(c=>c.asset)).size,42,'Every creature needs its own canonical sprite');
  const replaced=new Set(audit.monsters.filter(c=>c.action==='replaced').map(c=>c.asset));
  for(const c of creatures){
    const file=path.join(root,c.asset),m=await sharp(file).metadata();
    assert.ok(m.hasAlpha,`${c.name}: missing transparent background`);
    assert.ok(Math.max(m.width,m.height)>=(c.type==='boss'?640:512),`${c.name}: source too small at ${m.width}x${m.height}`);
    const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let transparent=0,visible=0,border=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      const a=data[(y*info.width+x)*4+3];if(!a)transparent++;if(a>32)visible++;
      if((x===0||y===0||x===info.width-1||y===info.height-1)&&a>16)border++;
    }
    assert.ok(transparent>data.length/4*.04 && visible>data.length/4*.03,`${c.name}: blank sprite or opaque rectangular background`);
    if(replaced.has(c.asset))assert.equal(border,0,`${c.name}: artwork reaches the export edge`);
  }
  assert.equal(audit.monsters.length,42);
  assert.equal(audit.otherRaster.length,raster.length-42);
  console.log(`PASS ${creatures.length} unique transparent monster sprites with adequate resolution; ${raster.length} raster images / ${all.length} assets checked; no byte/pixel duplicates`);
})().catch(e=>{console.error(e);process.exitCode=1});
