/* 台股個股的「公司簡介、簡短分析、近三天新聞」：從個股清單點「📰 新聞與分析」打開 */
(function(){
const tt=(zh,en)=>window.EN?en:zh;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=(n,d=2)=>n==null||isNaN(n)?"—":Number(n).toLocaleString("zh-TW",{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=n=>(n>=0?"+":"")+fmt(n,1)+"%";
/* 熱門股的一兩句話簡介（自己寫的白話說明） */
const INTRO={
"2330":"台積電：全世界最大的晶圓代工廠，幫蘋果、輝達等公司生產最先進的晶片，是台股市值最大的公司。",
"2317":"鴻海：全球最大的電子代工廠，幫蘋果組裝 iPhone，近年 AI 伺服器是成長重點。",
"2454":"聯發科：手機晶片設計大廠，也做電視、網通和車用晶片。",
"2308":"台達電：電源供應器和散熱大廠，資料中心電源和電動車零件是成長重點。",
"2382":"廣達：筆電和伺服器代工大廠，AI 伺服器出貨很多。",
"2412":"中華電信：台灣最大的電信公司，營運穩定、配息穩定。",
"2881":"富邦金：大型金控，旗下有富邦人壽、台北富邦銀行。",
"2882":"國泰金：大型金控，旗下有國泰人壽、國泰世華銀行。",
"2891":"中信金：大型金控，旗下有中國信託銀行。",
"2886":"兆豐金：以兆豐銀行為主的金控，外匯業務強。",
"2884":"玉山金：以玉山銀行為主的金控。",
"2303":"聯電：晶圓代工廠，主要做成熟製程的晶片。",
"3711":"日月光投控：全球最大的半導體封裝測試公司。",
"2357":"華碩：電腦、筆電和主機板品牌。",
"2353":"宏碁：電腦和筆電品牌。",
"2395":"研華：工業電腦的領導廠商。",
"3231":"緯創：電子代工廠，AI 伺服器是重點業務。",
"2356":"英業達：筆電和伺服器代工廠。",
"6669":"緯穎：雲端資料中心伺服器廠，客戶是大型網路公司。",
"3017":"奇鋐：散熱模組廠，受惠 AI 伺服器散熱需求。",
"3324":"雙鴻：散熱模組廠，做 AI 伺服器的水冷散熱。",
"2345":"智邦：網路交換器廠，資料中心是主要客戶。",
"3008":"大立光：手機相機鏡頭的龍頭廠商，股價很高。",
"2379":"瑞昱：網路和音訊晶片設計公司。",
"3034":"聯詠：面板驅動晶片設計公司。",
"3661":"世芯-KY：幫客戶設計客製化 AI 晶片（ASIC）。",
"3443":"創意：幫客戶設計客製化晶片，跟台積電關係密切。",
"5269":"祥碩：高速傳輸介面晶片設計公司。",
"6415":"矽力-KY：電源管理晶片設計公司。",
"2603":"長榮：貨櫃航運公司，獲利跟全球運費關係很大。",
"2609":"陽明：貨櫃航運公司，運價好時賺很多、差時波動大。",
"2615":"萬海：亞洲區域的貨櫃航運公司。",
"2618":"長榮航：航空公司。","2610":"華航：航空公司。",
"1301":"台塑：塑膠原料大廠，跟景氣和油價有關。","1303":"南亞：塑膠和電子材料大廠。","6505":"台塑化：煉油和石化公司。",
"2002":"中鋼：台灣最大的鋼鐵公司。","1216":"統一：食品和零售集團，旗下有 7-ELEVEN。","2912":"統一超：7-ELEVEN 便利商店。",
"2207":"和泰車：TOYOTA 汽車台灣總代理。","1101":"台泥：水泥公司，也在做綠能。",
"2327":"國巨：被動元件（電阻、電容）大廠。","2376":"技嘉：主機板、顯示卡和伺服器。","2377":"微星：電競筆電和主機板。",
"4938":"和碩：電子代工廠。","2301":"光寶科：電源和光電零件。","3045":"台灣大：電信公司。","4904":"遠傳：電信公司。",
"0050":"元大台灣50：一次買進台灣市值最大的 50 家公司，台積電比重很高。",
"0056":"元大高股息：挑選預估殖利率高的股票，主打配息。",
"00878":"國泰永續高股息：挑選 ESG 評分好又高配息的股票。",
"00919":"群益台灣精選高息：主打高配息的 ETF。",
"006208":"富邦台50：跟 0050 一樣追蹤台灣前 50 大公司，費用比較低。",
"00929":"復華台灣科技優息：月配息的科技股高息 ETF。",
"00940":"元大台灣價值高息：月配息的高息 ETF。",
"00646":"元大S&P500：用台幣買美國前 500 大公司。","00662":"富邦NASDAQ：用台幣買美國科技股為主的那斯達克 100。",
"00757":"統一FANG+：集中投資美國大型科技股。","00830":"國泰費城半導體：投資美國半導體股。"};
let NW=null,INFO=null,H=null,started=false;
function load(){if(started)return;started=true;
  fetch("tw-news.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.json()).then(j=>{NW=j;redraw()}).catch(()=>{NW={n:{}};redraw()});
  fetch("tw-info.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.json()).then(j=>{INFO=j;redraw()}).catch(()=>{INFO={};redraw()});
  (window.klineData?klineData("tw"):fetch("hist.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.json())).then(j=>{H=j||null;redraw()}).catch(()=>{H=null;redraw()});
}
let cur=null,box=null;
function redraw(){if(cur&&box){box.innerHTML=body(cur);after(cur)}}
function after(c){
  if(H&&H.s[c]&&window.drawKline)drawKline("twKl",klineSeries(H,c),{});
  if(H&&window.predictCard)predictCard("tw",c,"twPc");
}
function series(c){if(!H||!H.s[c])return null;const e=H.s[c],o={c:[],v:[],f:[],d:[]};H.dates.forEach((d,i)=>{if(e[2][i]!=null){o.c.push(e[2][i]);o.v.push(e[3][i]||0);o.f.push(e[4]?e[4][i]:null);o.d.push(d)}});return o}
function analysis(c){
  const S=series(c);if(!S||S.c.length<21)return null;const cs=S.c,n=cs.length,px=cs[n-1],out=[];
  const ma=cs.slice(-20).reduce((a,b)=>a+b,0)/20;out.push(["📈",tt(`股價在 20 日均線（${fmt(ma)}）${px>ma?"上面，短期趨勢偏強":"下面，短期趨勢偏弱"}。`,`Price is ${px>ma?"above":"below"} its 20-day average (${fmt(ma)}).`)]);
  const r20=(px/cs[n-21]-1)*100;const rs=[];for(const k in H.s){const a=H.s[k][2],L=a.length;if(a[L-1]!=null&&a[L-21])rs.push(a[L-1]/a[L-21]-1)}rs.sort((a,b)=>a-b);const md=rs.length?rs[rs.length>>1]*100:0;
  out.push(["🏁",tt(`近 20 個交易日${r20>=0?"漲":"跌"} ${fmt(Math.abs(r20),1)}%，比一般股票${r20-md>=0?"強":"弱"} ${fmt(Math.abs(r20-md),1)} 個百分點。`,`${pct(r20)} over 20 days, ${fmt(Math.abs(r20-md),1)} pts ${r20>=md?"better":"worse"} than the typical stock.`)]);
  const hi=Math.max(...cs),lo=Math.min(...cs),pos=hi>lo?(px-lo)/(hi-lo)*100:50;
  out.push(["📏",tt(`近 ${n} 天價格在 ${fmt(lo)}～${fmt(hi)} 之間，現在在 ${fmt(pos,0)}% 的位置（${pos>85?"接近高點":pos<15?"接近低點":"在中間"}）。`,`${n}-day range ${fmt(lo)}–${fmt(hi)}; now at ${fmt(pos,0)}%.`)]);
  const rr=[];for(let i=n-20;i<n;i++)rr.push(cs[i]/cs[i-1]-1);const mu=rr.reduce((a,b)=>a+b,0)/rr.length,sd=Math.sqrt(rr.reduce((a,b)=>a+(b-mu)**2,0)/rr.length)*100;
  out.push(["🎢",tt(`最近每天平均上下震盪 ${fmt(sd,1)}%，${sd>3.5?"波動很大，風險比較高":sd>1.8?"波動中等":"走勢相對穩定"}。`,`Moves about ${fmt(sd,1)}% a day: ${sd>3.5?"very volatile":sd>1.8?"moderate":"fairly steady"}.`)]);
  const f5=S.f.slice(-5);if(f5.every(x=>x!=null)){const net=f5.reduce((a,b)=>a+b,0);out.push(["🏦",tt(`近 5 天外資＋投信合計${net>=0?"買超":"賣超"} ${Math.abs(net).toLocaleString()} 張。`,`Foreign + trust: net ${net>=0?"bought":"sold"} ${Math.abs(net).toLocaleString()} lots in 5 days.`)])}
  const va=S.v.slice(-21,-1).reduce((a,b)=>a+b,0)/20||1,vr=S.v[n-1]/va;out.push(["🔊",tt(`今天成交量是平常的 ${fmt(vr,1)} 倍${vr>1.5?"，交易很熱絡":vr<.6?"，交易比較冷清":""}。`,`Volume was ${fmt(vr,1)}× normal today.`)]);
  return out;
}
function ago(d){if(!d)return "";const h=(Date.now()-new Date(d))/36e5;return h<1?tt("剛剛","just now"):h<24?tt(`${Math.floor(h)} 小時前`,`${Math.floor(h)}h ago`):tt(`${Math.floor(h/24)} 天前`,`${Math.floor(h/24)}d ago`)}
function body(c){
  const s=(window.D&&D.stocks||[]).find(x=>x[0]===c),name=s?s[1]:(H&&H.s[c]?H.s[c][0]:c),I=INFO&&INFO[c];
  const meta=I?[I.i&&`<span class="ustag">${esc(I.i)}</span>`,I.m==="o"?tt("上櫃","OTC"):tt("上市","Listed"),I.f&&tt(`${I.f} 年成立`,`Founded ${I.f}`),I.l&&tt(`${I.l} 年掛牌`,`Listed ${I.l}`),I.c&&tt(`董事長 ${esc(I.c)}`,`Chair ${esc(I.c)}`)].filter(Boolean).join(" · "):"";
  const A=H?analysis(c):null,L=NW?((NW.n||{})[c]||[]):null;
  return `<div class="top2"><div><h3>${esc(name)} <span class="sub">${c}</span></h3>${s?`<div class="sub">${tt("收盤","Close")} <b>${fmt(s[4])}</b> <span class="${s[5]>0?"up":s[5]<0?"down":"flat"}">${s[5]>0?"+":""}${fmt(s[5])}</span></div>`:""}</div><button class="x2">✕</button></div>
    <h3 class="ush">🕯️ ${tt("K 線圖","Candlestick chart")}</h3>
    ${H&&H.s[c]?(window.klineHTML?klineHTML("twKl"):""):`<p class="sub">${H?tt("這檔成交量比較小，沒有收錄歷史資料。","No history for this stock."):tt("讀取中…","Loading…")}</p>`}
    <h3 class="ush">🔮 ${tt("個股預測","Prediction")}</h3>
    <div id="twPc">${H?(window.loaderHTML?`<div style="display:flex;justify-content:center;padding:8px">${loaderHTML(true)}</div>`:""):`<p class="sub">${tt("讀取中…","Loading…")}</p>`}</div>
    <h3 class="ush">📖 ${tt("公司簡介","About")}</h3>
    ${INTRO[c]?`<p class="usinfo">${esc(INTRO[c])}</p>`:""}${meta?`<p class="usinfo sub" style="margin-top:4px">${meta}</p>`:""}
    ${!INTRO[c]&&!meta?`<p class="sub">${INFO?tt("這檔沒有公司基本資料（可能是 ETF 或特殊股票）。","No company profile (may be an ETF).") :tt("讀取中…","Loading…")}</p>`:""}
    ${I&&I.w?`<p class="sub" style="margin:4px 0 0"><a href="${esc(/^https?:/.test(I.w)?I.w:"https://"+I.w)}" target="_blank" rel="noopener">🌐 ${tt("公司網站","Website")}</a></p>`:""}
    ${window.leadersHTML?leadersHTML(c):""}
    <h3 class="ush">🧠 ${tt("簡短分析","Quick analysis")}</h3>
    ${A?`<div class="usan">${A.map(x=>`<div><span>${x[0]}</span><p>${x[1]}</p></div>`).join("")}</div><p class="sub" style="margin:4px 0 0">${tt("用最近 60 天股價自動整理的重點，不是買賣建議。","Auto-generated from 60 days of prices. Not advice.")}</p>`
      :`<p class="sub">${H?tt("這檔成交量比較小，沒有收錄歷史資料，所以沒辦法分析。","Not enough history for this stock."):tt("讀取中…","Loading…")}</p>`}
    <h3 class="ush">📰 ${tt("近三天新聞","News, last 3 days")}</h3>
    ${L==null?`<p class="sub">${tt("讀取中…","Loading…")}</p>`:L.length?`<div class="usnews">${L.map(x=>`<a href="${esc(x.u)}" target="_blank" rel="noopener"><b>${esc(x.t)}</b><span class="sub">${esc(x.s||"")}${x.s?" · ":""}${ago(x.d)}</span></a>`).join("")}</div><p class="sub" style="margin:6px 0 0">${tt("點標題會打開原始新聞網站。","Tap a headline to open the original site.")}</p>`
      :`<p class="sub">${tt("近三天沒有找到這檔的新聞。新聞主要涵蓋成交金額比較大的熱門股。","No news in the last 3 days. News mostly covers actively traded stocks.")}</p>`}
    <div class="usbtns"><button class="btn" id="twPred">🔮 ${tt("看預測分析","Prediction")}</button></div>`;
}
window.openTwInfo=function(c){
  load();cur=c;
  const m=document.createElement("div");m.className="lsnmask";m.innerHTML=`<div class="lsn twinfo" role="dialog"></div>`;document.body.appendChild(m);
  box=m.querySelector(".lsn");box.innerHTML=body(c);after(c);
  const close=()=>{m.classList.remove("show");setTimeout(()=>m.remove(),300);cur=null;box=null};
  m.addEventListener("click",e=>{if(e.target===m||e.target.closest(".x2"))close();
    if(e.target.closest("#twPred")){close();if(window.predictOpen)predictOpen("tw",c);if(window.goPage)goPage(7)}});
  requestAnimationFrame(()=>m.classList.add("show"));
};
document.addEventListener("click",e=>{const b=e.target.closest("[data-info]");if(b){e.stopPropagation();openTwInfo(b.dataset.info)}},true);
})();
