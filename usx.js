/* 美股分頁：三大指數、Anthropic（ANT）、熱門美股排行、自選、點一檔看詳細或跳到預測分析 */
(function(){
const $=id=>document.getElementById(id);
const tt=(zh,en)=>window.EN?en:zh;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=(n,d=2)=>n==null||isNaN(n)?"—":Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=n=>n==null||isNaN(n)?"—":(n>=0?"+":"")+fmt(n,2)+"%";
const cl=n=>n>0?"up":n<0?"down":"flat";
const IPO={ANT:{px:83,date:"2026-11-19",name:"Anthropic"}};
const ZH=window.US_ZH={ANT:"Anthropic",SPCX:"SpaceX",AAPL:"蘋果",MSFT:"微軟",NVDA:"輝達",GOOGL:"Google（Alphabet）",AMZN:"亞馬遜",META:"Meta",TSLA:"特斯拉",AVGO:"博通",AMD:"超微",TSM:"台積電 ADR",ASML:"艾司摩爾",INTC:"英特爾",QCOM:"高通",MU:"美光",ARM:"安謀",SMCI:"美超微",ORCL:"甲骨文",CRM:"Salesforce",ADBE:"Adobe",NFLX:"Netflix",PLTR:"Palantir",SNOW:"Snowflake",UBER:"Uber",ABNB:"Airbnb",SHOP:"Shopify",COIN:"Coinbase",PYPL:"PayPal",V:"Visa",MA:"萬事達卡",JPM:"摩根大通",BAC:"美國銀行",GS:"高盛",MS:"摩根士丹利","BRK-B":"波克夏",WMT:"沃爾瑪",COST:"好市多",KO:"可口可樂",PEP:"百事",MCD:"麥當勞",NKE:"Nike",DIS:"迪士尼",SBUX:"星巴克",JNJ:"嬌生",PFE:"輝瑞",LLY:"禮來",UNH:"聯合健康",MRK:"默克",ABBV:"艾伯維",XOM:"艾克森美孚",CVX:"雪佛龍",BA:"波音",CAT:"開拓重工",GE:"奇異",F:"福特",GM:"通用汽車",RIVN:"Rivian",NIO:"蔚來",BABA:"阿里巴巴",PDD:"拼多多",SONY:"索尼",IBM:"IBM",CSCO:"思科",TXN:"德州儀器",AMAT:"應用材料",LRCX:"科林研發",KLAC:"科磊",MRVL:"邁威爾",DELL:"戴爾",SPOT:"Spotify",RBLX:"Roblox",NET:"Cloudflare",CRWD:"CrowdStrike",PANW:"Palo Alto",DDOG:"Datadog",ANET:"Arista",VRT:"Vertiv",CEG:"Constellation 能源",OKLO:"Oklo",IONQ:"IonQ",RGTI:"Rigetti",SOFI:"SoFi",HOOD:"Robinhood",MSTR:"Strategy",DUOL:"Duolingo",SPY:"SPDR S&P500 ETF",QQQ:"那斯達克 100 ETF",VOO:"Vanguard S&P500 ETF",VTI:"美國全市場 ETF",SOXX:"半導體 ETF",SMH:"半導體 ETF（VanEck）",ARKK:"方舟創新 ETF",TLT:"20 年美債 ETF",GLD:"黃金 ETF"};
let U=null,NW=null,loading=false,sel=null,sortBy="hot";
const watch=()=>{try{return JSON.parse(localStorage.getItem("tw_uswatch"))||[]}catch(e){return []}};
const setWatch=a=>{try{localStorage.setItem("tw_uswatch",JSON.stringify(a))}catch(e){}};
function last2(cs){const v=[];for(let i=cs.length-1;i>=0&&v.length<2;i--)if(cs[i]!=null)v.push([i,cs[i]]);return v}
function info(k){const e=U.s[k];if(!e)return null;const cs=e[2],vs=e[3],L=last2(cs);if(!L.length)return null;
  const c=L[0][1],p=L[1]?L[1][1]:null,ch=p?(c/p-1)*100:null,valid=cs.filter(x=>x!=null);
  const r20=valid.length>20?(c/valid[valid.length-21]-1)*100:null;
  return {k,n:ZH[k]||e[0],en:e[0],c,ch,r20,days:valid.length,date:U.dates[L[0][0]],cs:valid,v:vs[L[0][0]]}}
function spark(arr,w=110,h=34){if(!arr||arr.length<2)return "";const mn=Math.min(...arr),mx=Math.max(...arr),y=v=>h-3-(v-mn)/((mx-mn)||1)*(h-6),x=i=>i/(arr.length-1)*w;
  return `<svg class="usp ${cl(arr[arr.length-1]-arr[0])}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${arr.map((v,i)=>x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ")}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`}
function live(){const h=+((U.updatedAt||"").slice(11,13));return h>=21||h<5}
function renderIdx(){
  const N={SPX:"S&P 500",NDX:tt("那斯達克","Nasdaq"),DJI:tt("道瓊","Dow Jones"),SOX:tt("費城半導體","PHLX Semi")};
  $("usIdx").innerHTML=`<div class="usig">${Object.keys(N).filter(k=>U.idx[k]).map(k=>{const cs=U.idx[k][1].filter(x=>x!=null),c=cs[cs.length-1],p=cs[cs.length-2],ch=(c/p-1)*100;
    return `<div class="stat"><div class="sub">${N[k]}</div><b>${fmt(c)}</b><div class="${cl(ch)}" style="font-weight:700">${pct(ch)}</div>${spark(cs.slice(-30))}</div>`}).join("")}</div>
    <p class="sub" style="margin:8px 0 0">${live()?tt("⚠️ 最後一天是盤中價格（美國還沒收盤）· ",""):""}${tt(`資料日期 ${U.dates[U.dates.length-1]}（美國時間）· 台灣時間每天早上自動更新收盤價`,`US close · ${U.dates[U.dates.length-1]} (US time) · updates each Taiwan morning`)}</p>`;
}
function renderANT(){
  const box=$("usAnt");if(!box)return;const I=info("ANT"),ipo=IPO.ANT;
  if(!I){box.innerHTML=`<div class="usant"><div class="ic">🆕</div><div><b>Anthropic（ANT）</b><div class="sub">${tt("2026/11/19 在那斯達克上市，承銷價 $83。第一天的收盤價會在台灣時間明天早上更新到這裡。","Listed on Nasdaq on Nov 19, 2026 at an IPO price of $83. The first close will appear here tomorrow morning (Taiwan time).")}</div></div></div>`;return}
  const vs=(I.c/ipo.px-1)*100;
  box.innerHTML=`<button class="usant" data-k="ANT"><div class="ic">🆕</div><div style="flex:1;text-align:left"><b>Anthropic（ANT）</b><div class="sub">${tt(`上市 ${I.days} 天 · 承銷價 $${ipo.px}`,`${I.days} day(s) since listing · IPO $${ipo.px}`)}</div></div>
    <div style="text-align:right"><b style="font-size:20px">$${fmt(I.c)}</b><div class="${cl(vs)}" style="font-weight:700">${tt("比承銷價","vs IPO")} ${pct(vs)}</div></div></button>`;
  box.querySelector("button").onclick=()=>pick("ANT");
}
function renderList(){
  const all=Object.keys(U.s).map(info).filter(Boolean),W=watch();
  let L;if(sortBy==="hot")L=all.filter(x=>x.c!=null&&x.v!=null&&!/^\^/.test(x.k)).sort((a,b)=>b.c*b.v-a.c*a.v).slice(0,20);else if(sortBy==="watch")L=all.filter(x=>W.includes(x.k));else if(sortBy==="down")L=all.filter(x=>x.ch!=null).sort((a,b)=>a.ch-b.ch).slice(0,15);else L=all.filter(x=>x.ch!=null).sort((a,b)=>b.ch-a.ch).slice(0,15);
  $("usSort").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.s===sortBy));
  $("usList").innerHTML=L.length?L.map(x=>`<button class="usrow" data-k="${x.k}"><span class="nm"><b>${esc(x.n)}</b><span class="sub">${x.k}</span></span>${spark(x.cs.slice(-20),60,22)}<span class="px">$${fmt(x.c)}</span><span class="pc ${cl(x.ch)}">${pct(x.ch)}</span></button>`).join("")
    :`<p class="hint">${sortBy==="watch"?tt("還沒有自選美股。點一檔股票，再按「⭐ 加入自選」。","No US favorites yet. Open a stock and tap ⭐."):"—"}</p>`;
  $("usList").querySelectorAll(".usrow").forEach(b=>b.onclick=()=>pick(b.dataset.k));
}

/* ---------- 簡短分析（用資料自動寫出來的重點） ---------- */
function analysis(k,I){
  const out=[],cs=I.cs,n=cs.length,m=U.meta&&U.meta[k];
  if(n>=21){const ma=cs.slice(-20).reduce((a,b)=>a+b,0)/20,up=I.c>ma;
    out.push(["📈",tt(`股價在 20 日均線（$${fmt(ma)}）${up?"上面，短期趨勢偏強":"下面，短期趨勢偏弱"}。`,`Price is ${up?"above":"below"} its 20-day average ($${fmt(ma)}).`)])}
  if(I.r20!=null&&U.idx&&U.idx.SPX){const sp=U.idx.SPX[1].filter(x=>x!=null);if(sp.length>20){const r=(sp[sp.length-1]/sp[sp.length-21]-1)*100,d=I.r20-r;
    out.push(["🏁",tt(`近 20 天${I.r20>=0?"漲":"跌"} ${fmt(Math.abs(I.r20),1)}%，比 S&P 500 ${d>=0?"強":"弱"} ${fmt(Math.abs(d),1)} 個百分點。`,`${pct(I.r20)} over 20 days, ${fmt(Math.abs(d),1)} pts ${d>=0?"better":"worse"} than the S&P 500.`)])}}
  if(m&&m.hi&&m.lo&&m.hi>m.lo){const pos=(I.c-m.lo)/(m.hi-m.lo)*100;
    out.push(["📏",tt(`52 週價格區間 $${fmt(m.lo)}～$${fmt(m.hi)}，現在在 ${fmt(pos,0)}% 的位置（${pos>85?"接近一年高點":pos<15?"接近一年低點":"在中間"}）。`,`52-week range $${fmt(m.lo)}–$${fmt(m.hi)}; now at ${fmt(pos,0)}% of it.`)])}
  if(n>=21){const rs=[];for(let i=n-20;i<n;i++)rs.push(cs[i]/cs[i-1]-1);const mu=rs.reduce((a,b)=>a+b,0)/rs.length,sd=Math.sqrt(rs.reduce((a,b)=>a+(b-mu)**2,0)/rs.length)*100;
    out.push(["🎢",tt(`最近每天平均上下震盪 ${fmt(sd,1)}%，${sd>3.5?"波動很大，風險比較高":sd>1.8?"波動中等":"走勢相對穩定"}。`,`Moves about ${fmt(sd,1)}% a day lately: ${sd>3.5?"very volatile":sd>1.8?"moderate":"fairly steady"}.`)])}
  if(IPO[k]){const v=(I.c/IPO[k].px-1)*100;out.push(["🆕",tt(`剛上市 ${I.days} 天，比承銷價 $${IPO[k].px} ${v>=0?"高":"低"} ${fmt(Math.abs(v),1)}%。新股前幾週波動通常很大。`,`Listed ${I.days} day(s) ago, ${pct(v)} vs the $${IPO[k].px} IPO price. New listings are often volatile.`)])}
  return out;
}
function ago(d){if(!d)return "";const h=(Date.now()-new Date(d))/36e5;return h<1?tt("剛剛","just now"):h<24?tt(`${Math.floor(h)} 小時前`,`${Math.floor(h)}h ago`):tt(`${Math.floor(h/24)} 天前`,`${Math.floor(h/24)}d ago`)}
function newsHTML(k){
  if(!NW)return `<p class="sub">${tt("新聞讀取中…","Loading news…")}</p>`;
  const L=(NW.n||{})[k]||[];
  if(!L.length)return `<p class="sub">${tt("近三天沒有找到相關新聞。","No news found in the last 3 days.")}</p>`;
  return `<div class="usnews">${L.map(x=>`<a href="${esc(x.u)}" target="_blank" rel="noopener"><b>${esc(x.t)}</b><span class="sub">${esc(x.s||"")}${x.s?" · ":""}${ago(x.d)}</span></a>`).join("")}</div>
    <p class="sub" style="margin:6px 0 0">${tt("點標題會打開原始新聞網站。新聞只列標題，內容以原網站為準。","Tap a headline to open the original site.")}</p>`;
}
function renderSel(){
  const box=$("usSel");if(!sel){box.innerHTML=`<p class="hint">${tt("點上面任何一檔，這裡會顯示詳細。","Tap any stock above to see details here.")}</p>`;return}
  const I=info(sel);if(!I){box.innerHTML=`<p class="hint">${tt("這檔還沒有資料。","No data yet.")}</p>`;return}
  const W=watch(),on=W.includes(sel),vs=I.v!=null&&U.s[sel][3].filter(x=>x!=null).length>5?(()=>{const a=U.s[sel][3].filter(x=>x!=null);const avg=a.slice(-21,-1).reduce((p,q)=>p+q,0)/Math.max(1,a.slice(-21,-1).length);return I.v/avg})():null;
  const ipo=IPO[sel];
  box.innerHTML=`<h2>${esc(I.n)} <span class="sub">${sel}${I.n!==I.en?" · "+esc(I.en):""}</span></h2>
    <div class="pdprice"><b>$${fmt(I.c)}</b> <span class="${cl(I.ch)}">${pct(I.ch)}</span> <span class="sub">${I.date.slice(5).replace("-","/")} ${tt("收盤（美國時間）","close (US)")}</span></div>
    ${window.klineHTML?klineHTML("usKl"):spark(I.cs,320,90).replace('class="usp','class="usp big')}
    <div class="grid"><div class="stat"><div class="sub">${tt("近 20 天","Last 20 days")}</div><b class="${cl(I.r20)}">${pct(I.r20)}</b></div>
      <div class="stat"><div class="sub">${ipo?tt("比承銷價","vs IPO price"):tt("今天成交量","Volume today")}</div><b>${ipo?`<span class="${cl(I.c-ipo.px)}">${pct((I.c/ipo.px-1)*100)}</span>`:vs?fmt(vs,1)+tt(" 倍平常"," × normal"):"—"}</b></div></div>
    ${I.days<22?`<p class="hint">${tt(`這檔目前只有 ${I.days} 天的資料，預測分析需要至少 22 天。`,`Only ${I.days} day(s) of data; prediction needs 22.`)}</p>`:""}
    <h3 class="ush">🔮 ${tt("個股預測","Prediction")}</h3><div id="usPc">${window.loaderHTML?`<div style="display:flex;justify-content:center;padding:8px">${loaderHTML(true)}</div>`:""}</div>
    ${window.US_INFO&&US_INFO[sel]?`<h3 class="ush">📖 ${tt("公司簡介","About")}</h3><p class="usinfo"><span class="ustag">${esc(US_INFO[sel][0])}</span>${esc(US_INFO[sel][1])}</p>`
      :(m=>m?`<h3 class="ush">📖 ${tt("公司簡介","About")}</h3><p class="usinfo">${m.sec?`<span class="ustag">${esc(m.sec)}</span>`:""}${esc(m.ln||I.en||"")}${m.ex?` · ${esc(m.ex)}`:""}</p><p class="sub" style="margin:4px 0 0">${tt("這檔還沒有中文介紹和公司策略，想看的話跟我說代號，我幫你補上。","No detailed profile yet.")}</p>`:"")(U.meta&&U.meta[sel])}
    ${window.leadersHTML?leadersHTML(sel):""}
    <h3 class="ush">🧠 ${tt("簡短分析","Quick analysis")}</h3>
    <div class="usan">${analysis(sel,I).map(x=>`<div><span>${x[0]}</span><p>${x[1]}</p></div>`).join("")}</div>
    <p class="sub" style="margin:4px 0 0">${tt("以上是用最近 60 天股價自動整理的重點，不是買賣建議。","Auto-generated from the last 60 days of prices. Not advice.")}</p>
    <h3 class="ush">📰 ${tt("近三天新聞","News, last 3 days")}</h3>
    ${newsHTML(sel)}
    <div class="usbtns"><button class="btn ghost" id="usWatch">${on?tt("★ 已加入自選","★ In favorites"):tt("⭐ 加入自選","⭐ Add to favorites")}</button><button class="btn" id="usPred">${tt("🔮 看預測分析","🔮 Prediction")}</button></div>`;
  $("usWatch").onclick=()=>{let W=watch();W=W.includes(sel)?W.filter(x=>x!==sel):[sel,...W];setWatch(W);renderSel();if(sortBy==="watch")renderList()};
  $("usPred").onclick=()=>{if(window.predictOpen)predictOpen("us",sel);if(window.goPage)goPage(7)};
  if(window.drawKline)drawKline("usKl",klineSeries(U,sel),{cur:"$"});
  if(window.predictCard)predictCard("us",sel,"usPc");
}
function pick(k){sel=k;renderSel();const el=$("usSel");if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}
function search(q){q=q.trim().toLowerCase();const box=$("usSug");if(!q||!U){box.innerHTML="";return}
  const r=Object.keys(U.s).filter(k=>k.toLowerCase().startsWith(q)||(ZH[k]||"").toLowerCase().includes(q)||U.s[k][0].toLowerCase().includes(q)).slice(0,8);
  box.innerHTML=r.length?r.map(k=>`<button data-k="${k}"><b>${esc(ZH[k]||U.s[k][0])}</b><span class="sub">${k}</span></button>`).join(""):`<p class="sub">${tt(`找不到。目前收錄 ${Object.keys(U.s).length} 檔（S&P 500 全部、那斯達克 100、熱門成長股、外國公司和 ETF）。想加哪一檔跟我說代號。`,`Not found. ${Object.keys(U.s).length} stocks are tracked.`)}</p>`;
  box.querySelectorAll("button").forEach(b=>b.onclick=()=>{box.innerHTML="";$("usQ").value="";pick(b.dataset.k)})}
async function load(){
  if(U||loading)return;loading=true;
  if(window.loaderHTML)$("usIdx").innerHTML=`<div style="display:grid;justify-items:center;padding:16px 0">${loaderHTML(true)}</div>`;
  try{U=window.klineData?await klineData("us"):await (await fetch("us.json?t="+Date.now(),{cache:"no-store"})).json()}catch(e){U=null}
  fetch("us-news.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.json()).then(j=>{NW=j;if(sel)renderSel()}).catch(()=>{});
  loading=false;
  if(!U||!U.s){$("usIdx").innerHTML=`<p class="hint">${tt("美股資料還在準備中，大約幾分鐘後再重新整理看看。","US data is being prepared; refresh in a few minutes.")}</p>`;return}
  renderIdx();renderANT();renderList();renderSel();
}
window.usRender=function(){if(U){renderIdx();renderANT();renderList();renderSel()}else load()};
document.addEventListener("click",e=>{const b=e.target.closest("#usSort button");if(b&&U){sortBy=b.dataset.s;renderList()}});
const q=$("usQ");if(q)q.addEventListener("input",()=>search(q.value));
})();
