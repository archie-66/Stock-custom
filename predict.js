/* 預測分頁：把投資書上常見的判斷方法整理成分數，估計「接下來 5 個交易日」偏漲還是偏跌。
   這不是保證，只是把很多方法放在一起看。每個方法都會說明它的根據，也會用過去的資料回頭檢查準不準。 */
(function(){
const $=id=>document.getElementById(id);
const tt=(zh,en)=>window.EN?en:zh;
const PKEY="tw_pred";
let H=null,loading=false,code=null,MK="tw";const CACHE={tw:null,us:null},CODE={tw:null,us:null};
const isUS=()=>MK==="us";
const ZH=window.US_ZH||{};const nmOf=(c,n)=>isUS()&&(window.US_ZH||{})[c]?`${window.US_ZH[c]}`:n;

/* ---------- 小工具 ---------- */
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
const fmt=(n,d=2)=>n==null||isNaN(n)?"—":Number(n).toLocaleString("zh-TW",{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=n=>(n>=0?"+":"")+fmt(n,1)+"%";
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function series(c){/* 去掉沒有資料的日子（停牌） */
  const e=H.s[c];if(!e)return null;
  const out={n:e[0],m:e[1],d:[],c:[],v:[],f:[],hasF:!!e[4]};
  H.dates.forEach((d,i)=>{if(e[2][i]!=null){out.d.push(d);out.c.push(e[2][i]);out.v.push(e[3][i]||0);out.f.push(e[4]?e[4][i]:null)}});
  return out;
}
function ma(arr,t,n){if(t+1<n)return null;return avg(arr.slice(t+1-n,t+1))}
function rsi(c,t,n=14){
  if(t<n)return null;let g=0,l=0;
  for(let i=t-n+1;i<=t;i++){const d=c[i]-c[i-1];if(d>0)g+=d;else l-=d}
  if(g+l===0)return 50;return 100*g/(g+l);
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* 全部股票 20 日漲跌的中位數（當作「大家平均」來比） */
let medCache={};
function median20(t){
  const mkey=MK+t;if(medCache[mkey]!=null)return medCache[mkey];
  const rs=[];for(const k in H.s){const e=H.s[k][2];const a=e[t],b=e[t-20];if(a!=null&&b)rs.push(a/b-1)}
  rs.sort((x,y)=>x-y);return medCache[mkey]=rs.length?rs[Math.floor(rs.length/2)]:0;
}

/* ---------- 各種方法（每個給 -2 ～ +2 分） ---------- */
function factors(S,t,withMarket){
  const c=S.c,v=S.v,f=S.f,px=c[t],F=[];
  const m5=ma(c,t,5),m20=ma(c,t,20),m20b=ma(c,t-5,20);
  if(m20!=null&&m20b!=null){
    let s=(px>m20?1:-1)+(m20>m20b?1:-1);
    F.push({k:"trend",ic:"📈",s,
      name:tt("趨勢（均線）","Trend (moving average)"),
      txt:tt(`現在價格${px>m20?"在":"在"} 20 日均線${px>m20?"上面":"下面"}，均線本身${m20>m20b?"往上走":"往下走"}。`,
             `Price is ${px>m20?"above":"below"} its 20-day average, and that average is ${m20>m20b?"rising":"falling"}.`),
      src:tt("道氏理論、移動平均線：趨勢一旦形成，常會延續一段時間。","Dow Theory & moving averages: trends tend to persist for a while.")});
  }
  if(m5!=null&&m20!=null){
    const p5=ma(c,t-3,5),p20=ma(c,t-3,20);let s=m5>m20?1:-1,cross="";
    if(p5!=null&&p20!=null){if(p5<=p20&&m5>m20){s=2;cross=tt("，而且最近剛「黃金交叉」","; it just crossed above (golden cross)")}
      else if(p5>=p20&&m5<m20){s=-2;cross=tt("，而且最近剛「死亡交叉」","; it just crossed below (death cross)")}}
    F.push({k:"cross",ic:"✂️",s,
      name:tt("短線 vs 長線","Short vs long average"),
      txt:tt(`5 日均線${m5>m20?"高於":"低於"} 20 日均線${cross}。`,`The 5-day average is ${m5>m20?"above":"below"} the 20-day${cross}.`),
      src:tt("葛蘭碧八大法則：短均線穿過長均線，常被當成轉強或轉弱的訊號。","Granville's rules: a short average crossing a long one often marks a turn.")});
  }
  if(t>=20){
    const r=(px/c[t-20]-1)*100;const s=r>8?2:r>3?1:r<-8?-2:r<-3?-1:0;
    F.push({k:"mom",ic:"🚀",s,
      name:tt("動能（近 20 天漲跌）","Momentum (last 20 days)"),
      txt:tt(`近 20 個交易日${r>=0?"漲":"跌"}了 ${fmt(Math.abs(r),1)}%。`,`It moved ${pct(r)} over the last 20 trading days.`),
      src:tt("動能效應研究：最近漲得多的股票，短期內常常還會再強一點。","Momentum research: recent winners often stay strong for a bit.")});
    const rel=(r/100-median20(H.dates.indexOf(S.d[t])))*100;
    if(!isNaN(rel)){const s2=rel>5?1:rel<-5?-1:0;
      F.push({k:"rs",ic:"🏁",s:s2,
        name:tt("跟其他股票比","Versus other stocks"),
        txt:tt(`這 20 天比大部分股票${rel>=0?"強":"弱"} ${fmt(Math.abs(rel),1)} 個百分點。`,`Over 20 days it did ${fmt(Math.abs(rel),1)} pts ${rel>=0?"better":"worse"} than the typical stock.`),
        src:tt("相對強弱：資金常常集中在比大盤強的股票。","Relative strength: money tends to chase stocks that beat the market.")});}
  }
  const R=rsi(c,t);
  if(R!=null){
    const s=R>80?-2:R>70?-1:R<20?2:R<30?1:0;
    F.push({k:"rsi",ic:"🌡️",s,
      name:tt("RSI 過熱 / 超賣","RSI (overheated / oversold)"),
      txt:tt(`RSI 是 ${fmt(R,0)}。${R>70?"漲太快了，容易休息一下。":R<30?"跌太多了，容易反彈。":"在正常範圍。"}`,
             `RSI is ${fmt(R,0)}. ${R>70?"It rose fast and may cool off.":R<30?"It fell hard and may bounce.":"That's a normal range."}`),
      src:tt("威爾德的 RSI 指標：超過 70 算過熱、低於 30 算超賣。","Wilder's RSI: above 70 is overbought, below 30 oversold.")});
  }
  if(t>=20){
    const va=avg(v.slice(t-20,t))||1,ratio=v[t]/va,up=px>=c[t-1];
    let s=0,txt;
    if(ratio>1.5){s=up?1:-1;txt=tt(`今天成交量是平常的 ${fmt(ratio,1)} 倍，而且${up?"上漲":"下跌"}，代表很多人${up?"搶著買":"搶著賣"}。`,`Volume was ${fmt(ratio,1)}× normal on a ${up?"rise":"drop"}: lots of ${up?"buyers":"sellers"}.`)}
    else if(ratio<0.6){txt=tt(`今天成交量只有平常的 ${fmt(ratio,1)} 倍，大家在觀望，訊號不明顯。`,`Volume was only ${fmt(ratio,1)}× normal; people are waiting.`)}
    else txt=tt(`今天成交量差不多是平常的 ${fmt(ratio,1)} 倍。`,`Volume was about ${fmt(ratio,1)}× normal.`);
    F.push({k:"vol",ic:"🔊",s,name:tt("量價關係","Price & volume"),txt,
      src:tt("量價理論：價格動的時候有大量配合，那個方向比較可信。","Volume confirms price: big moves on big volume are more trustworthy.")});
  }
  if(S.hasF&&t>=5){
    const fs=f.slice(t-4,t+1);
    if(fs.every(x=>x!=null)){
      const net=fs.reduce((a,b)=>a+b,0),va=avg(v.slice(Math.max(0,t-19),t+1))||1,r=net/va*100;
      let streak=0;for(let i=t;i>=0&&f[i]!=null&&Math.sign(f[i])===Math.sign(f[t])&&f[t]!==0;i--)streak++;
      const s=r>5?2:r>1?1:r<-5?-2:r<-1?-1:0;
      F.push({k:"inst",ic:"🏦",s,name:tt("法人（外資＋投信）","Institutions (foreign + trust)"),
        txt:tt(`近 5 天外資和投信合計${net>=0?"買超":"賣超"} ${Math.abs(net).toLocaleString()} 張${streak>=3?`，已經連續 ${streak} 天${f[t]>0?"買":"賣"}`:""}。`,
               `Over 5 days they were net ${net>=0?"buyers":"sellers"} of ${Math.abs(net).toLocaleString()} lots${streak>=3?`, ${streak} days in a row`:""}.`),
        src:tt("籌碼分析：大戶持續買進，股價比較有支撐。","Flow analysis: steady buying by big players tends to support a price.")});
    }
  }
  if(withMarket&&isUS()&&H&&H.idx&&H.idx.SPX)F.push(usMarketFactor());
  else if(withMarket&&!isUS()&&window.D)F.push(marketFactor());
  return F;
}
function usMarket(){
  const F=[];if(!H||!H.idx||!H.idx.SPX)return Object.assign(verdict(F),{F});
  const h=H.idx.SPX[1].filter(x=>x!=null),last=h[h.length-1];
  if(h.length>=21){const m=avg(h.slice(-20)),m5=avg(h.slice(-5));const s=(last>m?1:-1)+(m5>m?1:-1);
    F.push({k:"t",ic:"📈",s,name:tt("S&P 500 趨勢","S&P 500 trend"),txt:tt(`S&P 500 在 20 日均線${last>m?"上面":"下面"}，最近 5 天平均${m5>m?"比較高":"比較低"}。`,`The S&P 500 is ${last>m?"above":"below"} its 20-day average.`),src:tt("道氏理論：先看大方向。","Dow Theory: look at the main direction first.")})}
  if(h.length>=6){const r=(last/h[h.length-6]-1)*100;const s=r>3?2:r>1?1:r<-3?-2:r<-1?-1:0;
    F.push({k:"r5",ic:"🚀",s,name:tt("近 5 天漲跌","Last 5 days"),txt:tt(`S&P 500 近 5 個交易日${r>=0?"漲":"跌"} ${fmt(Math.abs(r),1)}%。`,`The S&P 500 moved ${pct(r)} in 5 trading days.`),src:tt("動能：短期的方向常會延續。","Momentum: short-term direction often continues.")})}
  if(H.idx.NDX){const n=H.idx.NDX[1].filter(x=>x!=null);if(n.length>=21){const r=(n[n.length-1]/n[n.length-21]-1)*100,r2=(last/h[h.length-21]-1)*100,d=r-r2;const s=d>2?1:d<-2?-1:0;
    F.push({k:"b",ic:"💻",s,name:tt("科技股 vs 大盤","Tech vs market"),txt:tt(`20 天裡那斯達克比 S&P 500 ${d>=0?"強":"弱"} ${fmt(Math.abs(d),1)} 個百分點。`,`Over 20 days the Nasdaq did ${fmt(Math.abs(d),1)} pts ${d>=0?"better":"worse"} than the S&P 500.`),src:tt("相對強弱：資金流向哪一類股票。","Relative strength: where the money is flowing.")})}}
  const R=rsi(h,h.length-1);if(R!=null){const s=R>75?-1:R<30?1:0;F.push({k:"rsi",ic:"🌡️",s,name:tt("S&P 500 RSI","S&P 500 RSI"),txt:tt(`RSI 是 ${fmt(R,0)}。`,`RSI is ${fmt(R,0)}.`),src:tt("威爾德的 RSI 指標。","Wilder's RSI.")})}
  const v=verdict(F);v.F=F;return v;
}
function usMarketFactor(){const M=usMarket();const s=M.score>=25?1:M.score<=-25?-1:0;
  return {k:"mkt",ic:"🌏",s,name:tt("美股大盤環境","US market"),txt:tt(`美股大盤現在${M.word}。`,`The US market looks ${M.wordEn}.`),src:tt("系統性風險：個股常常跟著整體市場一起動。","Market risk: most stocks move with the market.")}}
function marketFactor(){
  const M=market();const s=M.score>=25?1:M.score<=-25?-1:0;
  return {k:"mkt",ic:"🌏",s,name:tt("大盤環境","Overall market"),
    txt:tt(`大盤現在${M.word}。大盤不好的時候，大部分股票也很難漲。`,`The overall market looks ${M.wordEn}. Most stocks struggle when the market is weak.`),
    src:tt("系統性風險：個股常常跟著整體市場一起動。","Market (systematic) risk: most stocks move with the market.")};
}
function verdict(F){
  if(!F.length)return {score:0,word:tt("資料不足","Not enough data"),wordEn:"unclear",cl:"flat"};
  const sum=F.reduce((a,x)=>a+x.s,0),max=F.length*2,score=Math.round(sum/max*100);
  const word=score>=40?tt("明顯偏漲","clearly leaning up"):score>=15?tt("稍微偏漲","slightly leaning up"):score<=-40?tt("明顯偏跌","clearly leaning down"):score<=-15?tt("稍微偏跌","slightly leaning down"):tt("沒有明顯方向","no clear direction");
  const wordEn=score>=15?"positive":score<=-15?"negative":"mixed";
  const agree=Math.max(F.filter(x=>x.s>0).length,F.filter(x=>x.s<0).length)/F.length;
  return {score,word,wordEn,cl:score>=15?"up":score<=-15?"down":"flat",agree};
}

/* ---------- 大盤 ---------- */
function market(){
  const D=window.D,F=[];if(!D)return {score:0,word:"—",wordEn:"—",F};
  const h=D.history.map(x=>x.c).filter(x=>x!=null),last=h[h.length-1];
  if(h.length>=10){const m=avg(h),m5=avg(h.slice(-5));const s=(last>m?1:-1)+(m5>m?1:-1);
    F.push({k:"t",ic:"📈",s,name:tt("指數趨勢","Index trend"),txt:tt(`加權指數${last>m?"在":"在"}近 ${h.length} 天平均${last>m?"上面":"下面"}，最近 5 天平均${m5>m?"比較高":"比較低"}。`,`The index is ${last>m?"above":"below"} its ${h.length}-day average; the last 5 days are ${m5>m?"higher":"lower"}.`),src:tt("道氏理論：先看大方向。","Dow Theory: look at the main direction first.")})}
  if(h.length>=6){const r=(last/h[h.length-6]-1)*100;const s=r>3?2:r>1?1:r<-3?-2:r<-1?-1:0;
    F.push({k:"r5",ic:"🚀",s,name:tt("近 5 天漲跌","Last 5 days"),txt:tt(`近 5 個交易日指數${r>=0?"漲":"跌"} ${fmt(Math.abs(r),1)}%。`,`The index moved ${pct(r)} in 5 trading days.`),src:tt("動能：短期的方向常會延續。","Momentum: short-term direction often continues.")})}
  if(D.breadth){const {up,down}=D.breadth,r=up/((up+down)||1);const s=r>.65?1:r<.35?-1:0;const ext=r>.85||r<.15;
    F.push({k:"b",ic:"⚖️",s:ext?-s:s,name:tt("漲跌家數","Advancers vs decliners"),txt:tt(`今天 ${up} 家漲、${down} 家跌。${ext?(r>.85?"幾乎全部都漲，短線可能過熱。":"幾乎全部都跌，短線可能殺過頭、容易反彈。"):""}`,`${up} rose and ${down} fell today. ${ext?(r>.85?"Almost everything rose; it may be overheated.":"Almost everything fell; a bounce is common after that."):""}`),src:tt("市場寬度：多數股票一起動，方向比較可靠；太極端則常反轉。","Market breadth: broad moves are more reliable; extremes often reverse.")})}
  if(D.instHistory&&D.instHistory.length){const fo=D.instHistory.reduce((a,x)=>a+(x.foreign||0),0);const s=fo>300?2:fo>50?1:fo<-300?-2:fo<-50?-1:0;
    F.push({k:"i",ic:"🏦",s,name:tt("外資動向","Foreign investors"),txt:tt(`近 ${D.instHistory.length} 天外資合計${fo>=0?"買超":"賣超"} ${fmt(Math.abs(fo),0)} 億。`,`Foreign investors were net ${fo>=0?"buyers":"sellers"} of NT$${fmt(Math.abs(fo)/10,1)}B over ${D.instHistory.length} days.`),src:tt("籌碼：外資是台股最大的買賣力量之一。","Flows: foreign money is one of the biggest forces in Taiwan stocks.")})}
  const v=verdict(F);v.F=F;return v;
}


/* ---------- 學習模型：用全部股票過去的資料，學每個方法該占多少比重（邏輯迴歸），再用它沒看過的最近資料考試 ---------- */
const KEYS=["trend","cross","mom","rs","rsi","vol","inst"];
const MODEL={tw:null,us:null};const TRAINING={};const WAIT={tw:[],us:[]};
const sig=z=>1/(1+Math.exp(-z));
function vec(F){return [1,...KEYS.map(k=>{const f=F.find(x=>x.k===k);return f?f.s/2:0})]}
function predictP(w,x){return sig(w.reduce((a,wi,i)=>a+wi*x[i],0))}
function fit(X,Y,iters){const n=X.length,d=X[0].length,w=new Array(d).fill(0);
  for(let it=0;it<iters;it++){const g=new Array(d).fill(0);for(let i=0;i<n;i++){const e=predictP(w,X[i])-Y[i],x=X[i];for(let j=0;j<d;j++)g[j]+=e*x[j]}
    for(let j=0;j<d;j++)w[j]-=1.2*(g[j]/n+(j?0.002*w[j]:0))}return w}
function trainModel(done,mk0,D0){
  const mk=mk0||MK,D=D0||H;if(!D)return;const key="tw_model_"+mk;
  if(MODEL[mk]&&MODEL[mk].upd===D.updatedAt){done&&done();return}
  try{const c=JSON.parse(localStorage.getItem(key));if(c&&c.upd===D.updatedAt){MODEL[mk]=c;done&&done();return}}catch(e){}
  if(done)WAIT[mk].push(done);if(TRAINING[mk])return;
  TRAINING[mk]=true;const codes=Object.keys(D.s),X=[],Y=[],T=[];let i=0;
  const cutIdx=Math.floor(D.dates.length*0.75),cut=D.dates[cutIdx];
  (function step(){
    const end=Math.min(codes.length,i+80),sv=[H,MK];H=D;MK=mk;
    try{for(;i<end;i++){const S=series(codes[i]);if(!S||S.c.length<32)continue;
      for(let t=25;t+5<S.c.length;t+=1){const fut=S.c[t+5]/S.c[t]-1;if(fut===0)continue;X.push(vec(factors(S,t,false)));Y.push(fut>0?1:0);T.push(S.d[t]<cut?0:1)}}}finally{H=sv[0];MK=sv[1]}
    if(i<codes.length){setTimeout(step,0);return}
    const tr=[],te=[];X.forEach((x,k)=>(T[k]?te:tr).push(k));
    let res={upd:D.updatedAt,n:X.length,acc:null,base:null,nTest:te.length};
    if(tr.length>200&&te.length>100){
      const w0=fit(tr.map(k=>X[k]),tr.map(k=>Y[k]),120);
      let hit=0,ups=0,cN=0,cHit=0;te.forEach(k=>{const p=predictP(w0,X[k]);if((p>.5)===(Y[k]===1))hit++;ups+=Y[k];if(Math.abs(p-.5)>=.05){cN++;if((p>.5)===(Y[k]===1))cHit++}});
      res.acc=hit/te.length;res.base=Math.max(ups,te.length-ups)/te.length;res.cAcc=cN?cHit/cN:null;res.cN=cN;
      res.w=fit(X,Y,120);
    }
    MODEL[mk]=res;TRAINING[mk]=false;try{localStorage.setItem(key,JSON.stringify(res))}catch(e){}
    const W=WAIT[mk].splice(0);W.forEach(f=>{try{f()}catch(e){}});
  })();
}
function callHTML(S,t,F){
  const M=MODEL[MK];
  if(!M)return `<div class="pdcall flat"><div class="sub">🔮 ${tt("我的預測","My call")}</div><div style="display:flex;align-items:center;gap:10px">${window.loaderHTML?loaderHTML(true):""}<span>${tt("正在用全部股票的歷史資料訓練模型…","Training on all stocks' history…")}</span></div></div>`;
  if(!M.w)return "";
  const p=predictP(M.w,vec(F)),up=p>=.55,dn=p<=.45,cl=up?"up":dn?"down":"flat";
  const word=up?tt("📈 偏漲","📈 Leaning up"):dn?tt("📉 偏跌","📉 Leaning down"):tt("🤷 看不出方向","🤷 No clear direction");
  const rr=[];for(let i=Math.max(1,t-19);i<=t;i++)rr.push(Math.log(S.c[i]/S.c[i-1]));const mu=avg(rr),sd=Math.sqrt(avg(rr.map(x=>(x-mu)**2)))*Math.sqrt(5);
  const lo=S.c[t]*Math.exp(-sd),hi=S.c[t]*Math.exp(sd),cur=isUS()?"$":"";
  const edge=M.acc!=null?M.acc-M.base:null;
  const grade=edge==null?"":edge>=.03?tt("比亂猜好一些","a bit better than guessing"):edge>0?tt("只比亂猜好一點點","barely better than guessing"):tt("沒有比亂猜好","no better than guessing");
  return `<div class="pdcall ${cl}">
    <div class="sub">🔮 ${tt("我的預測：接下來 5 個交易日","My call: next 5 trading days")}</div>
    <div class="pdcw">${word}</div>
    <div class="pdpb"><span>${tt("上漲機率","Chance of rising")}</span><div class="bar"><i style="width:${(p*100).toFixed(0)}%"></i><em style="left:50%"></em></div><b>${fmt(p*100,0)}%</b></div>
    <div class="pdrg">${tt("可能的價格範圍（大約 3 次有 2 次會落在這裡）","Likely range (about 2 in 3 chance)")}<br><b>${cur}${fmt(lo)} ～ ${cur}${fmt(hi)}</b></div>
    ${M.acc!=null?`<div class="pdex">📝 ${tt(`模型考試成績：用最近它沒看過的 ${M.nTest.toLocaleString()} 筆資料測試，猜對 <b>${fmt(M.acc*100,0)}%</b>；每次都猜比較常發生的那一邊是 ${fmt(M.base*100,0)}%。結論：<b>${grade}</b>。`,`Test score on ${M.nTest.toLocaleString()} unseen cases: <b>${fmt(M.acc*100,0)}%</b> right vs ${fmt(M.base*100,0)}% for always guessing the common side: <b>${grade}</b>.`)}${M.cAcc!=null&&M.cN>50?tt(` 只看模型比較有把握（機率離 50% 至少 5 個百分點）的時候：猜對 ${fmt(M.cAcc*100,0)}%。`,` When it's more confident: ${fmt(M.cAcc*100,0)}%.`):""}</div>`:""}
  </div>`;
}

/* ---------- 回測：用過去的資料，看這套分數準不準 ---------- */
function backtest(S){
  let n=0,hit=0,ups=0,tot=0;const H5=5;
  for(let t=25;t+H5<S.c.length;t++){
    const F=factors(S,t,false),V=verdict(F),fut=S.c[t+H5]/S.c[t]-1;
    if(fut!==0){tot++;if(fut>0)ups++}
    if(Math.abs(V.score)<15||fut===0)continue;
    n++;if((V.score>0)===(fut>0))hit++;
  }
  return {n,hit,base:tot?Math.max(ups,tot-ups)/tot:null,baseUp:tot?ups/tot:null};
}

/* ---------- 我的預測紀錄 ---------- */
const loadP=()=>{try{return JSON.parse(localStorage.getItem(PKEY))||[]}catch(e){return []}};
const saveP=a=>{try{localStorage.setItem(PKEY,JSON.stringify(a))}catch(e){}};
function checkP(){
  const P=loadP();let ch=false;
  for(const p of P){if(p.res!=null||(p.m||"tw")!==MK)continue;const S=series(p.c);if(!S)continue;
    const i=S.d.indexOf(p.d);if(i<0||i+5>=S.c.length)continue;
    const fut=S.c[i+5];p.end=fut;p.res=fut>p.px?1:fut<p.px?-1:0;ch=true}
  if(ch)saveP(P);return P;
}

/* ---------- 畫面 ---------- */
function gauge(score,cl){
  const a=(score/100)*90; // -90 ~ 90 度
  return `<svg class="pdg" viewBox="0 0 200 116">
    <defs><linearGradient id="pdgg" x1="0" x2="1"><stop offset="0" stop-color="var(--down)"/><stop offset=".5" stop-color="var(--flat)"/><stop offset="1" stop-color="var(--up)"/></linearGradient></defs>
    <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#pdgg)" stroke-width="16" stroke-linecap="round"/>
    <g class="pdn" style="--a:${a}deg"><line x1="100" y1="100" x2="100" y2="34" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="9" fill="var(--ink)"/></g>
    <text x="22" y="114" font-size="11" fill="var(--mute)">${tt("偏跌","Down")}</text><text x="178" y="114" font-size="11" fill="var(--mute)" text-anchor="end">${tt("偏漲","Up")}</text>
  </svg>`;
}
const TAG={trend:[["趨勢向上","Uptrend"],["趨勢向下","Downtrend"]],cross:[["短線轉強","Short-term turning up"],["短線轉弱","Short-term turning down"]],
  mom:[["最近很強","Strong lately"],["最近很弱","Weak lately"]],rs:[["比別人強","Beating others"],["比別人弱","Lagging others"]],
  rsi:[["跌深可能反彈","Oversold, may bounce"],["漲多可能休息","Overheated, may pause"]],vol:[["大量上漲","Rising on volume"],["大量下跌","Falling on volume"]],
  inst:[["法人在買","Institutions buying"],["法人在賣","Institutions selling"]],mkt:[["大盤偏多","Market positive"],["大盤偏空","Market negative"]],
  t:[["指數趨勢向上","Index uptrend"],["指數趨勢向下","Index downtrend"]],r5:[["近 5 天上漲","Up over 5 days"],["近 5 天下跌","Down over 5 days"]],
  b:[["多數股票上漲","Most stocks up"],["多數股票下跌","Most stocks down"]],i:[["外資買超","Foreign buying"],["外資賣超","Foreign selling"]]};
const LK={trend:"trend",cross:"cross",mom:"mom",rs:"rs",rsi:"rsi",vol:"vol",inst:"inst",mkt:"mkt",t:"trend",r5:"mom",b:"rs",i:"inst"};
const tag=x=>{const g=TAG[x.k];if(!g||!x.s)return "";const z=g[x.s>0?0:1];return tt(z[0],z[1])};
function bar(s){const w=Math.min(1,Math.abs(s)/2)*50;return `<span class="pdbar"><i class="${s>0?"up":"down"}" style="${s>0?"left:50%":"right:50%"};width:${w}%"></i></span>`}
function factorList(F){
  return `<div class="pdf">${F.map(x=>`<details><summary><span class="ic">${x.ic}</span><span class="nm">${x.name}${x.s?`<em class="${x.s>0?"up":"down"}">${tag(x)}</em>`:`<em class="flat">${tt("中性","Neutral")}</em>`}</span>${bar(x.s)}<span class="sc ${x.s>0?"up":x.s<0?"down":"flat"}">${x.s>0?"+":""}${x.s}</span></summary>
    <p>${x.txt}</p><p class="src">📚 ${x.src}</p>${LK[x.k]&&window.openLesson?`<button class="pdlearn" data-l="${LK[x.k]}">${window.lessonDone&&lessonDone(LK[x.k])?"✅ ":"📖 "}${tt("1 分鐘學會這個方法","Learn this in 1 minute")}</button>`:""}</details>`).join("")}</div>`;
}
function summary(V,F,conf){
  const pros=F.filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,3),cons=F.filter(x=>x.s<0).sort((a,b)=>a.s-b.s).slice(0,3);
  const arrow=V.cl==="up"?"▲":V.cl==="down"?"▼":"◆";
  const cw=[tt("很低","Very low"),tt("低","Low"),tt("中","Medium"),tt("較高","Higher")][conf];
  return `<div class="pdsum ${V.cl}"><div class="pdbig"><span class="ar">${arrow}</span><div><div class="w">${V.word}</div>
      <div class="pdcf">${tt("把握度","Confidence")} <span class="dots">${[1,2,3].map(i=>`<i class="${i<=conf?"on":""}"></i>`).join("")}</span> ${cw}</div></div></div>
    <div class="pdwhy">${pros.length?`<div><b>👍 ${tt("支持上漲","For up")}</b>${pros.map(x=>`<span class="up">${tag(x)}</span>`).join("")}</div>`:""}
    ${cons.length?`<div><b>👎 ${tt("支持下跌","For down")}</b>${cons.map(x=>`<span class="down">${tag(x)}</span>`).join("")}</div>`:""}</div></div>`;
}
function confOf(V,B){
  let c=Math.abs(V.score)>=40?2:Math.abs(V.score)>=15?1:0;
  if(B&&B.n>=5){const r=B.hit/B.n;if(r>B.base+0.05)c++;else if(r<B.base)c--}
  if(V.agree<0.6)c--;
  return clamp(c,0,3);
}
function spark(S){
  const N=S.c.length;if(N<2)return "";
  const W=320,Hh=90,mn=Math.min(...S.c),mx=Math.max(...S.c),y=v=>Hh-6-(v-mn)/((mx-mn)||1)*(Hh-12),x=i=>i/(N-1)*W;
  const p=S.c.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const m=S.c.map((_,i)=>{const a=ma(S.c,i,20);return a==null?null:`${x(i).toFixed(1)},${y(a).toFixed(1)}`}).filter(Boolean).join(" ");
  const cl=S.c[N-1]>=S.c[0]?"up":"down";
  return `<svg class="pdsp ${cl}" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none"><polyline points="${m}" fill="none" stroke="var(--mute)" stroke-width="1.5" stroke-dasharray="4 4"/><polyline class="ln" points="${p}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>
  <div class="sub" style="display:flex;justify-content:space-between"><span>${S.d[0].slice(5).replace("-","/")}</span><span>${tt("虛線＝20 日均線","Dashed = 20-day average")}</span><span>${S.d[N-1].slice(5).replace("-","/")}</span></div>`;
}

function renderMarket(){
  const M=isUS()?usMarket():market();
  $("pdMkt").innerHTML=`<div class="sub">${isUS()?tt("美股大盤（S&P 500）接下來幾天","US market (S&P 500), next few days"):tt("大盤接下來幾天","Market, next few days")}</div>${summary(M,M.F,confOf(M,null))}<div class="pdhead"><div>${gauge(M.score,M.cl)}</div><div><div class="sub">${tt("分數","Score")} <b class="${M.cl}">${M.score>0?"+":""}${M.score}</b>／100</div><div class="sub">${tt("指針越往右越偏漲","Further right = more up")}</div></div></div>${factorList(M.F)}`;
  setTimeout(()=>$("pdMkt").querySelectorAll(".pdn").forEach(n=>n.classList.add("go")),60);
}
function pickList(){
  const out=[],seen=new Set(),add=(c,tag)=>{if(H&&H.s[c]&&!seen.has(c)){seen.add(c);out.push([c,tag])}};
  if(isUS()){
    try{(JSON.parse(localStorage.getItem("tw_uswatch"))||[]).forEach(c=>add(c,"⭐"))}catch(e){}
    ["ANT","NVDA","AAPL","MSFT","TSLA","GOOGL","AMZN","META","TSM","AMD","PLTR","SPY","QQQ"].forEach(c=>add(c,c==="ANT"?"🆕":"🔥"));
    return out.slice(0,14);
  }
  try{(JSON.parse(localStorage.getItem("tw_watch"))||[]).forEach(c=>add(c,"⭐"))}catch(e){}
  try{Object.keys((JSON.parse(localStorage.getItem("tw_sim"))||{}).pos||{}).forEach(c=>add(c,"💼"))}catch(e){}
  if(window.D)D.stocks.slice(0,12).forEach(s=>add(s[0],"🔥"));
  return out.slice(0,14);
}
function renderPicks(){
  $("pdPicks").innerHTML=pickList().map(([c,tag])=>`<button data-c="${c}" class="${c===code?"on":""}">${tag} ${esc(isUS()?((window.US_ZH||{})[c]||c):H.s[c][0])}</button>`).join("");
  $("pdPicks").querySelectorAll("button").forEach(b=>b.onclick=()=>choose(b.dataset.c));
}
function choose(c){code=c;$("pdQ").value="";$("pdSug").innerHTML="";renderPicks();renderStock();
  const el=$("pdStock");if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}
function renderStock(){
  const box=$("pdStock");
  if(!code||!H.s[code]){box.innerHTML=`<p class="hint">${tt("選一檔股票，看看各種方法怎麼說。","Pick a stock to see what each method says.")}</p>`;return}
  const S=series(code),t=S.c.length-1;
  if(S.c.length<22){box.innerHTML=`<h2>${esc(S.n)} <span class="sub">${code}</span></h2><p class="hint">${tt(`這檔目前只有 ${S.c.length} 天的資料，至少要 22 天才能分析。`,`Only ${S.c.length} days of data so far; at least 22 are needed.`)}</p>`;return}
  const F=factors(S,t,true),V=verdict(F),B=backtest(S),chg=(S.c[t]/S.c[t-1]-1)*100;
  const bt=B.n>=5?tt(`過去 ${S.c.length} 天裡，這套分數有 ${B.n} 次給出方向，5 天後猜對 ${B.hit} 次（${fmt(B.hit/B.n*100,0)}%）。同一段時間如果每次都猜「比較常發生的那一邊」，會對 ${fmt(B.base*100,0)}%。`,
      `In the last ${S.c.length} days the score gave a direction ${B.n} times and was right ${B.hit} times (${fmt(B.hit/B.n*100,0)}%) five days later. Always guessing the more common direction would have been right ${fmt(B.base*100,0)}%.`)
    :tt("資料還不夠多，沒辦法回頭檢查準確度。","Not enough data yet to check past accuracy.");
  const good=B.n>=5&&B.hit/B.n>B.base+0.05;
  const P=checkP(),open=P.find(p=>p.c===code&&p.res==null);
  box.innerHTML=`<h2>${esc(isUS()&&(window.US_ZH||{})[code]?window.US_ZH[code]:S.n)} <span class="sub">${code}${S.m==="o"?tt(" · 上櫃"," · OTC"):isUS()?tt(" · 美股"," · US"):""}</span></h2>
    <div class="pdprice"><b>${isUS()?"$":""}${fmt(S.c[t])}</b> <span class="${chg>0?"up":chg<0?"down":"flat"}">${pct(chg)}</span> <span class="sub">${S.d[t].slice(5).replace("-","/")} ${tt("收盤","close")}</span></div>
    ${window.klineHTML?klineHTML("pdKl"):spark(S)}
    ${callHTML(S,t,F)}
    ${window.leadersHTML&&leadersHTML(code)?`<details class="pdlead"><summary>🧭 ${tt("公司遠見、策略和執行長","Vision, strategy & leadership")}</summary>${leadersHTML(code)}</details>`:""}
    <div class="sub" style="margin-top:10px">${tt("各方法的分數（模型的根據）","Scores by method (what the model uses)")}</div>${summary(V,F,confOf(V,B))}
    <div class="pdhead"><div>${gauge(V.score,V.cl)}</div><div>
      <div class="sub">${tt("分數","Score")} <b class="${V.cl}">${V.score>0?"+":""}${V.score}</b>／100<br>${tt(`${F.length} 個方法裡有 ${Math.round(V.agree*F.length)} 個同方向`,`${Math.round(V.agree*F.length)} of ${F.length} methods agree`)}</div></div></div>
    <p class="hint">${tt("點每一項可以看說明和根據。","Tap each item for the reason and where it comes from.")}</p>
    ${factorList(F)}
    <div class="tip ${good?"":"pdwarn"}">🔍 <b>${tt("準不準？","How accurate?")}</b> ${bt} <button class="pdlearn" data-l="base">📖 ${tt("什麼是基準率？","What's a base rate?")}</button> ${B.n>=5?(good?tt("這檔目前比亂猜好一點，但樣本很少，參考就好。","For this stock it has done a bit better than guessing, but the sample is small."):tt("這檔目前沒有比亂猜好，請不要只看這個分數。","For this stock it hasn't beaten guessing, so don't rely on this score.")):""}</div>
    <div class="pdmine"><div class="lab">${tt("換你猜：5 個交易日後會比現在","Your turn: in 5 trading days it will be")}</div>
      ${open?`<p class="sub">${tt(`你在 ${open.d.slice(5).replace("-","/")} 猜「${open.me>0?"漲":"跌"}」（當時 ${fmt(open.px)}），等 5 個交易日後自動對答案。`,`On ${open.d.slice(5)} you guessed ${open.me>0?"up":"down"} at ${fmt(open.px)}. It'll be checked automatically after 5 trading days.`)}</p>`
        :`<div class="pdbtn"><button data-g="1" class="up">${tt("📈 漲","📈 Up")}</button><button data-g="-1" class="down">${tt("📉 跌","📉 Down")}</button></div>`}
    </div>`;
  box.querySelectorAll(".pdbtn button").forEach(b=>b.onclick=()=>{
    const P=loadP();P.push({m:MK,c:code,n:isUS()&&(window.US_ZH||{})[code]?window.US_ZH[code]:S.n,d:S.d[t],px:S.c[t],me:+b.dataset.g,model:(MODEL[MK]&&MODEL[MK].w?(p=>p>=.55?1:p<=.45?-1:0)(predictP(MODEL[MK].w,vec(F))):Math.sign(V.score))||0,res:null});saveP(P);renderStock();renderLog();
  });
  if(window.drawKline)drawKline("pdKl",klineSeries(H,code),{cur:isUS()?"$":""});
  setTimeout(()=>box.querySelectorAll(".pdn").forEach(n=>n.classList.add("go")),60);
}
function renderLog(){
  const P=checkP(),done=P.filter(p=>p.res!=null&&p.res!==0);
  const me=done.filter(p=>p.me===p.res).length,mdl=done.filter(p=>p.model!==0),mh=mdl.filter(p=>p.model===p.res).length;
  $("pdLog").innerHTML=!P.length?`<p class="hint">${tt("還沒有紀錄。在上面選一檔股票、按「漲」或「跌」，5 個交易日後這裡會自動對答案。","No guesses yet. Pick a stock above and tap Up or Down; it's checked here after 5 trading days.")}</p>`
    :`<div class="grid"><div class="stat"><div class="sub">${tt("你的命中率","Your hit rate")}</div><b class="big2">${done.length?fmt(me/done.length*100,0)+"%":"—"}</b><div class="sub">${me}/${done.length}</div></div>
      <div class="stat"><div class="sub">${tt("預測分數的命中率","Score's hit rate")}</div><b class="big2">${mdl.length?fmt(mh/mdl.length*100,0)+"%":"—"}</b><div class="sub">${mh}/${mdl.length}</div></div></div>
      <div class="pdrows">${P.slice().reverse().slice(0,20).map(p=>`<div><span>${esc(p.n)}</span><span class="sub">${p.d.slice(5).replace("-","/")}</span><span>${tt("你","You")} ${p.me>0?"📈":"📉"} · ${tt("分數","Score")} ${p.model>0?"📈":p.model<0?"📉":"➖"}</span><b class="${p.res==null?"flat":p.res>0?"up":p.res<0?"down":"flat"}">${p.res==null?tt("等待中","Waiting"):(p.res>0?tt("漲了","Rose"):p.res<0?tt("跌了","Fell"):tt("平盤","Flat"))+(p.res!=null&&p.res===p.me?" ✅":p.res!=null&&p.res!==0?" ❌":"")}</b></div>`).join("")}</div>`;
}
function search(q){
  q=q.trim().toLowerCase();if(!q||!H){$("pdSug").innerHTML="";return}
  const r=[],Z=window.US_ZH||{};for(const c in H.s){if(c.toLowerCase().startsWith(q)||H.s[c][0].toLowerCase().includes(q)||(isUS()&&Z[c]&&Z[c].toLowerCase().includes(q)))r.push(c);if(r.length>=8)break}
  $("pdSug").innerHTML=r.length?r.map(c=>`<button data-c="${c}"><b>${esc(isUS()&&(window.US_ZH||{})[c]?window.US_ZH[c]:H.s[c][0])}</b><span class="sub">${c}</span></button>`).join(""):`<p class="sub">${tt("找不到，可能是成交量太小、沒有收錄。","Not found; it may trade too little to be tracked.")}</p>`;
  $("pdSug").querySelectorAll("button").forEach(b=>b.onclick=()=>choose(b.dataset.c));
}
async function ensure(){
  if(H||loading)return;loading=true;
  if(window.loaderHTML)$("pdStock").innerHTML=`<div style="display:grid;justify-items:center;gap:8px;padding:18px 0">${loaderHTML(true)}<span class="sub">${tt("正在讀取 60 天的歷史資料…","Loading 60 days of history…")}</span></div>`;
  const mk=MK;try{const r=await fetch((mk==="us"?"us.json":"hist.json")+"?t="+Date.now(),{cache:"no-store"});const j=await r.json();CACHE[mk]=j;if(mk===MK)H=j;medCache={};rankCache=null}catch(e){H=null}
  loading=false;
  if(!H||!H.dates||!H.dates.length){$("pdStock").innerHTML=`<p class="hint">${tt("歷史資料還在準備中（第一次大約需要一個下午）。先看看大盤的部分吧。","History is still being collected (the first time takes about an afternoon). Check the market section for now.")}</p>`;return}
  $("pdInfo").textContent=tt(`${isUS()?"美股":"台股"}歷史資料：${H.dates.length} 個交易日、${Object.keys(H.s).length} 檔 · 更新 ${H.updatedAt||""}`,`History: ${H.dates.length} trading days, ${Object.keys(H.s).length} stocks · updated ${H.updatedAt||""}`);
  if(!code||!H.s[code]){const L=pickList();code=L.length?L[0][0]:null}
  renderMarket();renderPicks();renderStock();renderLog();renderRank();syncMk();
  if(!MODEL[MK]){const m=MK;trainModel(()=>{if(m===MK)renderStock()})}
}
document.addEventListener("click",e=>{const b=e.target.closest(".pdlearn,.pdtile");if(!b)return;e.preventDefault();window.openLesson&&openLesson(b.dataset.l)});
/* 小教室示範：用目前選的股票真的數字 */
window.predictDemo=function(k){
  if(!H||!code||!H.s[code])return "";const S=series(code),t=S.c.length-1;if(t<21)return "";
  const nm=`<b style="display:inline;color:var(--ink);font-size:inherit">${esc(S.n)}</b>`;
  if(k==="trend"){const m=ma(S.c,t,20),m2=ma(S.c,t-5,20);return tt(`${nm} 收 ${fmt(S.c[t])}，20 日均線 ${fmt(m)}，5 天前的均線是 ${fmt(m2)}。價格在均線${S.c[t]>m?"上面":"下面"}、均線${m>m2?"往上":"往下"}。`,`${nm} closed at ${fmt(S.c[t])}; 20-day average ${fmt(m)} (was ${fmt(m2)} five days ago).`)}
  if(k==="cross")return tt(`${nm} 的 5 日均線 ${fmt(ma(S.c,t,5))}，20 日均線 ${fmt(ma(S.c,t,20))}。`,`${nm}: 5-day average ${fmt(ma(S.c,t,5))}, 20-day ${fmt(ma(S.c,t,20))}.`);
  if(k==="mom"){const r=(S.c[t]/S.c[t-20]-1)*100;return tt(`${nm} 20 天前是 ${fmt(S.c[t-20])}，現在 ${fmt(S.c[t])}，${r>=0?"漲":"跌"}了 ${fmt(Math.abs(r),1)}%。`,`${nm} went from ${fmt(S.c[t-20])} to ${fmt(S.c[t])} in 20 days (${pct(r)}).`)}
  if(k==="rs"){const r=(S.c[t]/S.c[t-20]-1)*100,md=median20(H.dates.indexOf(S.d[t]))*100;return tt(`${nm} 20 天 ${pct(r)}，所有股票的中間值是 ${pct(md)}。`,`${nm}: ${pct(r)} over 20 days vs a median of ${pct(md)}.`)}
  if(k==="rsi")return tt(`${nm} 現在的 RSI 是 ${fmt(rsi(S.c,t),0)}。`,`${nm}'s RSI is ${fmt(rsi(S.c,t),0)} now.`);
  if(k==="vol"){const va=avg(S.v.slice(t-20,t));return tt(`${nm} 今天成交 ${S.v[t].toLocaleString()} 張，前 20 天平均 ${Math.round(va).toLocaleString()} 張（${fmt(S.v[t]/va,1)} 倍）。`,`${nm} traded ${S.v[t].toLocaleString()} lots vs a ${Math.round(va).toLocaleString()} average (${fmt(S.v[t]/va,1)}×).`)}
  if(k==="inst"){if(!S.hasF)return tt("上櫃股票目前沒有個股法人資料。","No per-stock institutional data for OTC stocks yet.");const f5=S.f.slice(t-4,t+1).map(x=>x||0);return tt(`${nm} 近 5 天外資＋投信：${f5.map(x=>(x>0?"+":"")+x.toLocaleString()).join("、")} 張。`,`${nm}, last 5 days (lots): ${f5.map(x=>(x>0?"+":"")+x.toLocaleString()).join(", ")}.`)}
  if(k==="base"){const B=backtest(S);return B.n?tt(`${nm}：分數給了 ${B.n} 次方向，對 ${B.hit} 次；每次都猜比較常發生的那邊會對 ${fmt(B.base*100,0)}%。`,`${nm}: ${B.hit}/${B.n} right; base rate ${fmt(B.base*100,0)}%.`):""}
  return "";
};
function renderLearn(){
  const L=window.LESSONS||[];if(!$("pdLearn"))return;const n=window.lessonCount?lessonCount():0;
  $("pdLearn").innerHTML=`<div class="pdprog"><i style="width:${L.length?n/L.length*100:0}%"></i></div><p class="sub" style="margin:6px 0 10px">${tt(`已學會 ${n}／${L.length} 個（答對小測驗才算）`,`${n}/${L.length} learned (pass the quiz to count)`)}</p>
    <div class="pdtiles">${L.map(x=>`<button class="pdtile ${lessonDone(x.k)?"done":""}" data-l="${x.k}"><span class="ic">${x.ic}</span><span>${tt(x.name[0],x.name[1])}</span>${lessonDone(x.k)?"<i>✅</i>":""}</button>`).join("")}</div>`;
}
window.learnChanged=()=>{renderLearn();if(H&&code)renderStock();renderMarket()};
/* 訊號排行：所有收錄股票一起算 */
let rankCache=null;
function renderRank(){
  if(!H||!$("pdRank"))return;
  if(!rankCache){
    const last=H.dates[H.dates.length-1],all=[];
    for(const c in H.s){const S=series(c);if(!S||S.c.length<22||S.d[S.d.length-1]!==last)continue;
      const t=S.c.length-1,va=avg(S.v.slice(t-19,t+1));if(va<1000)continue;
      const V=verdict(factors(S,t,false));all.push({c,n:S.n,sc:V.score,cl:V.cl})}
    all.sort((a,b)=>b.sc-a.sc);rankCache={up:all.filter(x=>x.sc>=15).slice(0,5),dn:all.filter(x=>x.sc<=-15).slice(-5).reverse(),n:all.length,
      upN:all.filter(x=>x.sc>=15).length,dnN:all.filter(x=>x.sc<=-15).length};
  }
  const R=rankCache,mid=R.n-R.upN-R.dnN,row=x=>`<button data-c="${x.c}"><span>${esc(x.n)} <span class="sub">${x.c}</span></span>${bar(x.sc/50)}<b class="${x.cl}">${x.sc>0?"+":""}${x.sc}</b></button>`;
  $("pdRank").innerHTML=`<div class="pdratio"><span class="upbg" style="flex:${R.upN||0.01}">▲ ${R.upN}</span><span class="midbg" style="flex:${mid||0.01}">◆ ${mid}</span><span class="dnbg" style="flex:${R.dnN||0.01}">▼ ${R.dnN}</span></div>
    <p class="sub" style="margin:6px 0 10px">${tt(`成交量夠大的 ${R.n} 檔裡：${R.upN} 檔偏漲、${mid} 檔看不出來、${R.dnN} 檔偏跌（不含大盤分數）。點一檔可以看詳細。`,`Of ${R.n} liquid stocks: ${R.upN} lean up, ${mid} unclear, ${R.dnN} lean down (market factor excluded). Tap one for details.`)}</p>
    <div class="pdrk"><div><b class="up">▲ ${tt("分數最高","Highest")}</b>${R.up.map(row).join("")||`<p class="sub">—</p>`}</div><div><b class="down">▼ ${tt("分數最低","Lowest")}</b>${R.dn.map(row).join("")||`<p class="sub">—</p>`}</div></div>`;
  $("pdRank").querySelectorAll("button[data-c]").forEach(b=>b.onclick=()=>choose(b.dataset.c));
}
function syncMk(){document.querySelectorAll("#pdMk button").forEach(b=>b.classList.toggle("on",b.dataset.m===MK))}
function setMarket(m){if(m===MK)return;CODE[MK]=code;MK=m;H=CACHE[m];code=CODE[m];rankCache=null;medCache={};syncMk();
  $("pdSug").innerHTML="";$("pdQ").value="";$("pdQ").placeholder=m==="us"?tt("搜尋美股代號或名稱（例如 ANT、輝達）","Search US ticker or name"):tt("搜尋股票代號或名稱","Search code or name");
  renderMarket();if(H){if(!code||!H.s[code]){const L=pickList();code=L.length?L[0][0]:null}$("pdInfo").textContent=tt(`${m==="us"?"美股":"台股"}歷史資料：${H.dates.length} 個交易日、${Object.keys(H.s).length} 檔 · 更新 ${H.updatedAt||""}`,`${H.dates.length} days, ${Object.keys(H.s).length} stocks`);renderPicks();renderStock();renderLog();renderRank();if(!MODEL[MK])trainModel(()=>renderStock())}else ensure()}
document.addEventListener("click",e=>{const b=e.target.closest("#pdMk button");if(b)setMarket(b.dataset.m)});
window.predictOpen=function(m,c){setMarket(m);if(c){CODE[m]=c;if(H&&H.s[c]){code=c;renderPicks();renderStock()}else code=c}};
/* 給個股頁用：直接顯示「我的預測」卡片（不用切到預測分頁） */
async function getData(mk){
  if(CACHE[mk])return CACHE[mk];
  try{const r=await fetch((mk==="us"?"us.json":"hist.json")+"?t="+Date.now(),{cache:"no-store"});CACHE[mk]=await r.json();if(mk===MK&&!H)H=CACHE[mk]}catch(e){}
  return CACHE[mk];
}
window.predictCard=async function(mk,c,elId){
  const el=()=>document.getElementById(elId);if(!el())return;
  const D=await getData(mk);if(!el())return;
  if(!D||!D.s||!D.s[c]){el().innerHTML=`<p class="sub">${tt("這檔沒有足夠的歷史資料，沒辦法預測。","Not enough history to predict.")}</p>`;return}
  const sv=[H,MK];H=D;MK=mk;let html="";
  try{const S=series(c),t=S.c.length-1;
    if(S.c.length<22)html=`<p class="sub">${tt(`這檔目前只有 ${S.c.length} 天的資料，至少要 22 天才能預測。`,`Only ${S.c.length} days of data; 22 needed.`)}</p>`;
    else{const F=factors(S,t,true),V=verdict(F);html=callHTML(S,t,F)+`<p class="sub" style="margin:6px 0 0">${tt(`各方法加起來的分數：<b class="${V.cl}">${V.score>0?"+":""}${V.score}</b>／100。想看每個方法怎麼說，按下面的「看預測分析」。`,`Combined method score: ${V.score}/100. Tap Prediction below for details.`)}</p>`}
  }finally{H=sv[0];MK=sv[1]}
  el().innerHTML=html;
  if(!MODEL[mk])trainModel(()=>window.predictCard(mk,c,elId),mk,D);
};
window.klineData=getData;
window.predictRender=function(){
  renderLearn();
  if(!$("pdMkt"))return;
  renderMarket();
  if(H){renderPicks();renderStock();renderLog();renderRank()}else ensure();
};
window.predictReload=function(){H=null;window.predictRender()};
const q=$("pdQ");if(q)q.addEventListener("input",()=>search(q.value));
})();
