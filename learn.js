/* 理論小教室：預測分頁用到的每個方法，用「一句話 → 用真實股票示範 → 常見誤會 → 小測驗」學會它。
   內容是用自己的話整理的常見觀念，不是書上的原文。 */
(function(){
const tt=(zh,en)=>window.EN?en:zh;
const KEY="tw_learned";
const get=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}};
const put=o=>{try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}};

/* q: [題目, [選項...], 正確答案的位置, 解釋] —— 正確答案的位置和長度刻意打散 */
const L=[
 {k:"emh",ic:"🎲",name:["效率市場假說","Efficient-market hypothesis"],who:["經濟學家法瑪（Fama）","Economist Eugene Fama"],
  one:["大家知道的消息很快就會反映在股價裡，所以短期漲跌很像擲硬幣，很難靠公開資訊一直贏。","News everyone knows gets priced in fast, so short-term moves look a lot like coin flips."],
  how:["這就是為什麼預測頁每個分數都附上「準不準」：如果方法沒有比亂猜好，就代表市場可能已經把這些資訊算進去了。","That's why every score here shows its past accuracy: if a method can't beat guessing, the market has probably priced it in already."],
  myth:["誤會：「有效率」不是說股價永遠正確，而是說要穩定打敗市場非常難。","Myth: 'efficient' doesn't mean prices are always right, only that beating the market consistently is very hard."],
  q:[["根據效率市場假說，為什麼短期漲跌很難猜？",["因為股價每天都隨機亂跳","因為公開消息很快就反映在股價裡","因為證交所會限制漲跌"],1,"重點是「消息很快被反映」，不是股價毫無道理。"],
     ["如果一個方法回測只對 50%，最合理的解讀是？",["它跟亂猜差不多","它一定是壞掉了，換掉就好","它其實很準，只是運氣不好，下次就會變準"],0,"跟亂猜差不多的方法，不應該拿來當買賣依據。"]]},
 {k:"trend",ic:"📈",name:["道氏理論與均線","Dow Theory & moving averages"],who:["查爾斯·道（Charles Dow）","Charles Dow"],
  one:["股價常常有「大方向」，一旦開始往上或往下，通常會走一段時間。","Prices often have a main direction that lasts a while once it starts."],
  how:["均線就是最近 N 天收盤價的平均。價格在 20 日均線上面、而且均線往上，代表最近一個月買的人大多在賺錢。","A moving average is the average close over N days. Price above a rising 20-day average means most recent buyers are in profit."],
  myth:["誤會：在均線上面不代表明天一定漲，趨勢也會突然轉向。","Myth: being above the average doesn't mean tomorrow is up; trends can turn suddenly."],
  q:[["「20 日均線」是什麼？",["最近 20 天的最高價","最近 20 天收盤價的平均","20 天後的預測價格"],1,"均線就是平均，用來看大方向。"],
     ["價格在均線上面、均線也往上，通常被看成？",["趨勢偏多","趨勢偏空","一定會跌停"],0,"價格和均線都往上，是偏多的趨勢。"]]},
 {k:"cross",ic:"✂️",name:["葛蘭碧法則（黃金交叉）","Granville's rules (golden cross)"],who:["分析師葛蘭碧（Joseph Granville）","Analyst Joseph Granville"],
  one:["短期均線往上穿過長期均線叫「黃金交叉」，往下穿過叫「死亡交叉」，常被當成轉強或轉弱的訊號。","A short average crossing above a long one is a 'golden cross'; crossing below is a 'death cross'."],
  how:["5 日均線代表最近一週的平均成本，20 日代表一個月。短的比長的高，表示最近買的人願意出比較高的價錢。","The 5-day average is about a week of prices and the 20-day about a month. Short above long means recent buyers paid more."],
  myth:["誤會：交叉常常「慢半拍」，等它出現時，股價可能已經漲或跌一段了。","Myth: crosses lag; by the time one appears, much of the move may be done."],
  q:[["5 日均線往上穿過 20 日均線叫做？",["死亡交叉","黃金交叉","均線糾結"],1,"往上穿過＝黃金交叉。"],
     ["交叉訊號最大的缺點是什麼？",["常常比股價晚一步出現","每天都會出現很多次","只有上櫃股票才有"],0,"均線是過去價格的平均，所以一定比較慢。"]]},
 {k:"mom",ic:"🚀",name:["動能效應","Momentum effect"],who:["學者 Jegadeesh 與 Titman 的研究","Research by Jegadeesh & Titman"],
  one:["最近一段時間漲比較多的股票，接下來一小段時間常常還會比較強。","Stocks that rose most recently often stay stronger for a little while."],
  how:["預測頁用「近 20 個交易日漲跌幅」來看：漲超過 8% 給 +2，跌超過 8% 給 -2。","The Predict tab uses the 20-day change: above +8% scores +2, below −8% scores −2."],
  myth:["誤會：動能不會永遠持續，漲太多以後也常常回檔，所以要搭配 RSI 一起看。","Myth: momentum doesn't last forever; check RSI too."],
  q:[["動能效應在說什麼？",["跌最多的股票一定最快漲回來","最近強的股票短期內常常還會比較強","股價每 20 天會重複一次"],1,"強者恆強（短期）就是動能。"],
     ["為什麼動能要跟 RSI 一起看？",["避免追在漲太多、快要休息的地方","因為 RSI 會告訴你明天的價格","因為兩個是同一個東西"],0,"動能看強弱，RSI 看是不是過熱。"]]},
 {k:"rs",ic:"🏁",name:["相對強弱","Relative strength"],who:["技術分析常用觀念","A common technical idea"],
  one:["不只看股票自己漲多少，也要跟其他股票比：大盤跌它不跌，代表有人在撐。","Compare a stock with the rest: if the market falls and it doesn't, someone is supporting it."],
  how:["預測頁拿這檔 20 天的漲跌，減掉所有股票 20 天漲跌的中間值。多 5 個百分點以上算強。","The tab compares the stock's 20-day change to the median stock's; 5+ points better counts as strong."],
  myth:["誤會：漲了不一定強。如果大家都漲 10%、它只漲 3%，其實是比較弱。","Myth: up isn't always strong. Up 3% when everyone is up 10% is weak."],
  q:[["大家平均漲 10%，某檔漲 3%，相對強弱是？",["比較弱","比較強","無法判斷"],0,"要跟別人比，3% 比 10% 少，所以比較弱。"],
     ["相對強弱最主要是在比什麼？",["股票和其他股票誰的表現比較好","公司的營收","股價和面額"],0,"跟其他股票比表現。"]]},
 {k:"rsi",ic:"🌡️",name:["RSI 相對強弱指標","RSI"],who:["威爾德（J. Welles Wilder）","J. Welles Wilder"],
  one:["RSI 從 0 到 100，看最近 14 天「上漲的力道」占全部力道多少。超過 70 算過熱，低於 30 算超賣。","RSI runs 0–100 and measures how much of the last 14 days' movement was up. Above 70 is hot, below 30 oversold."],
  how:["RSI 80 代表最近的漲跌幾乎都是漲，短期容易休息；RSI 20 代表幾乎都在跌，容易反彈。","RSI 80 means nearly all recent moves were up, so a pause is common; RSI 20 means nearly all were down."],
  myth:["誤會：強勢股的 RSI 可以在 70 以上待很久，過熱不等於馬上會跌。","Myth: strong stocks can stay above 70 for a long time; hot doesn't mean an immediate drop."],
  q:[["RSI 85 通常被解讀成？",["超賣，容易反彈","過熱，短期容易休息","公司快要倒閉"],1,"超過 70 就算過熱，85 更明顯。"],
     ["RSI 是用什麼算出來的？",["最近一段時間上漲和下跌的力道","公司的本益比","外資的持股比例"],0,"RSI 只看價格的漲跌力道。"]]},
 {k:"vol",ic:"🔊",name:["量價關係","Price & volume"],who:["技術分析常用觀念","A common technical idea"],
  one:["成交量是「有多少人在參與」。價格動的時候有大量配合，那個方向比較可信。","Volume shows how many people are taking part; moves on big volume are more believable."],
  how:["預測頁拿今天成交量和前 20 天平均比：超過 1.5 倍又上漲，給 +1；超過 1.5 倍又下跌，給 -1。","The tab compares today's volume with the 20-day average: 1.5× on a rise is +1, 1.5× on a drop is −1."],
  myth:["誤會：爆大量不一定是好事，在高點爆量下跌，常常是有人在大賣。","Myth: huge volume isn't always good; a big-volume drop at a high often means heavy selling."],
  q:[["股價上漲、成交量只有平常的一半，代表？",["很多人搶著買，非常可靠","參與的人少，上漲比較不可信","一定會漲停"],1,"量縮的上漲，力道比較弱。"],
     ["大量下跌通常代表？",["很多人在賣","公司要發股利","沒有人在交易"],0,"量大又跌，代表賣的人多。"]]},
 {k:"inst",ic:"🏦",name:["籌碼分析（法人）","Flow analysis (institutions)"],who:["台股常用的分析方法","Common in Taiwan's market"],
  one:["外資和投信的錢很多，他們連續買進一檔股票，常常會把價格撐住或推高。","Foreign funds and local trusts move big money; steady buying often supports a price."],
  how:["預測頁把近 5 天外資＋投信的買賣超張數加起來，再跟這檔平常的成交量比，看買得多不多。","The tab adds up 5 days of foreign + trust net buying and compares it with normal volume."],
  myth:["誤會：法人也會看錯、也會突然改賣，而且公布時已經是收盤後的資料。","Myth: institutions can be wrong too, and the data is only published after the close."],
  q:[["「外資買超」是什麼意思？",["外資買的比賣的多","外資買不到股票","外資把股票全部賣光"],0,"買超＝買的比賣的多。"],
     ["為什麼不能只看法人買賣？",["因為法人只買上櫃股票","因為法人也會看錯，而且資料比較晚公布","因為法人的資料是假的"],1,"法人也是人，資料也有時間差。"]]},
 {k:"mkt",ic:"🌏",name:["系統性風險（Beta）","Market risk (beta)"],who:["資本資產定價模型（CAPM）","The CAPM model"],
  one:["有些風險是整個市場一起承擔的，例如利率、景氣、國際消息，大部分股票都會一起動。","Some risks hit the whole market at once, like rates or the economy, so most stocks move together."],
  how:["所以預測頁也會看大盤：大盤偏空的時候，個股的分數會被扣一點。","So the tab also checks the market: when it looks weak, each stock's score is pulled down a bit."],
  myth:["誤會：買很多檔股票可以分散個別公司的風險，但沒辦法分散整個市場一起跌的風險。","Myth: owning many stocks spreads company risk, but not the risk of the whole market falling."],
  q:[["下面哪一個是「系統性風險」？",["某家公司老闆被調查","央行升息，整個市場一起跌","某家工廠失火"],1,"影響整個市場的才是系統性風險。"],
     ["分散投資很多檔股票，能消除哪種風險？",["個別公司的風險","整個市場一起跌的風險","兩種都能完全消除"],0,"分散只能降低個別公司的風險。"]]},
 {k:"base",ic:"📊",name:["回測與基準率","Backtests & base rates"],who:["統計學的基本觀念","A basic idea from statistics"],
  one:["判斷方法準不準，要跟「什麼都不做、只猜比較常發生的那一邊」比，這個叫基準率。","To judge a method, compare it with always guessing the more common outcome: the base rate."],
  how:["如果過去 60 天裡有 60% 的時間是漲，那每次都猜漲就有 60%。方法要明顯超過 60% 才算有用。","If prices rose 60% of the time, always guessing 'up' scores 60%. A method must clearly beat that."],
  myth:["誤會：猜對 6 成聽起來很厲害，但如果基準率也是 6 成，那就只是剛好而已。樣本太少也不準。","Myth: 60% sounds good, but not if the base rate is also 60%. Small samples mislead too."],
  q:[["某方法猜對 58%，同期間每次都猜漲會對 60%，這個方法？",["很好用，因為超過一半","沒有比基準率好","一定會越來越準"],1,"58% 比 60% 還低，沒有比較好。"],
     ["回測次數只有 6 次，最合理的看法是？",["樣本太少，參考就好","已經可以證明它很準","代表它明天一定對"],0,"次數太少，運氣的影響很大。"]]}
];
window.LESSONS=L;
const byK={};L.forEach(x=>byK[x.k]=x);

const css=document.createElement("style");
css.textContent=`
.lsnmask{position:fixed;inset:0;z-index:45;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .25s}
.lsnmask.show{opacity:1}
.lsn{width:min(100%,560px);max-height:88vh;overflow:auto;background:var(--card);color:var(--ink);border-radius:22px 22px 0 0;padding:18px 18px calc(var(--sb,0px) + 22px);transform:translateY(40px);transition:transform .35s cubic-bezier(.2,.9,.3,1.1)}
.lsnmask.show .lsn{transform:none}
:root[data-theme="ninja"] .lsn{border:2px solid var(--ink);border-bottom:0}
.lsn .top2{display:flex;align-items:center;gap:10px}.lsn .top2 .ic{font-size:30px}.lsn h3{margin:0;font-size:19px}.lsn .who{color:var(--mute);font-size:12.5px}
.lsn .x2{margin-left:auto;border:0;background:var(--line);color:var(--ink);width:32px;height:32px;border-radius:50%;font-size:16px}
.lsn .stp{display:flex;gap:4px;margin:14px 0 10px}.lsn .stp i{flex:1;height:4px;border-radius:2px;background:var(--line)}.lsn .stp i.on{background:var(--accent)}
.lsn .blk{border-radius:14px;padding:12px 14px;margin-bottom:8px;font-size:15px;line-height:1.7}
.lsn .blk b{display:block;font-size:12.5px;color:var(--mute);margin-bottom:2px}
.lsn .b1{background:var(--accentbg)}.lsn .b2{background:var(--bg);border:1px solid var(--line)}.lsn .b3{background:var(--warnbg)}
.lsn .qq{font-weight:800;font-size:16px;margin:4px 0 10px;line-height:1.5}
.lsn .opts{display:flex;flex-wrap:wrap;gap:8px}
.lsn .opts button{flex:1 1 140px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-size:14.5px;padding:11px 10px;border-radius:12px;text-align:center;line-height:1.4}
.lsn .opts button.ok{border-color:var(--green);background:var(--greenbg)}.lsn .opts button.no{border-color:var(--red);background:var(--redbg)}
.lsn .exp{margin-top:10px;font-size:14px;line-height:1.6}
.lsn .nav2{display:flex;gap:8px;margin-top:14px}.lsn .nav2 button{flex:1;border:0;border-radius:12px;padding:12px;font:inherit;font-weight:800;font-size:15px;background:var(--accent);color:#fff}
.lsn .nav2 button.gh{background:var(--line);color:var(--ink);flex:.6}
`;
document.head.appendChild(css);

/* demo(k) 由預測頁提供：用目前選的股票真實數字示範 */
function open(k,startAt){
  const x=byK[k];if(!x)return;
  const demo=window.predictDemo?window.predictDemo(k):"";
  let step=startAt||0,qi=0,answered=false;
  const m=document.createElement("div");m.className="lsnmask";document.body.appendChild(m);
  const total=4;
  function close(){m.classList.remove("show");setTimeout(()=>m.remove(),300);if(window.learnChanged)window.learnChanged()}
  function draw(){
    const head=`<div class="top2"><span class="ic">${x.ic}</span><div><h3>${tt(x.name[0],x.name[1])}</h3><div class="who">${tt("來自：","From: ")}${tt(x.who[0],x.who[1])}</div></div><button class="x2">✕</button></div>
      <div class="stp">${[0,1,2,3].map(i=>`<i class="${i<=step?"on":""}"></i>`).join("")}</div>`;
    let body="";
    if(step===0)body=`<div class="blk b1"><b>${tt("① 一句話","① In one line")}</b>${tt(x.one[0],x.one[1])}</div>`;
    if(step===1)body=`<div class="blk b2"><b>${tt("② 怎麼看","② How to read it")}</b>${tt(x.how[0],x.how[1])}</div>${demo?`<div class="blk b1"><b>${tt("用真的股票看看","With a real stock")}</b>${demo}</div>`:""}`;
    if(step===2)body=`<div class="blk b3"><b>${tt("③ 常見誤會","③ Common mistake")}</b>${tt(x.myth[0],x.myth[1])}</div>`;
    if(step===3){const q=x.q[qi];
      body=`<div class="blk b2" style="padding-bottom:14px"><b>${tt(`④ 小測驗 ${qi+1}／${x.q.length}`,`④ Quiz ${qi+1}/${x.q.length}`)}</b><div class="qq">${q[0]}</div>
        <div class="opts">${q[1].map((o,i)=>`<button data-i="${i}">${o}</button>`).join("")}</div><div class="exp" id="lsnExp"></div></div>`}
    const last=step===3&&qi===x.q.length-1;
    const nav=`<div class="nav2">${step>0?`<button class="gh" data-a="back">${tt("上一步","Back")}</button>`:""}<button data-a="next" ${step===3&&!answered?"disabled style=\"opacity:.4\"":""}>${step<3?tt("下一步","Next"):last?tt("完成","Done"):tt("下一題","Next question")}</button></div>`;
    m.innerHTML=`<div class="lsn" role="dialog">${head}${body}${nav}</div>`;
    m.querySelector(".x2").onclick=close;
    m.onclick=e=>{if(e.target===m)close()};
    m.querySelectorAll(".opts button").forEach(b=>b.onclick=()=>{
      if(answered)return;answered=true;const q=x.q[qi],ok=+b.dataset.i===q[2];
      m.querySelectorAll(".opts button").forEach(z=>{if(+z.dataset.i===q[2])z.classList.add("ok");else if(z===b)z.classList.add("no")});
      m.querySelector("#lsnExp").innerHTML=(ok?tt("✅ 答對了！","✅ Correct! "):tt("❌ 再想一下：","❌ Not quite: "))+q[3];
      const g=get();g[k]=g[k]||{};g[k][qi]=ok;put(g);
      const nb=m.querySelector('[data-a="next"]');nb.disabled=false;nb.style.opacity=1;
    });
    m.querySelectorAll(".nav2 button").forEach(b=>b.onclick=()=>{
      if(b.dataset.a==="back"){if(step===3&&qi>0){qi--;answered=false}else step--;draw();return}
      if(step<3){step++;answered=false;draw();return}
      if(qi<x.q.length-1){qi++;answered=false;draw();return}
      close();
    });
  }
  draw();requestAnimationFrame(()=>m.classList.add("show"));
}
function learned(k){const g=get()[k];return !!g&&byK[k].q.every((_,i)=>g[i]===true)}
window.openLesson=open;
window.lessonDone=learned;
window.lessonCount=()=>L.filter(x=>learned(x.k)).length;
})();
