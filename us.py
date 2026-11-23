"""
美股資料：熱門美股、ETF 和三大指數最近 60 個交易日的收盤價與成交量，寫成 us.json。
格式跟 hist.json 一樣（dates＋每檔陣列），預測頁可以直接拿來分析。
資料來源：Yahoo Finance 圖表資料；抓不到時改用 Stooq。只用 Python 內建模組。
"""
import csv, io, json, sys, time, urllib.request, urllib.parse, re
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone, timedelta

TW = timezone(timedelta(hours=8))
UA = {"User-Agent": "Mozilla/5.0 (stock-custom-app)"}
KEEP = 60
META = {}

INDEX = {"SPX": ("^GSPC", "^spx", "S&P 500"), "NDX": ("^IXIC", "^ndq", "那斯達克"), "DJI": ("^DJI", "^dji", "道瓊"), "SOX": ("^SOX", "^sox", "費城半導體")}
TICKERS = """ANT SPCX AAPL MSFT NVDA GOOGL AMZN META TSLA AVGO AMD TSM ASML INTC QCOM MU ARM SMCI ORCL CRM ADBE NFLX PLTR SNOW UBER ABNB SHOP
COIN PYPL V MA JPM BAC GS MS BRK-B WMT COST KO PEP MCD NKE DIS SBUX JNJ PFE LLY UNH MRK ABBV XOM CVX BA CAT GE F GM RIVN NIO BABA PDD
SONY IBM CSCO TXN AMAT LRCX KLAC MRVL DELL SPOT RBLX NET CRWD PANW DDOG ANET VRT CEG OKLO IONQ RGTI SOFI HOOD MSTR DUOL
SPY QQQ VOO VTI SOXX SMH ARKK TLT GLD""".split()
CORE = set(TICKERS)  # 這些有中文名稱、專屬介紹，新聞也會找中文的

# 其他想看的熱門股：那斯達克 100（不在 S&P 500 的）、外國公司 ADR、熱門成長股、ETF。打錯或下市的代號會自動略過。
EXTRA = """ASML ARM PDD MELI AZN TEAM ZS MDB CCEP GFS TTD WDAY SHOP DASH TRI MSTR APP CDNS SNPS FTNT ADSK MNST ODFL ROP PAYX CTAS KDP
BIDU JD LI XPEV NIO BILI TME NTES YUMC BEKE ZTO TCOM FUTU TIGR TM HMC NVO SAP SHEL BP UL RIO BHP VALE HSBC MUFG SMFG INFY WIT HDB IBN
SE GRAB CPNG NU STNE UMC ASX TSM SONY NVS GSK SNY DEO BUD BTI TTE EQNR E ENB SU CNQ CP CNI RY TD BMO BNS SHOP SPOT ABBNY
GME AMC PLUG RKLB ASTS LUNR ACHR JOBY SOUN BBAI AI PATH U DKNG AFRM UPST SNAP PINS LYFT RDDT CAVA CELH HIMS CHWY ROKU ZM DOCU TWLO
OKTA HUBS BILL CFLT GTLB S ESTC IOT ALAB CRDO COHR LITE NBIS CRWV CORZ IREN CIFR MARA RIOT CLSK HUT WULF QBTS QUBT SMR NNE LEU CCJ
UEC TLN VST NRG LCID CHPT BYND PTON CVNA OPEN W ETSY EBAY TOST XYZ CRCL FIG CHYM KLAR GLXY BMNR SBET RGTI IONQ OKLO TEM RXRX
ONON BIRK DECK LULU ELF CROX SHAK WING DPZ CMG TXRH ABNB EXPE BKNG MAR HLT RCL CCL NCLH DAL UAL AAL LUV JBLU
DIA IWM VUG VTV SCHD JEPI JEPQ VGT XLK XLF XLE XLV XLY XLP XLI XLU XLB XLRE XLC SOXL SOXS TQQQ SQQQ NVDL TSLL IBIT ETHA FBTC GBTC
SLV USO UNG IEF SHY BND AGG HYG LQD EEM EFA VEA VWO EWJ EWT EWY FXI KWEB INDA VNQ VYM VIG QQQM SPLG RSP MTUM ITA URA TAN ICLN LIT
BOTZ CIBR HACK IGV XBI IBB KRE GDX GDXJ COPX SPYG SPYD SCHG VT IVV""".split()

SEC_ZH = {"Information Technology": "科技", "Health Care": "醫療保健", "Financials": "金融", "Consumer Discretionary": "非必需消費",
          "Communication Services": "通訊服務", "Industrials": "工業", "Consumer Staples": "民生必需", "Energy": "能源",
          "Utilities": "公用事業", "Real Estate": "房地產", "Materials": "原物料"}
SECTOR = {}


def sp500():
    """S&P 500 成分股（每次執行都抓最新名單，成分股有換也會跟著換）"""
    t = fetch("https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv", tries=2)
    out = []
    try:
        for row in csv.DictReader(io.StringIO(t)):
            tk = row["Symbol"].strip().replace(".", "-")
            out.append(tk); SECTOR[tk] = SEC_ZH.get(row.get("GICS Sector", ""), row.get("GICS Sector", ""))
    except Exception as e:
        print("S&P 500 名單抓不到", e)
    print("S&P 500：", len(out), "檔")
    return out


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
    t = fetch(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=2y&interval=1d")
    try:
        r = json.loads(t)["chart"]["result"][0]
        ts, q = r.get("timestamp") or [], r["indicators"]["quote"][0]
        mt = r["meta"]
        name = mt.get("shortName") or mt.get("longName") or sym
        META[sym] = {"ln": mt.get("longName") or name, "hi": mt.get("fiftyTwoWeekHigh"), "lo": mt.get("fiftyTwoWeekLow"), "ex": mt.get("fullExchangeName") or mt.get("exchangeName"), "ty": mt.get("instrumentType")}
        rows = []
        for i, s in enumerate(ts):
            c = q["close"][i]
            if c is None:
                continue
            d = datetime.fromtimestamp(s, timezone(timedelta(hours=-5))).strftime("%Y-%m-%d")
            g = lambda kk: (round(q[kk][i], 2) if q.get(kk) and q[kk][i] is not None else None)
            rows.append((d, round(c, 2), int(q["volume"][i] or 0), g("open"), g("high"), g("low")))
        # 剛上市的股票，日線有時還沒有資料：改用「最新成交價」補當天
        if not rows and mt.get("regularMarketPrice") and mt.get("regularMarketTime"):
            d = datetime.fromtimestamp(mt["regularMarketTime"], timezone(timedelta(hours=-5))).strftime("%Y-%m-%d")
            rows.append((d, round(mt["regularMarketPrice"], 2), int(mt.get("regularMarketVolume") or 0), None, mt.get("regularMarketDayHigh"), mt.get("regularMarketDayLow")))
        return name, rows
    except Exception:
        return None, []


def yahoo_short(sym):
    """新股用：只抓最近 5 天，比較容易有資料"""
    t = fetch(f"https://query2.finance.yahoo.com/v8/finance/chart/{sym}?range=5d&interval=1d")
    try:
        r = json.loads(t)["chart"]["result"][0]; mt = r["meta"]
        ts, q = r.get("timestamp") or [], r["indicators"]["quote"][0]
        rows = [(datetime.fromtimestamp(s, timezone(timedelta(hours=-5))).strftime("%Y-%m-%d"), round(q["close"][i], 2), int(q["volume"][i] or 0), (round(q["open"][i], 2) if q.get("open") and q["open"][i] is not None else None), (round(q["high"][i], 2) if q.get("high") and q["high"][i] is not None else None), (round(q["low"][i], 2) if q.get("low") and q["low"][i] is not None else None))
                for i, s in enumerate(ts) if q["close"][i] is not None]
        if not rows and mt.get("regularMarketPrice") and mt.get("regularMarketTime"):
            rows = [(datetime.fromtimestamp(mt["regularMarketTime"], timezone(timedelta(hours=-5))).strftime("%Y-%m-%d"), round(mt["regularMarketPrice"], 2), int(mt.get("regularMarketVolume") or 0), None, mt.get("regularMarketDayHigh"), mt.get("regularMarketDayLow"))]
        META.setdefault(sym, {"ln": mt.get("longName") or sym, "hi": mt.get("fiftyTwoWeekHigh"), "lo": mt.get("fiftyTwoWeekLow"), "ex": mt.get("fullExchangeName")})
        return mt.get("shortName") or mt.get("longName"), rows
    except Exception:
        return None, []


def stooq(sym):
    t = fetch(f"https://stooq.com/q/d/l/?s={sym}&i=d")
    rows = []
    try:
        for x in csv.DictReader(io.StringIO(t or "")):
            if x.get("Close") not in (None, "", "N/D"):
                f2 = lambda kk: (round(float(x[kk]), 2) if x.get(kk) not in (None, "", "N/D") else None)
                rows.append((x["Date"], round(float(x["Close"]), 2), int(float(x.get("Volume") or 0)), f2("Open"), f2("High"), f2("Low")))
    except Exception:
        pass
    return rows[-130:]


def get(ysym, ssym):
    name, rows = yahoo(ysym)
    if not rows:
        name2, rows = yahoo_short(ysym)
        name = name or name2
    if not rows:
        rows = stooq(ssym)
    return name, rows


ZH_Q = {"ANT": "Anthropic", "SPCX": "SpaceX", "AAPL": "蘋果 Apple", "MSFT": "微軟", "NVDA": "輝達", "GOOGL": "Google Alphabet", "AMZN": "亞馬遜", "META": "Meta 臉書",
        "TSLA": "特斯拉", "AVGO": "博通", "AMD": "超微 AMD", "TSM": "台積電 ADR", "ASML": "艾司摩爾", "INTC": "英特爾", "QCOM": "高通", "MU": "美光", "ARM": "安謀 Arm",
        "SMCI": "美超微", "ORCL": "甲骨文", "NFLX": "Netflix", "PLTR": "Palantir", "BRK-B": "波克夏", "WMT": "沃爾瑪", "COST": "好市多", "KO": "可口可樂", "MCD": "麥當勞",
        "DIS": "迪士尼", "SBUX": "星巴克", "PFE": "輝瑞", "LLY": "禮來", "XOM": "艾克森美孚", "BA": "波音", "F": "福特汽車", "GM": "通用汽車", "BABA": "阿里巴巴", "PDD": "拼多多",
        "SONY": "索尼", "CSCO": "思科", "TXN": "德州儀器", "AMAT": "應用材料", "DELL": "戴爾", "JPM": "摩根大通", "GS": "高盛", "V": "Visa", "MA": "萬事達卡", "NKE": "Nike"}


BULK = {}


def bulk_news():
    """鉅亨網美股新聞：一次抓很多，再依中文名稱或代號分到各檔"""
    now = datetime.now(timezone.utc); end = int(now.timestamp()); start = end - 3 * 86400
    for page in range(1, 6):
        t = fetch(f"https://api.cnyes.com/media/api/v1/newslist/category/wd_stock?startAt={start}&endAt={end}&limit=30&page={page}", tries=1)
        try:
            items = json.loads(t)["items"]["data"]
        except Exception:
            break
        for it in items:
            title = (it.get("title") or "").strip()
            try:
                dt = datetime.fromtimestamp(int(it.get("publishAt")), timezone.utc)
            except Exception:
                dt = None
            link = f"https://news.cnyes.com/news/id/{it.get('newsId')}"
            for tk, zh in ZH_Q.items():
                names = [w for w in zh.split() if len(w) >= 2]
                if any(w in title for w in names) or re.search(r"[\(（]" + re.escape(tk) + r"[\)）\.-]", title):
                    BULK.setdefault(tk, []).append((title, "鉅亨網", link, dt))
        time.sleep(1)
    print("鉅亨美股新聞分到", len(BULK), "檔")


def news(tk, days=3, quick=False):
    """近 3 天新聞：先找中文（Google 新聞台灣版），不夠再補英文（Yahoo Finance）。只存標題、來源、時間和連結。"""
    out, seen = [], set()
    now = datetime.now(timezone.utc)

    def add(title, src, link, dt):
        key = re.sub(r"\W", "", title.lower())[:40]
        if not title or key in seen or (dt and (now - dt).days >= days):
            return
        seen.add(key); out.append({"t": title[:120], "s": (src or "")[:30], "u": link, "d": dt.strftime("%Y-%m-%dT%H:%MZ") if dt else ""})

    def rss(url, zh):
        t = fetch(url, tries=1)
        if not t:
            return
        try:
            root = ET.fromstring(t)
        except Exception:
            return
        for it in root.iter("item"):
            title = (it.findtext("title") or "").strip(); link = (it.findtext("link") or "").strip()
            src = (it.findtext("source") or "").strip()
            if zh and " - " in title:
                title, src2 = title.rsplit(" - ", 1); src = src or src2
            try:
                dt = parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone.utc)
            except Exception:
                dt = None
            add(title.strip(), src or ("Yahoo Finance" if not zh else ""), link, dt)

    for x in BULK.get(tk, []):
        add(*x)
    if quick:  # 不是常看的那 100 檔：只抓英文 Yahoo Finance，比較快
        time.sleep(.4)
        rss(f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={tk}&region=US&lang=en-US", False)
        out.sort(key=lambda x: x["d"], reverse=True)
        return out[:6]
    if len(out) >= 4:
        out.sort(key=lambda x: x["d"], reverse=True); return out[:6]
    time.sleep(1.8)
    q = (ZH_Q.get(tk) or tk) + " 股價"
    rss("https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + " when:3d", "hl": "zh-TW", "gl": "TW", "ceid": "TW:zh-Hant"}), True)
    if not out:  # 再用比較寬的關鍵字找一次
        time.sleep(1.8)
        rss("https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": (ZH_Q.get(tk) or tk) + " when:3d", "hl": "zh-TW", "gl": "TW", "ceid": "TW:zh-Hant"}), True)
    if len(out) < 4:
        rss(f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={tk}&region=US&lang=en-US", False)
    out.sort(key=lambda x: x["d"], reverse=True)
    return out[:6]


def main():
    data, names = {}, {}
    for key, (y, s, n) in INDEX.items():
        nm, rows = get(y, s); time.sleep(.6)
        print(key, len(rows))
        if rows:
            data["^" + key] = rows; names["^" + key] = n
    ALL = list(dict.fromkeys(TICKERS + sp500() + EXTRA))
    print("要抓", len(ALL), "檔")
    for tk in ALL:
        nm, rows = get(tk, tk.lower() + ".us"); time.sleep(.5)
        print(tk, len(rows), nm)
        if rows:
            data[tk] = rows; names[tk] = nm or tk
    if "^SPX" not in data and not data:
        print("沒有抓到任何美股資料"); return 1
    base = data.get("^SPX") or max(data.values(), key=len)
    dates = sorted({r[0] for rows in data.values() for r in rows[-KEEP - 5:]})[-KEEP:]
    out = {"dates": dates, "updatedAt": datetime.now(TW).strftime("%Y-%m-%d %H:%M"), "idx": {}, "s": {}}
    for k, rows in data.items():
        m = {r[0]: r[1:] for r in rows}
        E = (None, None, None, None, None)
        cs = [m.get(d, E)[0] for d in dates]
        vs = [m.get(d, E)[1] for d in dates]
        os_ = [(m.get(d, E) + E)[2] for d in dates]
        hs = [(m.get(d, E) + E)[3] for d in dates]
        ls = [(m.get(d, E) + E)[4] for d in dates]
        if all(c is None for c in cs):
            continue
        if k.startswith("^"):
            out["idx"][k[1:]] = [names[k], cs]
        else:
            out["s"][k] = [names[k], "us", cs, vs, None, os_, hs, ls]
    for k, sec in SECTOR.items():
        if k in META and sec:
            META[k]["sec"] = sec
    out["meta"] = {k: v for k, v in META.items() if k in out["s"]}
    json.dump(out, open("us.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    # 用 2 年的資料訓練預測模型（只存結果 pred-us.json，2 年的資料不放網站）
    try:
        import model
        alld = sorted({r[0] for k, rows in data.items() if not k.startswith("^") for r in rows})
        full = {"dates": alld, "s": {}, "etf": [k for k, v in META.items() if v.get("ty") in ("ETF", "MUTUALFUND", "INDEX")]}
        for k, rows in data.items():
            if k.startswith("^"):
                continue
            m = {r[0]: r[1:] for r in rows}; E = (None,) * 5
            g = lambda j: [(m.get(d, E) + E)[j] for d in alld]
            full["s"][k] = [names[k], "us", g(0), g(1), None, g(2), g(3), g(4)]
        model.run(full, "us")
    except Exception as e:
        print("模型訓練失敗", e)
    bulk_news()
    nw = {"updatedAt": out["updatedAt"], "n": {}}
    for tk in out["s"]:
        try:
            nw["n"][tk] = news(tk, quick=tk not in CORE)
        except Exception as e:
            print("news fail", tk, e)
    json.dump(nw, open("us-news.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("新聞：", sum(len(v) for v in nw["n"].values()), "則")
    print("美股：", len(out["s"]), "檔，", len(out["idx"]), "個指數，", len(dates), "天")
    return 0


if __name__ == "__main__":
    sys.exit(main())
