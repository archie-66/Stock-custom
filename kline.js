/* K 線圖：每根 K 棒有開盤、最高、最低、收盤；下面是成交量；有 5 日、20 日均線。
   手指按住或滑動可以看那一天的數字。沒有開高低資料的舊資料會自動改畫折線。
   用法：klineHTML(id) 先放進畫面，再呼叫 drawKline(id, {d,o,h,l,c,v}, {cur:"$"}) */
(function(){
const tt=(zh,en)=>window.EN?en:zh;
const fmt=(n,d=2)=>n==null||isNaN(n)?"—":Number(n).toLocaleString("zh-TW",{minimumFractionDigits:d,maximumFractionDigits:d});
const STORE={};
window.klineHTML=function(id){
  return `<div class="kl" id="${id}"><div class="klbar"><div class="klr"><button data-n="20">${tt("1 個月","1M")}</button><button data-n="40">${tt("2 個月","2M")}</button><button data-n="60" class="on">${tt("3 個月","3M")}</button></div>
    <div class="kllg"><span class="m5">MA5</span><span class="m20">MA20</span></div></div>
    <div class="klinfo"></div><div class="klbox"></div></div>`;
};
function ma(arr,i,n){if(i+1<n)return null;let s=0;for(let k=i-n+1;k<=i;k++){if(arr[k]==null)return null;s+=arr[k]}return s/n}
function info(box,S,i,cur){
  const el=box.querySelector(".klinfo");if(i==null){el.innerHTML=`<span class="sub">${tt("按住 K 線可以看每天的開高低收","Hold on the chart to see each day")}</span>`;return}
  const p=i>0?S.c[i-1]:null,ch=p?(S.c[i]/p-1)*100:null,cl=ch>0?"up":ch<0?"down":"flat";
  el.innerHTML=`<b>${S.d[i].slice(5).replace("-","/")}</b>
    <span>${tt("開","O")} <i>${cur}${fmt(S.o[i]??S.c[i])}</i></span><span>${tt("高","H")} <i>${cur}${fmt(S.h[i]??S.c[i])}</i></span>
    <span>${tt("低","L")} <i>${cur}${fmt(S.l[i]??S.c[i])}</i></span><span>${tt("收","C")} <i class="${cl}">${cur}${fmt(S.c[i])}</i></span>
    ${ch!=null?`<span class="${cl}">${ch>=0?"+":""}${fmt(ch,2)}%</span>`:""}`;
}
window.drawKline=function(id,S,opt){
  const box=document.getElementById(id);if(!box||!S||!S.c||S.c.length<2)return;
  opt=opt||{};const cur=opt.cur||"";STORE[id]={S,opt};
  const n=+(box.querySelector(".klr button.on")||{dataset:{n:60}}).dataset.n;
  const N=S.c.length,a=Math.max(0,N-n),idx=[];for(let i=a;i<N;i++)idx.push(i);
  const hasK=idx.some(i=>S.h[i]!=null&&S.l[i]!=null&&S.o[i]!=null);
  const W=340,PH=170,VH=46,G=6,H=PH+G+VH+16,cw=W/idx.length,bw=Math.max(1.5,cw*.62);
  let hi=-1e18,lo=1e18;idx.forEach(i=>{hi=Math.max(hi,S.h[i]??S.c[i]);lo=Math.min(lo,S.l[i]??S.c[i])});
  const pad=(hi-lo)*.06||1;hi+=pad;lo-=pad;
  const y=v=>4+(hi-v)/(hi-lo)*(PH-8),x=k=>k*cw+cw/2;
  const vmax=Math.max(1,...idx.map(i=>S.v[i]||0)),vy=v=>PH+G+VH-(v/vmax)*VH;
  let g="";
  // 背景格線和價格
  for(let k=0;k<=3;k++){const v=lo+(hi-lo)*k/3,yy=y(v);g+=`<line x1="0" x2="${W}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}" class="klg"/><text x="${W-2}" y="${(yy-2).toFixed(1)}" class="klt" text-anchor="end">${fmt(v,v>=100?0:2)}</text>`}
  idx.forEach((i,k)=>{
    const c=S.c[i],o=S.o[i]??(i>0?S.c[i-1]:c),h=S.h[i]??Math.max(o,c),l=S.l[i]??Math.min(o,c),up=c>=o,cl=c>o?"up":c<o?"down":"flat",cx=x(k);
    if(hasK){g+=`<line x1="${cx.toFixed(1)}" x2="${cx.toFixed(1)}" y1="${y(h).toFixed(1)}" y2="${y(l).toFixed(1)}" class="kw ${cl}"/>`;
      const t=y(Math.max(o,c)),b=y(Math.min(o,c));g+=`<rect x="${(cx-bw/2).toFixed(1)}" y="${t.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1,b-t).toFixed(1)}" class="kb ${cl}"/>`}
    const vc=i>0&&S.c[i]<S.c[i-1]?"down":"up";g+=`<rect x="${(cx-bw/2).toFixed(1)}" y="${vy(S.v[i]||0).toFixed(1)}" width="${bw.toFixed(1)}" height="${(PH+G+VH-vy(S.v[i]||0)).toFixed(1)}" class="kv ${vc}"/>`;
  });
  if(!hasK)g+=`<polyline points="${idx.map((i,k)=>x(k).toFixed(1)+","+y(S.c[i]).toFixed(1)).join(" ")}" class="kline"/>`;
  [[5,"m5"],[20,"m20"]].forEach(([p,c])=>{const pts=[];idx.forEach((i,k)=>{const m=ma(S.c,i,p);if(m!=null)pts.push(x(k).toFixed(1)+","+y(m).toFixed(1))});if(pts.length>1)g+=`<polyline points="${pts.join(" ")}" class="kma ${c}"/>`});
  const d0=S.d[idx[0]].slice(5).replace("-","/"),d1=S.d[idx[idx.length-1]].slice(5).replace("-","/");
  g+=`<text x="2" y="${H-3}" class="klt">${d0}</text><text x="${W-2}" y="${H-3}" class="klt" text-anchor="end">${d1}</text>`;
  g+=`<line class="kx" x1="0" x2="0" y1="0" y2="${PH+G+VH}" style="display:none"/>`;
  box.querySelector(".klbox").innerHTML=`<svg viewBox="0 0 ${W} ${H}" class="klsvg">${g}</svg>${hasK?"":`<p class="sub" style="margin:4px 0 0">${tt("開盤、最高、最低價還在補資料，先用收盤價折線顯示。","Open/high/low still loading; showing closes as a line.")}</p>`}`;
  info(box,S,null,cur);
  const svg=box.querySelector("svg"),cross=svg.querySelector(".kx");
  const pick=ev=>{const r=svg.getBoundingClientRect(),px=((ev.touches?ev.touches[0].clientX:ev.clientX)-r.left)/r.width*W;const k=Math.max(0,Math.min(idx.length-1,Math.floor(px/cw)));
    cross.style.display="";cross.setAttribute("x1",x(k));cross.setAttribute("x2",x(k));info(box,S,idx[k],cur)};
  svg.onpointerdown=e=>{svg.setPointerCapture&&svg.setPointerCapture(e.pointerId);pick(e)};svg.onpointermove=e=>{if(e.buttons||e.pointerType==="touch")pick(e)};
  svg.onpointerup=svg.onpointercancel=()=>{cross.style.display="none";info(box,S,null,cur)};
  svg.addEventListener("touchmove",e=>{e.preventDefault();pick(e)},{passive:false});
};
document.addEventListener("click",e=>{const b=e.target.closest(".klr button");if(!b)return;const box=b.closest(".kl");box.querySelectorAll(".klr button").forEach(x=>x.classList.toggle("on",x===b));const s=STORE[box.id];if(s)drawKline(box.id,s.S,s.opt)});
/* 把 hist.json / us.json 的一檔轉成 K 線要的格式 */
window.klineSeries=function(D,code){
  const e=D&&D.s&&D.s[code];if(!e)return null;const o={d:[],o:[],h:[],l:[],c:[],v:[]};
  D.dates.forEach((d,i)=>{if(e[2][i]==null)return;o.d.push(d);o.c.push(e[2][i]);o.v.push((e[3]||[])[i]||0);o.o.push(e[5]?e[5][i]:null);o.h.push(e[6]?e[6][i]:null);o.l.push(e[7]?e[7][i]:null)});
  return o;
};
})();
