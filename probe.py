import urllib.request,sys
UA={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
U=["https://mopsov.twse.com.tw/nas/t21/sii/t21sc03_114_10_0.html","https://mops.twse.com.tw/nas/t21/sii/t21sc03_114_10_0.html",
"https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMonthRevenue&data_id=2330&start_date=2025-06-01",
"https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMonthRevenue&start_date=2026-10-01&end_date=2026-10-31",
"https://marketinfo.api.cnyes.com/mi/api/v1/financialIndicator/revenue/TWS:2330:STOCK?year=2",
"https://ws.api.cnyes.com/ws/api/v1/charting/history?symbol=TWS:2330:STOCK&resolution=M",
"https://openapi.twse.com.tw/v1/opendata/t187ap05_L",
"https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O",
"https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.revenues;includedFields=all;period=month;symbol=2330.TW"]
for u in U:
    try:
        with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=20) as r:
            b=r.read();print("OK",r.status,len(b),u);print("  ",b[:300])
    except Exception as e:print("FAIL",u,e)
    sys.stdout.flush()
