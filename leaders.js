/* 公司的遠見、策略和執行長（用自己的話整理，資料整理於 2026/11/20；人事可能變動，以公司公告為準）
   key：美股代號或台股代號。ceo：[名字, 一句話介紹]；v：遠見；s：策略重點；w：要注意的地方 */
window.LEADERS_ASOF="2026/11/20";
window.LEADERS={
ANT:{ceo:["Dario Amodei（共同創辦人）","物理背景出身的研究者，2021 年和妹妹 Daniela（現任總裁）等人離開 OpenAI 創立 Anthropic，常公開談 AI 安全，也主張業界應放慢釋出最強能力的速度。"],
 v:"相信 AI 對經濟的影響會比工業化、電力和網路更大，並主張要「安全地」做到最前面。",
 s:["專攻企業和開發者市場，寫程式的 AI 工具是最大的收入來源","大量投資運算設備，簽下數千億美元的長期合約","用公益公司和長期利益信託的結構，讓創辦團隊保有控制權"],
 w:["運算成本非常高，最近一季又回到營業虧損","公司結構可能做出不以股東短期利益為優先的決定","這個網站的 AI 是 Anthropic 做的，看這檔請多參考其他資料"]},
NVDA:{ceo:["Colette Kress（臨時執行長，兼財務長）","2013 年加入輝達當財務長，之前在微軟、思科工作。2026/11/12 共同創辦人黃仁勳因個人爭議辭職後接任，董事會正在找正式的執行長；同時新設董事長，由前新思科技執行長 Harvey Jones 擔任。"],
 v:"把 GPU 從遊戲顯示卡變成 AI 時代的「運算引擎」，提供晶片、網路、軟體一整套的 AI 資料中心方案。",
 s:["每年推出新一代 AI 晶片和整櫃式伺服器","用 CUDA 軟體生態綁住開發者","擴大到網路、CPU、車用和機器人"],
 w:["創辦人突然離開，領導和策略的延續性是最大問題","大客戶（微軟、Google、亞馬遜）都在做自己的 AI 晶片","AMD、博通等對手趁機搶單"]},
AAPL:{ceo:["John Ternus","在蘋果待了二十多年的硬體工程主管，參與過 iPad、AirPods 等產品，2026/9/1 接替庫克（Tim Cook）。庫克改任執行董事長。"],
 v:"做軟硬體整合、重視隱私和使用體驗的產品，讓使用者留在蘋果生態系裡。",
 s:["iPhone 仍是核心，同時推出更便宜的機種擴大客群","服務（App Store、iCloud、Apple Music 等）收入已超過千億美元","在 AI 上加快腳步，把 AI 功能放進自家裝置"],
 w:["新執行長上任不久，AI 策略被認為比對手慢","對中國市場和供應鏈的依賴","各國對 App Store 收費的法律挑戰"]},
MSFT:{ceo:["Satya Nadella","2014 年接任執行長，帶領微軟轉型成以雲端為主的公司，是 AI 浪潮中最大的贏家之一。"],
 v:"讓每個人和每家公司都能用 AI 提升生產力。",
 s:["Azure 雲端提供 AI 運算","把 AI 助理（Copilot）放進 Office、Windows 和 GitHub","開發自己的 AI 晶片，降低對輝達的依賴"],
 w:["AI 資料中心投資金額非常大，市場擔心回收速度","11 月股價跌幅明顯，市場對 AI 支出變得比較謹慎"]},
GOOGL:{ceo:["Sundar Pichai","2015 年起擔任 Google 執行長，後來也兼任母公司 Alphabet 執行長。"],
 v:"整理全世界的資訊，讓 AI 成為所有產品的核心。",
 s:["Gemini AI 模型整合到搜尋、Android、YouTube","Google 雲端和自家 TPU AI 晶片","自動駕駛 Waymo 等長期投資"],
 w:["AI 聊天機器人可能取代傳統搜尋廣告","美國和歐洲的反壟斷官司"]},
AMZN:{ceo:["Andy Jassy","AWS 雲端的創辦主管，2021 年接替創辦人貝佐斯（Jeff Bezos）成為執行長。"],
 v:"做「地球上最以顧客為中心的公司」，同時用雲端支撐全世界的 AI。",
 s:["AWS 雲端和自家 AI 晶片（Trainium）","電商物流自動化、降低成本","廣告業務快速成長"],
 w:["AI 資料中心支出很大","電商利潤率比較低，受景氣影響"]},
META:{ceo:["Mark Zuckerberg（創辦人）","19 歲在大學宿舍創立 Facebook，持有多數投票權，對公司方向有很大的決定權。"],
 v:"用 AI 和新的裝置（智慧眼鏡、VR）連結人與人。",
 s:["用 AI 讓廣告更精準，是最主要的獲利來源","投入數千億美元建 AI 資料中心","發展 AI 智慧眼鏡"],
 w:["AI 和元宇宙花費非常大","青少年使用安全和隱私的法規壓力","基礎設施主管將在 2027 年初離開"]},
TSLA:{ceo:["Elon Musk（伊隆・馬斯克）","同時經營 SpaceX、xAI 等多家公司，個人言論和政治活動常影響特斯拉股價。"],
 v:"加速世界轉向永續能源，並用 AI 做自動駕駛和人形機器人。",
 s:["電動車和家用、電廠儲能電池","全自動駕駛和無人計程車","人形機器人 Optimus"],
 w:["電動車競爭激烈、價格戰","股價很依賴對未來的想像，波動非常大","執行長同時管理很多公司"]},
AMD:{ceo:["Lisa Su（蘇姿丰）","2014 年接任執行長，把瀕臨困境的 AMD 帶回 CPU 和 GPU 的第一線。"],
 v:"做高效能運算的領導者，在 AI 晶片上成為輝達以外的主要選擇。",
 s:["Instinct AI 晶片和整櫃式伺服器","伺服器和電腦 CPU 持續搶市占","開放的軟體生態，吸引不想只靠輝達的客戶"],
 w:["產能能不能跟上突然增加的訂單","軟體生態還是比輝達小"]},
AVGO:{ceo:["Hock Tan（陳福陽）","2006 年起擔任執行長，以大型併購和嚴格控管成本出名。"],
 v:"做大型科技公司背後不可或缺的晶片和企業軟體供應商。",
 s:["幫 Google 等大客戶設計客製化 AI 晶片","資料中心網路晶片","併購 VMware 後的企業軟體訂閱"],
 w:["營收集中在少數大客戶","大型併購帶來的債務"]},
"BRK-B":{ceo:["Greg Abel","2026 年接替巴菲特（Warren Buffett）擔任執行長，之前負責波克夏的能源等非保險事業。"],
 v:"長期持有好公司，用保險業務的資金做投資。",
 s:["保險、鐵路、能源等事業","持有蘋果等大型股票","保留大量現金，等待好的投資機會"],
 w:["巴菲特交棒後，新團隊的投資眼光還需要時間證明"]},
KO:{ceo:["Henrique Braun","原本是營運長，2026 年 11 月接任執行長。"],
 v:"做全世界最受歡迎的飲料品牌組合。",s:["品牌行銷和全球通路","推出低糖、零糖產品"],w:["健康意識提高，含糖飲料需求下降"]},
"2330":{ceo:["魏哲家（董事長暨總裁）","台積電的董事長和總裁，連續多年被天下雜誌評為標竿企業家第一名，也入選時代雜誌百大影響力人物。"],
 v:"做全世界值得信賴的晶圓代工夥伴，不和客戶競爭，只專心把晶片做好。",
 s:["持續領先最先進的製程（2 奈米以下）","先進封裝（CoWoS 等）支援 AI 晶片","在美國、日本、德國設廠，分散地緣政治風險"],
 w:["美國出口管制和兩岸地緣政治","海外工廠成本比較高","客戶集中在少數 AI 和手機大廠"]},
"2317":{ceo:["劉揚偉（董事長）","鴻海董事長，推動公司從手機組裝轉型到 AI 伺服器、電動車和半導體；公司重大決策由經營委員會共同討論。"],
 v:"從「代工」走向「平台」：電動車、數位健康、機器人三大產業，加上 AI、半導體、通訊三大技術。",
 s:["AI 伺服器（輝達 GB 系列整櫃）是最大成長動能","電動車平台 MIH 和代工","在美國、墨西哥擴廠"],
 w:["代工毛利率低","太依賴蘋果和輝達等大客戶","輝達領導層變動的影響"]},
"2454":{ceo:["蔡明介（董事長）、蔡力行（執行長）","蔡明介是創辦人和董事長，蔡力行負責日常經營，曾任台積電執行長。"],
 v:"從手機晶片擴大到 AI 時代的各種運算晶片。",
 s:["高階手機晶片天璣系列","客製化 AI 晶片（ASIC）是第二成長動能","車用、網通、電視晶片"],
 w:["手機市場成長放緩","和高通等對手的價格競爭"]},
"2308":{ceo:["鄭平（董事長）","創辦人鄭崇華的兒子，從基層做起，擔任執行長多年後 2024 年接任董事長，帶領台達電從變壓器工廠轉型成 AI 電力大廠。"],
 v:"做 AI 時代的電力和散熱解決方案，並推動節能減碳。",
 s:["AI 伺服器電源和高壓直流（HVDC）電源櫃","資料中心液冷散熱","電動車零件和工業自動化"],
 w:["股價已經漲很多，期望很高","AI 投資若放緩會受影響"]}
};
window.LEADERS.TSM=window.LEADERS["2330"];
/* 畫出「公司遠見、策略和執行長」區塊：
   台股＝官方董事長／總經理＋（熱門股專屬內容 或 產業共通重點 或 ETF 說明）；美股＝逐檔整理（執行長資料查證於 2026/11/20） */
window.TWINFO=null;window.USCEO=null;
(function(){
  const rr=()=>{document.querySelectorAll("[data-lead]").forEach(el=>{const h=window.leadersHTML(el.dataset.lead,true);if(h)el.innerHTML=h})};
  setTimeout(()=>{fetch("tw-info.json",{cache:"no-store"}).then(r=>r.json()).then(j=>{window.TWINFO=j;rr()}).catch(()=>{});},1500);
})();
window.leadersHTML=function(code,inner){
  const EN=window.EN,e=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const isTW=/^\d/.test(code),I=isTW&&window.TWINFO?window.TWINFO[code]:null;
  let L=(window.LEADERS||{})[code],kind="own";
  const stock=(window.D&&D.stocks||[]).find(x=>x[0]===code),nm=stock?stock[1]:"";
  if(!L&&isTW&&/^00/.test(code)&&window.etfNote){L=etfNote(code,nm);kind="etf"}
  if(!L&&isTW&&I&&window.IND_NOTE&&IND_NOTE[I.i]){const n=IND_NOTE[I.i];L={v:"",s:n[0],w:n[1]};kind="ind"}
  if(!L&&!(isTW&&I))return "";
  let who="";
  if(isTW&&I&&(I.c||I.g)){who=`<div class="ldceo"><span class="ic">👤</span><div><b>${I.c?(EN?"Chair ":"董事長 ")+e(I.c):""}${I.c&&I.g?"　":""}${I.g?(EN?"President ":"總經理 ")+e(I.g):""}</b><p>${EN?"From the official TWSE/TPEx company register, updated daily.":"來自證交所／櫃買中心的官方公司資料，每天自動更新。"}${L&&L.ceo?"<br>"+e(L.ceo[1]):""}</p></div></div>`}
  else if(isTW&&kind==="etf"){who=`<div class="ldceo"><span class="ic">🧺</span><div><b>${EN?"ETF (no CEO)":"ETF（不是公司，沒有執行長）"}</b><p>${EN?"Managed by an asset manager following index rules.":"由投信公司照指數規則管理，買它等於一次買一籃子股票。"}</p></div></div>`}
  else if(L&&L.ceo){who=`<div class="ldceo"><span class="ic">👤</span><div><b>${e(L.ceo[0])}</b><p>${e(L.ceo[1])}</p></div></div>`}
  const tag=kind==="ind"?`<p class="ldtag">🏭 ${EN?`Industry-wide notes (${e(I.i)}), not specific to this company`:`以下是「${e(I.i)}」產業共通的重點，不是這家公司專屬的分析`}</p>`:kind==="etf"?`<p class="ldtag">🧺 ${EN?"How this ETF works":"這檔 ETF 的投資方式"}</p>`:"";
  const body=`${who}${tag}
    ${L&&L.v?`<div class="ldrow"><span class="ic">🔭</span><div><b>${EN?"Vision":"遠見"}</b><p>${e(L.v)}</p></div></div>`:""}
    ${L&&L.s&&L.s.length?`<div class="ldrow"><span class="ic">♟️</span><div><b>${kind==="ind"?(EN?"Common strategies":"產業常見策略"):(EN?"Strategy":"策略重點")}</b><ul>${L.s.map(x=>`<li>${e(x)}</li>`).join("")}</ul></div></div>`:""}
    ${L&&L.w&&L.w.length?`<div class="ldrow"><span class="ic">⚠️</span><div><b>${kind==="ind"?(EN?"Common risks":"產業常見風險"):(EN?"Watch out for":"要注意")}</b><ul>${L.w.map(x=>`<li>${e(x)}</li>`).join("")}</ul></div></div>`:""}
    <p class="sub" style="margin:2px 0 0">${kind==="own"?(EN?"Compiled ":"資料整理於 ")+window.LEADERS_ASOF+(EN?"; leadership can change.":"，人事可能變動，以公司公告為準。"):(kind==="etf"?(EN?"General explanation based on the ETF's name.":"依照 ETF 名稱整理的一般性說明，詳細請看投信公開說明書。"):(EN?"Leaders come from official data; notes are general.":"領導人來自官方資料；說明為一般性整理。"))}</p>`;
  if(inner)return body;
  return `<h3 class="ush">🧭 ${EN?"Vision, strategy & leadership":"公司遠見、策略和執行長"}</h3><div class="ldr2" data-lead="${e(code)}">${body}</div>`;
};
