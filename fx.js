/* 按鍵特效、背景光點、載入動畫：跟行事曆同一套（忍者＝紅色光點、手裏劍飛過、點擊刀光；咒術＝紫藍光點、光痕、點擊光環）。
   只在忍者／咒術外觀開啟；系統設定「減少動態效果」時自動關閉。 */
(function(){
const root=document.documentElement;
const style=()=>root.dataset.theme||"";
const reduceMo=()=>matchMedia("(prefers-reduced-motion:reduce)").matches;
const fxOn=()=>(style()==="jjk"||style()==="ninja")&&!reduceMo();

/* ---------- 載入動畫（三種外觀各一種） ---------- */
const SHK='<svg class="ln" viewBox="0 0 24 24"><path d="M12 1l3.1 7.9L23 12l-7.9 3.1L12 23l-3.1-7.9L1 12l7.9-3.1z" fill="currentColor"/><circle cx="12" cy="12" r="2.4" fill="var(--card)"/></svg>';
window.loaderHTML=(small)=>`<div class="ldr${small?" s":""}">${SHK}<div class="lc"><i></i><i></i><i></i></div><div class="lj"></div></div>`;

/* 開場畫面 */
let sp=document.getElementById("splash");
if(!sp){sp=document.createElement("div");sp.id="splash";sp.innerHTML=window.loaderHTML(false)+"<b>股票客製助理</b>";document.body.appendChild(sp)}
const hideSplash=()=>{sp.classList.add("off");setTimeout(()=>sp.remove(),550)};
if(document.readyState==="complete")setTimeout(hideSplash,700);else window.addEventListener("load",()=>setTimeout(hideSplash,700));
setTimeout(hideSplash,2600); // 保險：最多 2.6 秒

/* 重新整理按鈕：轉圈時換成小載入動畫 */
const rf=document.getElementById("refresh");
if(rf){new MutationObserver(()=>rf.classList.toggle("ldring",rf.classList.contains("spin"))).observe(rf,{attributes:true,attributeFilter:["class"]})}

/* ---------- 背景光點（canvas） ---------- */
const fx=document.createElement("canvas");fx.id="fx";document.body.prepend(fx);
const fc=fx.getContext("2d");let fW=0,fH=0,dots=[],slash=null,thr=null,fxRun=false,fxT=0;
function fxSize(){const d=Math.min(2,devicePixelRatio||1);fW=fx.width=innerWidth*d;fH=fx.height=innerHeight*d;fx._d=d}
function fxInit(){fxSize();dots=Array.from({length:34},()=>({x:Math.random()*fW,y:Math.random()*fH,r:(.6+Math.random()*1.6)*fx._d,v:(.12+Math.random()*.36)*fx._d,p:Math.random()*6.28,h:Math.random()<.35?200:255}))}
function star(c,x,y,R,r,rot){c.beginPath();for(let i=0;i<8;i++){const a=rot+i*Math.PI/4,rad=i%2?r:R;i?c.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad):c.moveTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad)}c.closePath()}
function fxLoop(t){
  if(!fxOn()||document.hidden){fxRun=false;fc.clearRect(0,0,fW,fH);return}
  const nn=style()==="ninja",d=fx._d;
  fc.clearRect(0,0,fW,fH);fc.globalCompositeOperation=nn?"source-over":"lighter";
  dots.forEach(o=>{o.y-=o.v*(nn?1.15:1);o.x+=Math.sin(t/1800+o.p)*.25*d;if(o.y<-10){o.y=fH+10;o.x=Math.random()*fW}
    const a=.22+.4*Math.abs(Math.sin(t/900+o.p)),g=fc.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*4);
    if(nn){g.addColorStop(0,`hsla(${o.h<230?350:14},90%,58%,${a*.7})`);g.addColorStop(1,"hsla(352,90%,50%,0)")}
    else{g.addColorStop(0,`hsla(${o.h},100%,80%,${a})`);g.addColorStop(1,`hsla(${o.h},100%,60%,0)`)}
    fc.fillStyle=g;fc.beginPath();fc.arc(o.x,o.y,o.r*4,0,6.28);fc.fill()});
  if(nn){
    if(!thr&&t-fxT>9000){const lr=Math.random()<.5,y0=fH*(.12+Math.random()*.5);thr={x0:lr?-40*d:fW+40*d,y0,x1:lr?fW+40*d:-40*d,y1:y0+fH*(.08+Math.random()*.2),t0:t};fxT=t}
    if(thr){const p=(t-thr.t0)/1500;if(p>=1)thr=null;else{for(let k=6;k>=0;k--){const q=Math.max(0,p-k*.02),x=thr.x0+(thr.x1-thr.x0)*q,y=thr.y0+(thr.y1-thr.y0)*q;fc.fillStyle=k?`rgba(224,56,75,${(1-k/7)*.45})`:"#e0384b";star(fc,x,y,(15-k)*d,(4.2-k*.3)*d,t/65);fc.fill();if(!k){fc.fillStyle="#fff";fc.beginPath();fc.arc(x,y,2*d,0,6.28);fc.fill()}}}}
  }else{
    if(!slash&&t-fxT>8000){slash={x:Math.random()*fW*.6,y:Math.random()*fH*.5,l:fW*.5,a:1};fxT=t}
    if(slash){const s=slash;s.a-=.025;if(s.a<=0)slash=null;else{fc.strokeStyle=`rgba(170,185,255,${s.a*.7})`;fc.lineWidth=2*d;fc.shadowColor="#7c6bff";fc.shadowBlur=18*d;fc.beginPath();fc.moveTo(s.x,s.y);fc.lineTo(s.x+s.l*(1-s.a*.3),s.y+s.l*.55*(1-s.a*.3));fc.stroke();fc.shadowBlur=0}}
  }
  requestAnimationFrame(fxLoop)}
function fxStart(){if(fxRun||!fxOn())return;if(!dots.length)fxInit();fxRun=true;fxT=performance.now();requestAnimationFrame(fxLoop)}
addEventListener("resize",()=>{if(dots.length)fxInit()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)fxStart()});
new MutationObserver(fxStart).observe(root,{attributes:true,attributeFilter:["data-theme"]});
fxStart();

/* ---------- 點擊特效 ---------- */
document.addEventListener("pointerdown",e=>{if(!fxOn())return;
  const add=(el,ms)=>{el.style.left=e.clientX+"px";el.style.top=e.clientY+"px";document.body.appendChild(el);setTimeout(()=>el.remove(),ms)};
  if(style()==="jjk"){const r=document.createElement("i");r.className="tap";add(r,700);
    for(let k=0;k<7;k++){const a=k/7*6.28+Math.random(),dd=26+Math.random()*26,p=document.createElement("b");p.className="spk";p.style.setProperty("--dx",Math.cos(a)*dd+"px");p.style.setProperty("--dy",Math.sin(a)*dd+"px");add(p,650)}}
  else{const c=document.createElement("i");c.className="cut";c.style.setProperty("--r",(-65+Math.random()*50)+"deg");add(c,520);
    for(let k=0;k<4;k++){const a=k/4*6.28+Math.random()*.8,dd=30+Math.random()*26,p=document.createElement("b");p.className="skk";p.style.setProperty("--dx",Math.cos(a)*dd+"px");p.style.setProperty("--dy",Math.sin(a)*dd+"px");add(p,650)}}
},{passive:true});
})();
