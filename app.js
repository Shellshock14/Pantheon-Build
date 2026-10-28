
'use strict';
const W=1500,H=2100, canvas=document.getElementById('card'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let art=null,artData=null,frame=null,token=0;
const cache={};
function loadFrame(){
  const key=$('color').value+'-'+$('variant').value;
  const n=++token;
  if(cache[key]){frame=cache[key];render();return;}
  const img=new Image();
  img.onload=()=>{if(n!==token)return;frame=cache[key]=img;render();};
  img.onerror=()=>{if(n!==token)return;frame=null;render();alert('Missing frame file: frames/'+key+'.png');};
  img.src='frames/'+key+'.png';
}
function roundedPath(x,y,w,h,r){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function textFit(value,x,y,maxWidth,maxSize,minSize,color){
  const str=String(value||'');if(!str)return;
  let size=maxSize;
  do{ctx.font=`bold ${size}px Georgia,serif`;if(ctx.measureText(str).width<=maxWidth)break;size-=2;}while(size>minSize);
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(str,x,y,maxWidth);
}
function wrapText(value,maxWidth){
  const lines=[];
  for(const para of String(value||'').split('\n')){
    let line='';
    for(const word of para.split(/\s+/)){
      const trial=line?line+' '+word:word;
      if(line&&ctx.measureText(trial).width>maxWidth){lines.push(line);line=word;}else line=trial;
    }
    lines.push(line);
  }
  return lines;
}
function render(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#111827';ctx.fillRect(0,0,W,H);
  // Image is clipped to the exact common art opening, then the transparent frame overlays it.
  ctx.save();roundedPath(109,192,1282,768,15);ctx.clip();
  if(art){
    const zoom=Number($('zoom').value)||1;
    const scale=Math.max(1282/art.width,768/art.height)*zoom;
    const w=art.width*scale,h=art.height*scale;
    ctx.drawImage(art,750-w/2+Number($('x').value),576-h/2+Number($('y').value),w,h);
  }else{
    ctx.fillStyle='#b9c6d1';ctx.fillRect(100,180,1300,790);
  }
  ctx.restore();
  if(frame)ctx.drawImage(frame,0,0,W,H);
  // Clouds stay white; title sits at top-left with safe margins.
  ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';
  let name=String($('name').value||'');let size=65;
  while(size>30){ctx.font=`bold ${size}px Georgia,serif`;if(ctx.measureText(name).width<910)break;size-=2;}
  ctx.fillStyle='#1b2737';ctx.fillText(name,155,113,920);
  ctx.restore();
  const dark=$('variant').value==='black';
  const rules=$('rules').value||'';
  ctx.save();ctx.fillStyle=dark?'#f5f0e6':'#22252d';ctx.textAlign='left';ctx.textBaseline='top';
  let lines=[],sz=54;
  for(;sz>=29;sz-=2){ctx.font=`${sz}px Georgia,serif`;lines=wrapText(rules,1110);if(lines.length*sz*1.32<=650)break;}
  ctx.font=`${sz}px Georgia,serif`;
  let y=1210;
  for(const line of lines){if(y+sz>1850)break;ctx.fillText(line,192,y);y+=sz*1.32;}
  ctx.restore();
  textFit($('vp').value,158,2001,63,54,25,'#172031');
  textFit($('cost').value,1324,2001,88,60,27,'#28221b');
}
function setArtData(data){
  artData=data;
  if(!data){art=null;render();return;}
  const img=new Image();
  img.onload=()=>{art=img;render();};
  img.onerror=()=>alert('Artwork could not be loaded.');
  img.src=data;
}
$('art').addEventListener('change',e=>{
  const f=e.target.files?.[0];if(!f)return;
  const reader=new FileReader();reader.onload=()=>setArtData(reader.result);reader.readAsDataURL(f);
});
$('color').addEventListener('change',()=>{$('preset').value='custom';loadFrame();});
$('variant').addEventListener('change',loadFrame);
['name','rules','cost','vp','zoom','x','y'].forEach(id=>$(id).addEventListener('input',render));
$('preset').addEventListener('change',()=>{
  if($('preset').value==='fate'){$('name').value='Fate';$('rules').value='';$('cost').value='0';$('vp').value='0';}
  if($('preset').value==='misfortune'){$('name').value='Misfortune';$('rules').value='';$('cost').value='0';$('vp').value='-1';}
  render();
});
$('reset').addEventListener('click',()=>{
  ['name','rules','cost','vp'].forEach(id=>$(id).value='');
  $('zoom').value=1;$('x').value=0;$('y').value=0;$('art').value='';$('preset').value='custom';setArtData(null);
});
function download(blob,name){
  const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
$('export').addEventListener('click',()=>canvas.toBlob(blob=>{if(blob)download(blob,'pantheon-card.png');},'image/png'));
$('save').addEventListener('click',()=>{
  const data={};
  for(const id of ['color','variant','preset','name','rules','cost','vp','zoom','x','y'])data[id]=$(id).value;
  data.artData=artData;
  download(new Blob([JSON.stringify(data)],{type:'application/json'}),'pantheon-project.json');
});
$('load').addEventListener('change',e=>{
  const f=e.target.files?.[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      for(const id of ['color','variant','preset','name','rules','cost','vp','zoom','x','y'])if(data[id]!==undefined)$(id).value=data[id];
      setArtData(data.artData||null);loadFrame();
    }catch(err){alert('Could not load project: '+err.message);}
  };reader.readAsText(f);
});
loadFrame();
