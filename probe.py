import urllib.request,json
UA={"User-Agent":"Mozilla/5.0","Origin":"https://archie-66.github.io"}
for u in ["https://ws.api.cnyes.com/ws/api/v1/quote/quotes/TWS:2330:STOCK,TWS:6488:STOCK,USS:NVDA:STOCK,TWS:TSE01:INDEX?column=K,E,KEY,M,AI",
          "https://ws.api.cnyes.com/ws/api/v1/quote/quotes/TWS:2330:STOCK"]:
    with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=15) as r:
        J=json.loads(r.read())
    for d in J["data"]:print(json.dumps(d,ensure_ascii=False)[:1500]);print()
u="https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_2330.tw&json=1&delay=0"
with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=15) as r:print(r.read().decode()[-700:])
