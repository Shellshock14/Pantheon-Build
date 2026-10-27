'use strict';
const W=1500,H=2100,artRect={x:205,y:315,w:1090,h:535};
const $=id=>document.getElementById(id),canvas=$('card'),ctx=canvas.getContext('2d');
let artwork=null,artData=null,frame=null,frameToken=0;
const ids=['color','preset','variant','name','rules','cost','vp','zoom','x','y','customTextColor','textColor'];
const frameCache={};
function loadFrame(){
  const key=$('color').value+'-'+$('variant').value;
  const token=++frameToken;
  if(frameCache[key]){frame=frameCache[key];render();return;}
  frame=null;render();
  // Works with images in frames/, in the website root, or assets/frames/.
  // Relative URLs preserve the GitHub Pages repository prefix.
  const candidates=['./'+key+'.png','./frames/'+key+'.png','./assets/frames/'+key+'.png'];
  let next=0;
  function tryNext(){
    if(token!==frameToken)return;
    if(next>=candidates.length){
      frame=null;render();
      alert('Unable to load frame: '+key+'\nChecked: '+candidates.join(', ')+'\nCheck that '+key+'.png exists in your GitHub repository root.');
      return;
    }
    const url=candidates[next++];
    const im=new Image();
    im.onload=()=>{if(token!==frameToken)return;frameCache[key]=im;frame=im;render();console.info('Frame loaded:',url,im.naturalWidth,im.naturalHeight);};
    im.onerror=()=>{console.warn('Frame not found:',url);tryNext();};
    im.src=url;
  }
  tryNext();
}
// All text and medallion positions are in the 1500 x 2100 export coordinate system.
function customColor(defaultColor){return $('customTextColor').checked?$('textColor').value:defaultColor;}
function fitText(text,x,y,maxWidth,size,color,align='center',weight=900){
  if(!text)return;
  ctx.save();ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;
  ctx.lineJoin='round';ctx.strokeStyle='rgba(0,0,0,.32)';ctx.lineWidth=3;
  do{ctx.font=`${weight} ${size}px Georgia,serif`;if(ctx.measureText(String(text)).width<=maxWidth)break;size-=2;}while(size>23);
  ctx.strokeText(String(text),x,y);ctx.fillText(String(text),x,y);ctx.restore();
}
function wrap(text,maxWidth){const lines=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;}else line=next;}lines.push(line);}return lines;}
// Artwork is clipped behind the ornamental top banner, side flourishes and lower crest.
// Rounded/curved ends replace the old hard-edged rectangular artwork crop.
function clipArtworkWindow(){
  ctx.beginPath();
  ctx.moveTo(280,314);ctx.lineTo(1220,314);
  ctx.quadraticCurveTo(1292,314,1292,350);ctx.lineTo(1292,795);
  ctx.bezierCurveTo(1240,828,1160,833,1070,835);
  ctx.bezierCurveTo(930,844,840,830,750,830);
  ctx.bezierCurveTo(660,830,570,844,430,835);
  ctx.bezierCurveTo(340,833,260,828,207,795);
  ctx.lineTo(207,350);ctx.quadraticCurveTo(207,314,280,314);
  ctx.closePath();ctx.clip();
}
function render(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#192536';ctx.fillRect(0,0,W,H);
  if(artwork){ctx.save();ctx.beginPath();clipArtworkWindow();const zoom=+$('zoom').value,scale=Math.max(artRect.w/artwork.width,artRect.h/artwork.height)*zoom;const w=artwork.width*scale,h=artwork.height*scale;ctx.drawImage(artwork,artRect.x+(artRect.w-w)/2+(+$('x').value),artRect.y+(artRect.h-h)/2+(+$('y').value),w,h);ctx.restore();}
  else{ctx.save();clipArtworkWindow();ctx.fillStyle='#2b3547';ctx.fillRect(artRect.x,artRect.y,artRect.w,artRect.h);ctx.restore();fitText('UPLOAD ARTWORK',750,690,800,58,'#afbac9');}
  if(frame)ctx.drawImage(frame,0,0,W,H);
  // Center medallions stay blank: ornamental waves only.
  // Ornate wave flourishes are now baked into all 16 frame PNGs.
  fitText($('name').value,750,208,1030,88,customColor('#18151a'));
  const dark=$('variant').value==='black';
  ctx.save();ctx.textAlign='left';ctx.textBaseline='top';ctx.font='700 52px Georgia,serif';
  let y=1090;for(const line of wrap($('rules').value,1030)){
    if(y>1640)break;
    ctx.font='700 52px Georgia,serif';ctx.fillStyle=customColor(dark?'#ffffff':'#1b1a20');
    ctx.lineWidth=1.7;ctx.strokeStyle='rgba(0,0,0,.17)';ctx.strokeText(line,230,y);ctx.fillText(line,230,y);y+=68;
  }ctx.restore();
  // Bottom cost and VP medallions, centered within the circular artwork.
  if($('cost').value!=='')fitText($('cost').value,190,1860,150,128,customColor('#ffffff'));
  if($('vp').value!=='')fitText($('vp').value,1310,1860,150,128,customColor('#ffffff'));
}
function applyPreset(){const p=$('preset').value;if(p==='fate'||p==='misfortune'){$('color').value='white';$('name').value=p==='fate'?'Fate':'Misfortune';$('rules').value=p==='fate'?'+1 Favor':'';$('cost').value='0';$('vp').value=p==='fate'?'0':'1';}loadFrame();}
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();}
$('export').onclick=()=>download(canvas.toDataURL('image/png'),(($('name').value||$('color').value).toLowerCase().replace(/[^a-z0-9]+/g,'-')||'card')+'.png');
$('save').onclick=()=>{const data=Object.fromEntries(ids.map(id=>[id,id==='customTextColor'?$(id).checked:$(id).value]));data.artwork=artData;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));download(url,'pantheon-card-project.json');setTimeout(()=>URL.revokeObjectURL(url),5000);};
function setArtData(data){artData=data;if(!data){artwork=null;render();return;}const img=new Image();img.onload=()=>{artwork=img;render();};img.src=data;}
$('art').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>setArtData(reader.result);reader.readAsDataURL(f);};
$('load').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());for(const id of ids)if(data[id]!=null){if(id==='customTextColor')$(id).checked=!!data[id];else $(id).value=data[id];}syncColorControl();setArtData(data.artwork||null);loadFrame();}catch(err){alert('Could not open project: '+err.message);}};
$('reset').onclick=()=>{$('preset').value='custom';for(const id of ['name','rules','cost','vp'])$(id).value='';$('zoom').value=1;$('x').value=0;$('y').value=0;setArtData(null);render();};
function syncColorControl(){$('textColor').disabled=!$('customTextColor').checked;render();}
$('customTextColor').addEventListener('change',syncColorControl);$('textColor').addEventListener('input',render);
$('preset').addEventListener('change',applyPreset);$('color').addEventListener('change',()=>{$('preset').value='custom';loadFrame();});$('variant').addEventListener('change',loadFrame);for(const id of ['name','rules','cost','vp','zoom','x','y'])$(id).addEventListener('input',render);
loadFrame();
