/* 更新通知：網站有新功能時，打開後跳出一張小卡片簡單介紹。
   以後每次加新功能，就在 NEWS 最上面加一筆（v 要換成新的、不一樣的代號）。 */
(function(){
var NEWS=[
  {v:"2026-11-19d",date:"11/19",items:[
    ["✨","按鍵特效和載入動畫","Button effects & loading animation","跟行事曆一樣：忍者外觀有紅色光點、偶爾飛過的手裏劍，點擊會出現刀光；咒術外觀有紫藍光點和光痕，點擊會出現光環。按鈕按下去會縮、會亮，主要按鈕有光掃過。打開網站和重新整理時也有載入動畫。","Same as the calendar: Ninja has red sparks, a passing shuriken and slash taps; Mystic has violet sparks, light streaks and ring taps. Buttons press, glow and shine, and there's a loading animation on launch and refresh."]
  ]},
  {v:"2026-11-19c",date:"11/19",items:[
    ["🔮","新外觀：咒術","New look: Mystic","深靛藍夜色加紫藍光暈，按鈕和分頁會發光，但數字和漲跌顏色保持清楚。設定 → 外觀 → 咒術。","Deep indigo with a violet glow. Buttons and tabs glow, but numbers and up/down colors stay crisp. Settings → Appearance → Mystic."],
    ["🥷","忍者外觀改版","Ninja look refresh","改成跟行事曆一樣的標準：朱紅重點色、明體標題、標題左邊一條色條，深色模式也能用，畫面更乾淨。","Now matches the calendar app: red accent, serif headings and a side bar on titles. Works in dark mode and looks cleaner."]
  ]},
  {v:"2026-11-19b",date:"11/19",items:[
    ["🚦","預測看得更清楚","Clearer predictions","每檔股票最上面直接寫「偏漲／偏跌」、把握度，以及支持和反對的理由。還多了一個總覽，看哪些股票分數最高、最低。","Each stock now opens with a clear up/down call, a confidence level, and reasons for and against, plus an overview of the highest and lowest scores."],
    ["📚","理論小教室","Theory class","10 個經濟學和投資理論，每個 1 分鐘：一句話、用真的股票示範、常見誤會、小測驗，答對才算學會。","10 economics and investing ideas, one minute each: one line, a real-stock example, a common mistake, and a quiz."]
  ]},
  {v:"2026-11-19",date:"11/19",items:[
    ["🔮","新分頁：漲跌預測","New tab: Up or down?","最右邊多了「預測」。它把書上常見的方法（趨勢、動能、RSI、量價、法人）各打分數，估計 5 天後偏漲還是偏跌，也會檢查過去準不準。","A new Predict tab scores common methods (trend, momentum, RSI, volume, institutions) to estimate the next 5 days, and checks how accurate that has been."],
    ["📒","跟分數比賽","Race the score","你也可以自己猜漲或跌，5 個交易日後自動對答案，看看你和分數誰比較準。","Make your own up/down guess; after 5 trading days it's checked so you can see who's more accurate."]
  ]},
  {v:"2026-11-18b",date:"11/18",items:[
    ["🔔","更新通知","Update notes","以後網站有新功能，打開時會跳出這張卡片告訴你。不想看可以到設定關掉。","When something new is added, this card pops up once. You can turn it off in Settings."]
  ]},
  {v:"2026-11-18",date:"11/18",items:[
    ["🏪","上櫃股票也查得到","OTC stocks","除了上市，現在也有櫃買中心的股票，每檔還多了當天最高價和最低價。","OTC (TPEx) stocks are included now, with each stock's daily high and low."],
    ["🎓","小測驗變成 10 級","10-level quiz","總共 173 題。Lv.6～10 是情境題，答完會附解題步驟。","The quiz now has 10 levels and 173 questions. Levels 6–10 are scenario questions with worked steps."],
    ["🍩","持股圓圈圖","Holdings ring chart","模擬頁的「我的持股」用圓圈顯示每檔股票和現金各占多少。","Practice → My holdings shows a ring chart of how your money is split."],
    ["🥷","忍者外觀","Ninja look","設定 → 外觀 → 忍者，可以換成和紙、墨山加朱紅印章的樣子。","Settings → Appearance → Ninja for a paper-and-ink look."],
    ["⏱️","更新更準時","More reliable updates","收盤後會一直檢查，直到當天的資料抓齊。成交金額也改成跟新聞一樣的算法。","Data keeps checking after the close until it's complete, and trade value now matches the news."]
  ]}
];
var LATEST=NEWS[0].v;
function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function on(){return get("tw_news_on")!=="0"}
var tt=function(zh,en){return (window.EN?en:zh)};

var css=document.createElement("style");
css.textContent=
".newsmask{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:20px;opacity:0;transition:opacity .25s}"+
".newsmask.show{opacity:1}"+
".newscard{width:min(100%,420px);max-height:80vh;overflow:auto;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:var(--r);padding:20px 18px 16px;box-shadow:0 20px 50px -20px rgba(0,0,0,.5);transform:translateY(24px) scale(.96);transition:transform .35s cubic-bezier(.2,.9,.3,1.2)}"+
".newsmask.show .newscard{transform:none}"+
":root[data-theme=\"ninja\"] .newscard{border:2px solid var(--ink);box-shadow:5px 5px 0 var(--ink)}"+
".newscard h3{margin:0 0 2px;font-size:19px}"+
".newscard .nsub{color:var(--mute);font-size:13px;margin-bottom:12px}"+
".newsitem{display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--line)}"+
".newsitem .ic{font-size:24px;line-height:1.2;flex:none}"+
".newsitem b{display:block;font-size:15px}"+
".newsitem span{font-size:14px;color:var(--mute);line-height:1.6}"+
".newsbtns{display:flex;gap:8px;margin-top:12px}"+
".newsbtns button{flex:1;border:0;border-radius:12px;padding:11px;font:inherit;font-weight:700;font-size:15px}"+
".newsbtns .ok{background:var(--accent);color:#fff}"+
".newsbtns .off{background:var(--line);color:var(--ink);flex:.8}";
document.head.appendChild(css);

function show(list,isAuto){
  if(document.querySelector(".newsmask"))return;
  var m=document.createElement("div");m.className="newsmask";
  var items=[];list.forEach(function(n){n.items.forEach(function(x){items.push(x)})});
  m.innerHTML='<div class="newscard" role="dialog" aria-label="'+tt("新功能","What's new")+'">'+
    '<h3>'+tt("🎉 有新功能！","🎉 What's new")+'</h3>'+
    '<div class="nsub">'+(isAuto?tt("網站剛剛更新了，這次多了：","The site was just updated. Here's what changed:"):tt("最近的更新","Recent updates"))+'</div>'+
    items.map(function(x){return '<div class="newsitem"><div class="ic">'+x[0]+'</div><div><b>'+tt(x[1],x[2])+'</b><span>'+tt(x[3],x[4])+'</span></div></div>'}).join("")+
    '<div class="newsbtns">'+(isAuto?'<button class="off">'+tt("不要再跳出","Don't show again")+'</button>':'')+'<button class="ok">'+tt("知道了","Got it")+'</button></div></div>';
  document.body.appendChild(m);
  requestAnimationFrame(function(){m.classList.add("show")});
  function close(){set("tw_news_seen",LATEST);m.classList.remove("show");setTimeout(function(){m.remove()},300)}
  m.querySelector(".ok").onclick=close;
  var off=m.querySelector(".off");if(off)off.onclick=function(){set("tw_news_on","0");syncSet();close()};
  m.onclick=function(e){if(e.target===m)close()};
}

/* 自動跳出：只顯示「上次看過之後」的新東西 */
function autoShow(){
  var seen=get("tw_news_seen");
  if(!on()){set("tw_news_seen",LATEST);return}
  if(seen===LATEST)return;
  var fresh=[];for(var i=0;i<NEWS.length;i++){if(NEWS[i].v===seen)break;fresh.push(NEWS[i])}
  if(fresh.length)show(fresh.slice(0,3),true);
}

/* 設定裡的開關 */
function syncSet(){document.querySelectorAll("#setNews button").forEach(function(b){b.classList.toggle("on",b.dataset.v===(on()?"1":"0"))})}
function initSet(){
  var seg=document.getElementById("setNews");if(!seg)return;
  seg.querySelectorAll("button").forEach(function(b){b.onclick=function(){set("tw_news_on",b.dataset.v);syncSet()}});
  var see=document.getElementById("seeNews");if(see)see.onclick=function(){var d=document.getElementById("setDone");if(d)d.click();setTimeout(function(){show(NEWS.slice(0,2),false)},250)};
  syncSet();
}
window.showNews=function(){show(NEWS.slice(0,2),false)};
initSet();
setTimeout(autoShow,1200);
})();
