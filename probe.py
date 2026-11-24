import urllib.request,sys
UA={"User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1","Origin":"https://archie-66.github.io","Referer":"https://archie-66.github.io/"}
U=["https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_2330.tw|otc_6488.tw&json=1&delay=0",
"https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.quote;symbols=2330.TW",
"https://ws.api.cnyes.com/ws/api/v1/quote/quotes/TWS:2330:STOCK",
"https://query1.finance.yahoo.com/v8/finance/chart/2330.TW?range=1d&interval=1m",
"https://query1.finance.yahoo.com/v7/finance/quote?symbols=2330.TW",
"https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL",
"https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?response=json",
"https://raw.githubusercontent.com/archie-66/Stock-custom/main/news.js",
"https://cdn.jsdelivr.net/gh/archie-66/Stock-custom@main/news.js",
"https://api.github.com/repos/archie-66/Stock-custom/contents/news.js",
"https://mopsov.twse.com.tw/mops/api/home_page/t05sr01_1",
"https://api.cnyes.com/media/api/v1/newslist/category/tw_stock?limit=2"]
for u in U:
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=15) as r:
            h=r.headers;print("OK",r.status,u[:80],"| ACAO=",h.get("Access-Control-Allow-Origin"),"| cache=",h.get("Cache-Control"));b=r.read();print("   ",b[:160])
    except Exception as e:print("FAIL",u[:80],e)
    sys.stdout.flush()
