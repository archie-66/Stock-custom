"""
美股資料：熱門美股、ETF 和三大指數最近 60 個交易日的收盤價與成交量，寫成 us.json。
格式跟 hist.json 一樣（dates＋每檔陣列），預測頁可以直接拿來分析。
資料來源：Yahoo Finance 圖表資料；抓不到時改用 Stooq。只用 Python 內建模組。
"""
import csv, io, json, sys, time, urllib.request
from datetime import datetime, timezone, timedelta

TW = timezone(timedelta(hours=8))
UA = {"User-Agent": "Mozilla/5.0 (stock-custom-app)"}
KEEP = 60

INDEX = {"SPX": ("^GSPC", "^spx", "S&P 500"), "NDX": ("^IXIC", "^ndq", "那斯達克"), "DJI": ("^DJI", "^dji", "道瓊"), "SOX": ("^SOX", "^sox", "費城半導體")}
TICKERS = """ANT SPCX AAPL MSFT NVDA GOOGL AMZN META TSLA AVGO AMD TSM ASML INTC QCOM MU ARM SMCI ORCL CRM ADBE NFLX PLTR SNOW UBER ABNB SHOP
COIN PYPL V MA JPM BAC GS MS BRK-B WMT COST KO PEP MCD NKE DIS SBUX JNJ PFE LLY UNH MRK ABBV XOM CVX BA CAT GE F GM RIVN NIO BABA PDD
SONY IBM CSCO TXN AMAT LRCX KLAC MRVL DELL SPOT RBLX NET CRWD PANW DDOG ANET VRT CEG OKLO IONQ RGTI SOFI HOOD MSTR DUOL
SPY QQQ VOO VTI SOXX SMH ARKK TLT GLD""".split()


def fetch(url, tries=2):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            print("retry", i + 1, url, e)
            time.sleep(2 + 3 * i)
    return None


def yahoo(sym):
    t = fetch(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=6mo&interval=1d")
    try:
        r = json.loads(t)["chart"]["result"][0]
        ts, q = r.get("timestamp") or [], r["indicators"]["quote"][0]
        name = r["meta"].get("shortName") or r["meta"].get("longName") or sym
        rows = []
        for i, s in enumerate(ts):
            c = q["close"][i]
            if c is None:
                continue
            d = datetime.fromtimestamp(s, timezone(timedelta(hours=-5))).strftime("%Y-%m-%d")
            rows.append((d, round(c, 2), int(q["volume"][i] or 0)))
        return name, rows
    except Exception:
        return None, []


def stooq(sym):
    t = fetch(f"https://stooq.com/q/d/l/?s={sym}&i=d")
    rows = []
    try:
        for x in csv.DictReader(io.StringIO(t or "")):
            if x.get("Close") not in (None, "", "N/D"):
                rows.append((x["Date"], round(float(x["Close"]), 2), int(float(x.get("Volume") or 0))))
    except Exception:
        pass
    return rows[-130:]


def get(ysym, ssym):
    name, rows = yahoo(ysym)
    if len(rows) < 2:
        rows = stooq(ssym)
    return name, rows


def main():
    data, names = {}, {}
    for key, (y, s, n) in INDEX.items():
        nm, rows = get(y, s); time.sleep(.6)
        print(key, len(rows))
        if rows:
            data["^" + key] = rows; names["^" + key] = n
    for tk in TICKERS:
        nm, rows = get(tk, tk.lower() + ".us"); time.sleep(.6)
        print(tk, len(rows), nm)
        if rows:
            data[tk] = rows; names[tk] = nm or tk
    if "^SPX" not in data and not data:
        print("沒有抓到任何美股資料"); return 1
    base = data.get("^SPX") or max(data.values(), key=len)
    dates = sorted({r[0] for rows in data.values() for r in rows[-KEEP - 5:]})[-KEEP:]
    out = {"dates": dates, "updatedAt": datetime.now(TW).strftime("%Y-%m-%d %H:%M"), "idx": {}, "s": {}}
    for k, rows in data.items():
        m = {d: (c, v) for d, c, v in rows}
        cs = [m.get(d, (None, None))[0] for d in dates]
        vs = [m.get(d, (None, None))[1] for d in dates]
        if all(c is None for c in cs):
            continue
        if k.startswith("^"):
            out["idx"][k[1:]] = [names[k], cs]
        else:
            out["s"][k] = [names[k], "us", cs, vs, None]
    json.dump(out, open("us.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("美股：", len(out["s"]), "檔，", len(out["idx"]), "個指數，", len(dates), "天")
    return 0


if __name__ == "__main__":
    sys.exit(main())
