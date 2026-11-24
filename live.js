/* 即時報價：開盤時間打開 App，就直接向鉅亨網的報價服務拿最新價格（大約延遲幾秒到 20 秒），
   不用等 GitHub 收盤後才更新。台股 9:00–13:30、美股（台灣時間晚上）開盤時，每 15 秒更新一次。
   只抓畫面上看得到的股票（排行、自選、打開的個股），不浪費。 */
(function(){
const API="https://ws.api.cnyes.com/ws/api/v1/quote/quotes/";
const EVERY=15e3;
const L={tw:{},us:{},idx:{}};window.LIVE=L;
let timer=null,busy=false,lastOk=0;
const tt=(zh,en)=>window.EN?en:zh;

function tpe(){const p=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Taipei",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());const g=k=>(p.find(x=>x.type===k)||{}).value;return {wd:g("weekday"),m:(+g("hour")%24)*60+ +g("minute")}}
function nyc(){const p=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());const g=k=>(p.find(x=>x.type===k)||{}).value;return {wd:g("weekday"),m:(+g("hour")%24)*60+ +g("minute")}}
const wk=d=>!["Sat","Sun"].includes(d);
window.twOpen=()=>{const t=tpe();return wk(t.wd)&&t.m>=8*60+59&&t.m<=13*60+36};
window.usOpen=()=>{const t=nyc();return wk(t.wd)&&t.m>=9*60+29&&t.m<=16*60+2};

async function quotes(syms){
  const out=[];
  for(let i=0;i<syms.length;i+=40){
    const part=syms.slice(i,i+40);
    try{const r=await fetch(API+part.join(",")+"?column=K",{cache:"no-store"});const j=await r.json();(j.data||[]).forEach(d=>out.push(d))}catch(e){}
  }
  return out;
}
function rec(d){return {px:d["6"],ch:d["11"],pct:d["56"],hi:d["12"],lo:d["13"],op:d["19"],prev:d["21"],vol:d["800001"]!=null?+d["800001"]:d["200013"],amt:d["200067"],t:d["200007"]}}

function twCodes(){
  const s=new Set();
  document.querySelectorAll("#list .item[data-c],#watch .item[data-w],[data-live]").forEach(el=>{const c=el.dataset.c||el.dataset.w||el.dataset.live;if(c)s.add(c)});
  try{(JSON.parse(localStorage.getItem("tw_watch"))||[]).forEach(c=>s.add(c))}catch(e){}
  return [...s].filter(c=>/^\d{4,6}[A-Z]?$/.test(c)).slice(0,120);
}
function usCodes(){
  const s=new Set();
  document.querySelectorAll(".usrow[data-k],[data-live-us]").forEach(el=>{const c=el.dataset.k||el.dataset.liveUs;if(c&&!/^\^/.test(c))s.add(c)});
  return [...s].slice(0,80);
}
const f2=(n,d=2)=>n==null||isNaN(n)?"—":Number(n).toLocaleString("zh-TW",{minimumFractionDigits:d,maximumFractionDigits:d});
const cl=n=>n>0?"up":n<0?"down":"flat";
const sT=(el,v)=>{if(el&&el.textContent!==v)el.textContent=v},sH=(el,v)=>{if(el&&el.dataset.h!==v){el.dataset.h=v;el.innerHTML=v}},sC=(el,v)=>{if(el&&el.className!==v)el.className=v};
function flash(el,dir){if(!el)return;el.classList.remove("lvup","lvdn");void el.offsetWidth;el.classList.add(dir>0?"lvup":"lvdn")}

function paintTW(){
  const D=window.D;
  // 大盤
  const I=L.idx.TSE01;
  if(I&&D&&D.idx){
    const old=D.idx.close;D.idx.close=I.px;D.idx.prev=I.prev||D.idx.prev;D.idx.high=I.hi;D.idx.low=I.lo;D.idx.open=I.op;
    const ch=I.px-D.idx.prev,pct=ch/D.idx.prev*100,big=document.getElementById("idxBig"),c=document.getElementById("idxChg");
    if(big){sT(big,f2(I.px));sC(big,"big "+cl(ch)+(big.classList.contains("lvup")?" lvup":big.classList.contains("lvdn")?" lvdn":""));if(old!==I.px)flash(big,I.px-old)}
    sT(document.getElementById("prevV"),f2(D.idx.prev));
    const sm=document.getElementById("summary");
    if(sm){const w=window.EN?(pct>=1.5?"jumped":pct>=0.5?"rose":pct>0?"edged up":pct===0?"was flat":pct>-0.5?"edged down":pct>-1.5?"fell":"dropped sharply"):(pct>=1.5?"大漲":pct>=0.5?"上漲":pct>0?"小漲":pct===0?"平盤":pct>-0.5?"小跌":pct>-1.5?"下跌":"大跌");
      const h=sm.innerHTML.replace(/^(今天台股|Taiwan stocks )<b class="[^"]*">[^<]*<\/b> [\d.]+%( today)?/,(m,a,b)=>`${a}<b class="${cl(ch)}">${w}</b> ${Math.abs(pct).toFixed(2)}%${b||""}`);
      if(h!==sm.innerHTML)sm.innerHTML=h}
    if(c){sC(c,"chg "+cl(ch));sT(c,`${ch>0?"▲":ch<0?"▼":"–"} ${f2(Math.abs(ch))}（${pct>0?"+":""}${pct.toFixed(2)}%）`)}
  }
  // 更新 D 裡面的股票，之後重畫也會是新的價格
  if(D&&D.stocks){const m={};D.stocks.forEach(s=>m[s[0]]=s);
    for(const c in L.tw){const q=L.tw[c],s=m[c];if(!s||q.px==null)continue;s[4]=q.px;s[5]=q.ch;if(q.amt)s[2]=Math.round(q.amt/1e6)/100;if(q.vol!=null)s[3]=q.vol;if(q.hi!=null){s[6]=q.hi;s[7]=q.lo}}}
  document.querySelectorAll("#list .item[data-c],#watch .item[data-w]").forEach(el=>{
    const q=L.tw[el.dataset.c||el.dataset.w];if(!q||q.px==null)return;
    const px=el.querySelector(".rt .px"),b=el.querySelector(".rt .badge");
    const was=px?parseFloat(px.textContent.replace(/,/g,"")):null;
    sT(px,q.px.toLocaleString());
    if(b){sC(b,"badge "+cl(q.ch));sT(b,`${q.ch>0?"▲":q.ch<0?"▼":"–"} ${Math.abs(q.pct||0).toFixed(2)}%`)}
    if(was!=null&&was!==q.px)flash(px,q.px-was);
  });
  document.querySelectorAll("[data-live]").forEach(el=>{const q=L.tw[el.dataset.live];if(!q||q.px==null)return;
    sH(el,`<span class="lvdot"></span>${tt("即時","Live")} <b>${f2(q.px)}</b> <span class="${cl(q.ch)}">${q.ch>0?"+":""}${f2(q.ch)}（${q.pct>0?"+":""}${f2(q.pct)}%）</span> <span class="sub">${tt("高","H")} ${f2(q.hi)} ${tt("低","L")} ${f2(q.lo)} · ${tm(q.t)}</span>`)});
}
function paintUS(){
  document.querySelectorAll(".usrow[data-k]").forEach(el=>{const q=L.us[el.dataset.k];if(!q||q.px==null)return;
    const px=el.querySelector(".px"),pc=el.querySelector(".pc");const was=px?parseFloat(px.textContent.replace(/[$,]/g,"")):null;
    sT(px,"$"+f2(q.px));if(pc){sC(pc,"pc "+cl(q.ch));sT(pc,`${q.pct>0?"+":""}${f2(q.pct)}%`)}
    if(was!=null&&Math.abs(was-q.px)>1e-9)flash(px,q.px-was)});
  document.querySelectorAll("[data-live-us]").forEach(el=>{const q=L.us[el.dataset.liveUs];if(!q||q.px==null)return;
    sH(el,`<span class="lvdot"></span>${tt("即時","Live")} <b>$${f2(q.px)}</b> <span class="${cl(q.ch)}">${q.ch>0?"+":""}${f2(q.ch)}（${q.pct>0?"+":""}${f2(q.pct)}%）</span> <span class="sub">${tt("高","H")} ${f2(q.hi)} ${tt("低","L")} ${f2(q.lo)} · ${tm(q.t)}</span>`)});
}
function tm(t){if(!t)return "";const d=new Date(t*1000);return d.toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}
function status(){
  const tw=twOpen(),us=usOpen(),ago=lastOk?Math.round((Date.now()-lastOk)/1000):null;
  document.querySelectorAll(".liveBar").forEach(el=>{
    const mk=el.dataset.mk,on=mk==="us"?us:tw;
    if(!on){el.hidden=true;return}
    el.hidden=false;
    el.innerHTML=`<span class="lvdot"></span><b>${mk==="us"?tt("美股盤中","US market open"):tt("台股盤中","Taiwan market open")}</b> · ${ago!=null?tt(`即時價格 ${ago} 秒前更新`,`live, updated ${ago}s ago`):tt("正在拿即時價格…","getting live prices…")}<span class="sub"> ${tt("（約延遲 5–20 秒，每 15 秒自動更新）","(5–20s delay, refreshes every 15s)")}</span>`;
  });
}
async function tick(){
  if(busy||document.hidden)return;busy=true;
  try{
    const tw=twOpen(),us=usOpen(),syms=[];
    if(tw){syms.push("TWS:TSE01:INDEX","TWS:OTC01:INDEX");twCodes().forEach(c=>syms.push(`TWS:${c}:STOCK`))}
    if(us)usCodes().forEach(c=>syms.push(`USS:${c.replace("-",".")}:STOCK`));
    if(syms.length){
      const data=await quotes(syms);
      data.forEach(d=>{const id=String(d["0"]||"").split(":");if(id.length<3)return;const q=rec(d);
        if(id[2]==="INDEX")L.idx[id[1]]=q;else if(id[0]==="TWS")L.tw[id[1]]=q;else if(id[0]==="USS")L.us[id[1].replace(".","-")]=q});
      if(data.length)lastOk=Date.now();
      if(tw)paintTW();if(us)paintUS();
    }
  }finally{busy=false;status()}
}
function start(){if(timer)return;tick();timer=setInterval(tick,EVERY);setInterval(status,1000)}
// 畫面重畫之後（換排序、打開個股…）馬上補上即時價格
let rq;const again=()=>{clearTimeout(rq);rq=setTimeout(()=>{if(twOpen())paintTW();if(usOpen())paintUS();const need=[...document.querySelectorAll("[data-live],[data-live-us],#list .item[data-c],.usrow[data-k]")].some(el=>{const c=el.dataset.live||el.dataset.c;const u=el.dataset.liveUs||el.dataset.k;return (c&&!L.tw[c]&&twOpen())||(u&&!L.us[u]&&usOpen())});if(need)tick()},120)};
new MutationObserver(ms=>{if(ms.some(m=>!(m.target.closest&&m.target.closest(".liveBar"))&&!(m.target.parentElement&&m.target.parentElement.closest&&m.target.parentElement.closest(".liveBar"))))again()}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick()});
window.liveTick=tick;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
