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

/* 新聞好壞消息標記（跟模型用的同一套詞） */
(function(){
const POS=["創新高", "新高", "大漲", "漲停", "飆", "噴", "攻頂", "勁揚", "走揚", "上漲", "收紅", "反彈", "強彈", "轉強", "看好", "樂觀", "利多", "受惠", "搶單", "接單", "訂單", "滿載", "擴產", "擴廠", "獲利成長", "獲利增", "獲利創", "營收創", "營收成長", "營收增", "年增", "月增", "雙增", "三率三升", "轉盈", "轉虧為盈", "優於預期", "超乎預期", "超預期", "優於", "上修", "調升", "調高", "目標價", "買進", "加碼", "買超", "回補", "增持", "大買", "熱門", "突破", "創高", "配息", "高殖利率", "股利", "回購", "庫藏股", "合作", "結盟", "拿下", "打入", "獨家", "首家", "量產", "認證", "獲選", "爆發", "動能", "需求強"],NEG=["新低", "大跌", "跌停", "重挫", "崩", "暴跌", "摔", "跌破", "走跌", "下跌", "收黑", "翻黑", "走弱", "轉弱", "看壞", "悲觀", "利空", "衝擊", "拖累", "砍單", "延後", "停工", "停產", "裁員", "減產", "關廠", "虧損", "轉虧", "由盈轉虧", "衰退", "年減", "月減", "雙減", "三率三降", "下滑", "不如預期", "低於預期", "遜於預期", "下修", "調降", "調低", "減碼", "賣出", "賣超", "倒貨", "大賣", "減持", "處置", "警示", "違約", "訴訟", "罰款", "調查", "制裁", "禁令", "關稅", "退市", "下市", "停牌", "掏空", "爆雷", "示警", "疑慮", "危機", "風險", "跳水", "失守"];
window.newsTone=function(t){t=t||"";let s=0;const chk=(w,d)=>{const i=t.indexOf(w);if(i>=0&&!/[不未沒無]/.test(t[i-1]||""))s+=d};POS.forEach(w=>chk(w,1));NEG.forEach(w=>chk(w,-1));return Math.max(-3,Math.min(3,s))};
window.toneTag=function(t){const s=newsTone(t);return s>0?'<i class="tone up">👍 好消息</i>':s<0?'<i class="tone down">👎 壞消息</i>':""};
window.toneSum=function(L){let g=0,b=0;(L||[]).forEach(x=>{const s=newsTone(x.t);if(s>0)g++;else if(s<0)b++});
  if(!g&&!b)return "";return `<p class="tonesum">${window.EN?"News tone":"新聞氣氛"}：👍 ${g} · 👎 ${b} · ${window.EN?"neutral":"中性"} ${(L||[]).length-g-b}</p>`};
})();
