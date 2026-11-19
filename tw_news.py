"""
台股個股的「公司基本資料」和「近三天新聞標題」，寫成 tw-info.json 和 tw-news.json。
- 基本資料：證交所、櫃買中心的公開資料（產業別、成立和上市日期、董事長、資本額、網址）。
- 新聞：先一次抓鉅亨網最新的台股新聞，再按照股票名稱和代號分到各檔；
        熱門股不夠的話，再用 Google 新聞（台灣版）補，慢慢抓避免被擋。
只存標題、來源、時間和連結，不存新聞內容。
"""
import json, re, sys, time, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

TW = timezone(timedelta(hours=8))
UA = {"User-Agent": "Mozilla/5.0 (stock-custom-app)"}
IND = {"01": "水泥", "02": "食品", "03": "塑膠", "04": "紡織纖維", "05": "電機機械", "06": "電器電纜", "08": "玻璃陶瓷", "09": "造紙", "10": "鋼鐵",
       "11": "橡膠", "12": "汽車", "14": "建材營造", "15": "航運", "16": "觀光餐旅", "17": "金融保險", "18": "貿易百貨", "19": "綜合", "20": "其他",
       "21": "化學", "22": "生技醫療", "23": "油電燃氣", "24": "半導體", "25": "電腦及週邊", "26": "光電", "27": "通信網路", "28": "電子零組件",
       "29": "電子通路", "30": "資訊服務", "31": "其他電子", "32": "文化創意", "33": "農業科技", "34": "電子商務", "35": "綠能環保", "36": "數位雲端",
       "37": "運動休閒", "38": "居家生活", "80": "管理股票", "91": "存託憑證"}


def fetch(url, tries=2, wait=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            print("retry", i + 1, url[:90], e)
            time.sleep(wait * (i + 1) * (4 if "429" in str(e) else 1))
    return None


def pick(d, *keys):
    for k in keys:
        if k in d and str(d[k]).strip():
            return str(d[k]).strip()
    return ""


def company_info():
    info = {}
    for url, mk in (("https://openapi.twse.com.tw/v1/opendata/t187ap03_L", ""),
                    ("https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O", "o")):
        try:
            rows = json.loads(fetch(url) or "[]")
        except Exception:
            rows = []
        for r in rows:
            code = pick(r, "公司代號", "SecuritiesCompanyCode")
            if not code:
                continue
            ind = pick(r, "產業別", "SecuritiesIndustryCode").zfill(2)
            info[code] = {"m": mk, "i": IND.get(ind, ""), "f": pick(r, "成立日期", "DateOfIncorporation")[:4],
                          "l": pick(r, "上市日期", "上櫃日期", "DateOfListing")[:4], "c": pick(r, "董事長", "Chairman"),
                          "cap": pick(r, "實收資本額", "Paidin.Capital.NTDollars", "PaidInCapital"), "w": pick(r, "網址", "WebAddress"),
                          "fn": pick(r, "公司名稱", "CompanyName")}
        print(url[:40], len(rows))
    return info


def roc_year(y):
    """民國年 → 西元年"""
    try:
        y = int(y)
        return str(y + 1911) if y < 1000 else str(y)
    except Exception:
        return ""


def main():
    now = datetime.now(timezone.utc)
    try:
        D = json.load(open("data.json", encoding="utf-8"))
        stocks = D.get("stocks", [])
    except Exception:
        stocks = []
    names = {s[0]: s[1] for s in stocks}
    top = [s[0] for s in sorted(stocks, key=lambda s: -(s[2] or 0))[:150]]

    info = company_info()
    for v in info.values():
        v["f"], v["l"] = roc_year(v["f"]), roc_year(v["l"])
    if info:
        json.dump(info, open("tw-info.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    news = {}

    def add(code, title, src, link, dt):
        if not title or (dt and (now - dt).days >= 3):
            return
        L = news.setdefault(code, [])
        key = re.sub(r"\W", "", title)[:30]
        if any(re.sub(r"\W", "", x["t"])[:30] == key for x in L):
            return
        L.append({"t": title[:120], "s": src[:30], "u": link, "d": dt.strftime("%Y-%m-%dT%H:%MZ") if dt else ""})

    # 1) 鉅亨網：一次抓很多台股新聞，再依名稱、代號分配
    name_re = [(c, n) for c, n in names.items() if len(n) >= 2 and not n.endswith(("-KY",)) and c.isdigit() and len(c) == 4]
    end = int(now.timestamp()); start = end - 3 * 86400
    got = 0
    for cat in ("tw_stock", "tw_quo"):
        for page in range(1, 6):
            t = fetch(f"https://api.cnyes.com/media/api/v1/newslist/category/{cat}?startAt={start}&endAt={end}&limit=30&page={page}", tries=1)
            try:
                items = json.loads(t)["items"]["data"]
            except Exception:
                break
            for it in items:
                title = (it.get("title") or "").strip()
                link = f"https://news.cnyes.com/news/id/{it.get('newsId')}"
                try:
                    dt = datetime.fromtimestamp(int(it.get("publishAt")), timezone.utc)
                except Exception:
                    dt = None
                hit = set()
                for m in it.get("market") or []:
                    c = str(m.get("code") or m.get("symbol") or "").split(":")[-1]
                    if c in names:
                        hit.add(c)
                for c, n in name_re:
                    if n in title or f"({c})" in title or f"（{c}）" in title:
                        hit.add(c)
                for c in list(hit)[:6]:
                    add(c, title, "鉅亨網", link, dt)
                got += 1
            time.sleep(1)
    print("鉅亨新聞", got, "則，分到", len(news), "檔")

    # 2) Google 新聞補熱門股（慢慢抓）
    for code in top:
        if len(news.get(code, [])) >= 3:
            continue
        q = f"{names.get(code, '')} {code} when:3d"
        t = fetch("https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q, "hl": "zh-TW", "gl": "TW", "ceid": "TW:zh-Hant"}), tries=2, wait=8)
        if t:
            try:
                for it in ET.fromstring(t).iter("item"):
                    title = (it.findtext("title") or "").strip(); src = (it.findtext("source") or "").strip()
                    if " - " in title:
                        title, s2 = title.rsplit(" - ", 1); src = src or s2
                    try:
                        dt = parsedate_to_datetime(it.findtext("pubDate")).astimezone(timezone.utc)
                    except Exception:
                        dt = None
                    add(code, title.strip(), src, (it.findtext("link") or "").strip(), dt)
            except Exception:
                pass
        time.sleep(2.2)

    for c in news:
        news[c] = sorted(news[c], key=lambda x: x["d"], reverse=True)[:6]
    json.dump({"updatedAt": datetime.now(TW).strftime("%Y-%m-%d %H:%M"), "n": news}, open("tw-news.json", "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    print("台股新聞：", len(news), "檔，", sum(len(v) for v in news.values()), "則")
    return 0


if __name__ == "__main__":
    sys.exit(main())
