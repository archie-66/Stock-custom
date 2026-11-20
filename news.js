/* 更新通知：網站有新功能時，打開後跳出一張小卡片簡單介紹。
   以後每次加新功能，就在 NEWS 最上面加一筆（v 要換成新的、不一樣的代號）。 */
(function(){
var NEWS=[
  {v:"2026-11-20c",date:"11/20",items:[
    ["🧭","全部股票都有公司遠見和領導人","Vision & leaders for every stock","美股約 95 檔每一家都有執行長、遠見、策略和要注意的地方，執行長每天會用公開資料庫核對，換人會提醒。台股約 2,000 家的董事長和總經理直接用官方資料、每天更新；50 檔熱門股有專屬的遠見和策略，其他公司顯示所屬產業的共通重點，ETF 會說明它的投資方式。","Every US stock now has its CEO, vision, strategy and risks (CEOs checked daily). All ~2,000 Taiwan companies show their official chair and president, with tailored notes for 50 popular ones, industry-wide notes for the rest, and ETF explanations."]
  ]},
  {v:"2026-11-20b",date:"11/20",items:[
    ["🔮","預測直接告訴你答案","A clear call","預測頁每檔股票最上面會直接寫「偏漲／偏跌／看不出方向」、上漲機率，以及 5 天後大概的價格範圍。","Each stock now opens with a clear up/down call, a probability and a 5-day price range."],
    ["🎯","會自己學習的模型","A model that learns","用全部股票過去的資料，讓模型自己學每個方法該占多少比重，再用它沒看過的最近資料考試，誠實顯示命中率，也跟亂猜比較。","It learns how much each method should count from all stocks' history, then is tested on recent data it hasn't seen."],
    ["🧭","公司遠見、策略和執行長","Vision, strategy & CEOs","熱門大公司（Anthropic、輝達、蘋果、微軟、台積電、鴻海、聯發科、台達電等）多了領導人介紹、公司遠見、策略重點和要注意的地方。","Major companies now include their leader, vision, strategy and risks."]
  ]},
  {v:"2026-11-20",date:"11/20",items:[
    ["📰","台股也有新聞和分析","News & analysis for Taiwan stocks","在個股清單點開一檔股票，按「📰 新聞與分析」，會看到公司簡介（產業、成立和掛牌年份、董事長）、根據最近 60 天股價自動整理的重點（趨勢、跟其他股票比、高低位置、波動、法人、成交量），還有近三天的新聞標題。","Open a stock in the list and tap 📰 for a company profile, auto-generated highlights and the last 3 days of headlines."],
    ["🆕","美股加入 Anthropic（ANT）","Anthropic (ANT) added","新上市的 Anthropic 也會出現在美股排行和搜尋裡，第一天的股價和新聞會一起更新。","Newly listed Anthropic now appears in US rankings and search, with its first prices and news."]
  ]},
  {v:"2026-11-19l",date:"11/19",items:[
    ["📰","美股：新聞、簡介和簡短分析","US stocks: news, profile & quick analysis","點任何一檔美股，會看到用白話寫的公司簡介、根據最近 60 天股價自動整理的重點（趨勢、跟大盤比、52 週高低位置、波動），還有近三天的新聞標題（中文優先），點標題會打開原始新聞。","Open any US stock for a plain-language profile, auto-generated highlights from 60 days of prices, and the last 3 days of headlines that open the original articles."]
  ]},
  {v:"2026-11-19k",date:"11/19",items:[
    ["🇺🇸","新分頁：美股","New tab: US stocks","多了「美股」分頁：S&P 500、那斯達克、道瓊、費城半導體四個指數，大約 100 檔熱門美股和 ETF 的漲跌排行、搜尋（可以打中文，例如「輝達」）、自選，還有 Anthropic（ANT）新上市專區。台灣時間每天早上自動更新美股收盤價。","A new US tab: four indexes, about 100 popular US stocks and ETFs with gainers/losers, search, favorites, and an Anthropic (ANT) IPO card. US closes update every Taiwan morning."],
    ["🔮","預測也能分析美股","Predictions for US stocks","預測頁的「個股」可以切換台股或美股，美股會用 S&P 500 當大盤環境來打分數。","The Predict tab can now switch between Taiwan and US stocks; US scores use the S&P 500 as the market backdrop."]
  ]},
  {v:"2026-11-19j",date:"11/19",items:[
    ["🔊","武士音效","Samurai sounds","新增原創合成的刀聲：開場拔刀「鏘——」、斬開時有破風聲、衝擊和碎冰聲，點畫面也有輕輕的揮刀聲。手機規定要先碰過螢幕才會有聲音，可以在設定 → 武士音效關掉。","New original blade sounds: a ringing draw, a slash with impact and shattering ice, and a light swish on taps. Phones only play sound after you've touched the screen. Turn it off in Settings → Samurai sounds."],
    ["🗡️","拔刀更順更帥","Smoother, cooler draw","開場不會再先閃出文字。刀先微微顫動蓄力，再快速出鞘，帶殘影和刀口的閃光，刀身反光掃過兩次。","No more text flash at the start. The blade trembles, then snaps out of the sheath with an afterimage and a flash, and the edge gleams twice."]
  ]},
  {v:"2026-11-19i",date:"11/19",items:[
    ["🎬","武士開場更順、更直接","Smoother samurai opening","拿掉開場的文字，動畫播完直接一刀切開進入網站，播放時也不會卡卡的了。另外修好了點擊卡片時，卡片會消失的問題。","The opening text is gone, so it cuts straight into the site, and it plays smoothly now. Also fixed tapped cards disappearing."]
  ]},
  {v:"2026-11-19h",date:"11/19",items:[
    ["⚡","武士開場更炫了","Bigger samurai opening","背景有放射狀的速度線，冰粒往刀身聚集，拔刀時迸出火花，刀擺好架勢後白光一閃，X 字雙斬加上衝擊波，碎冰往四面八方炸開，畫面跟著震動再裂開。整段固定播大約 2.7 秒，播完才進入網站。","Speed lines, ice gathering on the blade, sparks on the draw, a white flash, an X-shaped double slash with a shockwave, shattering ice and a screen shake. It always plays in full (about 2.7s) before the site opens."],
    ["✨","武士點擊特效","Samurai tap effects","在網站裡點任何地方，都會出現兩道交叉刀痕、冰環、小閃光和碎冰。","Tapping anywhere shows two crossing slashes, an ice ring, a flash and shards."],
    ["🗡️","標題的小武士刀重新設計","Redesigned heading katana","每個卡片標題前面改成一把有纏繩刀柄、刀鐔和彎曲刀身的迷你武士刀。","Each card title now has a proper mini katana with a wrapped handle, guard and curved blade."]
  ]},
  {v:"2026-11-19g",date:"11/19",items:[
    ["⚔️","新外觀：武士","New look: Samurai","冷酷的藍白配色加上鋼鐵深藍底，卡片邊緣會閃過刀刃般的反光。按按鈕會出現一道刀光，點畫面會劃出冰藍刀痕和碎冰，背景飄著冰晶。設定 → 外觀 → 武士。","Cool blue and white on steel navy, with blade-like glints on cards. Buttons flash a cut, taps leave an ice-blue slash and shards, and ice crystals drift in the background. Settings → Appearance → Samurai."],
    ["🗡️","武士開場動畫","Samurai opening","打開網站時，武士刀會慢慢出鞘，刀身閃過一道反光，最後一刀把整個畫面斬成兩半，再往兩邊滑開。","On launch, a katana slides out of its sheath, the blade gleams, and one slash splits the screen in two."]
  ]},
  {v:"2026-11-19f",date:"11/19",items:[
    ["🌙","忍者載入動畫：紅月與櫻花","Ninja loader: red moon & sakura","黑色大手裏劍帶殘影高速旋轉，背後是發光的紅色彎月，金色和白色的月牙刀光一直劃過，櫻花花瓣和火星往外飛，三枚小手裏劍繞著轉。讀完時「砰」一聲變成煙霧。","A black shuriken spins with afterimages in front of a glowing red crescent moon, with gold and white crescent slashes, flying sakura petals and embers, and three orbiting shuriken. It vanishes in a puff of smoke."]
  ]},
  {v:"2026-11-19e",date:"11/19",items:[
    ["🟣","全新紫色能量球","New violet energy orb","咒術外觀的載入動畫升級了：會變色脈動的電漿核心、旋轉的魔法陣、往中心聚集的光粒、四圈立體能量環、到處亂竄的閃電和一圈圈衝擊波。開場會震動，讀完時白光爆開。重新整理時也有迷你版。","The Mystic loading animation now has a pulsing plasma core, three 3D energy rings, orbiting sparks, flickering lightning and shockwaves, plus a mini version when refreshing."]
  ]},
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
