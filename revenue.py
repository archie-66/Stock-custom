"""台股每月營收（給預測模型用）

公司每個月 10 號前要公布上個月營收。研究發現「營收成長變快」的公司，公布後一段時間股價常比較強，
所以把營收年增率、月增率、成長有沒有加速放進模型，再誠實考試看看有沒有用。

來源：公開資訊觀測站的「月營收彙總表」（上市 sii、上櫃 otc），每個月一頁。
為了不偷看答案：第 M 月的營收，當作第 M+1 月 11 號才知道（大部分公司 10 號前公布）。

輸出 rev-tw.json：{"YYYY-MM": {代號: [營收千元, 月增%, 年增%]}}
用法：python revenue.py          抓最近 3 個月
      MONTHS=20 python revenue.py  補 20 個月
"""
import io
import json
import os
import re
import time
import urllib.request
from datetime import date

FILE = "rev-tw.json"
MONTHS = int(os.environ.get("MONTHS", "3"))
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
HOSTS = ["https://mopsov.twse.com.tw", "https://mops.twse.com.tw"]


def fetch(url):
    for k in range(2):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=15) as r:
                b = r.read()
            for enc in ("big5", "cp950", "utf-8"):
                try:
                    return b.decode(enc)
                except Exception:
                    pass
            return b.decode("utf-8", "ignore")
        except Exception as e:
            last = e
            time.sleep(3)
    print("抓不到", url, last, flush=True)
    return ""


def num(s):
    s = re.sub(r"<[^>]+>", "", s).replace(",", "").replace("&nbsp;", "").strip()
    try:
        return float(s)
    except Exception:
        return None


def month(y, m, kind):
    """回傳 {代號: [營收, 月增%, 年增%]}"""
    roc = y - 1911
    for host in HOSTS:
        for sfx in ("_0.html", ".html"):
            t = fetch(f"{host}/nas/t21/{kind}/t21sc03_{roc}_{m}{sfx}")
            if "公司代號" not in t:
                continue
            print(" ", kind, f"{y}-{m}", len(t), "字", flush=True)
            out = {}
            for row in re.findall(r"<tr[^>]*>(.*?)</tr>", t, re.S):
                tds = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
                if len(tds) < 7:
                    continue
                code = re.sub(r"<[^>]+>", "", tds[0]).strip()
                if not re.fullmatch(r"\d{4,6}[A-Z]?", code):
                    continue
                rev, mom, yoy = num(tds[2]), num(tds[5]), num(tds[6])
                if rev is not None:
                    out[code] = [rev, mom, yoy]
            if out:
                return out
    return {}


def yahoo(code, sfx):
    t = fetch(f"https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.revenues;includedFields=all;period=month;symbol={code}.{sfx}")
    try:
        L = json.loads(t)["data"]["result"]["revenues"]
    except Exception:
        return {}
    out = {}
    for r in L:
        try:
            mo = r["date"][:7]
            f = lambda k: float(r[k]) if r.get(k) not in (None, "") else None
            out[mo] = [round((f("revenue") or 0) / 1000), f("revenueMoM"), f("revenueYoY")]
        except Exception:
            pass
    return out


def stocks():
    for fn in ("train-tw.json", "hist.json"):
        if os.path.exists(fn):
            D = json.load(open(fn, encoding="utf-8"))
            return [(c, "TWO" if e[1] == "o" else "TW") for c, e in D["s"].items() if not c.startswith("0")]
    return []


def main():
    """用 Yahoo 股市一檔一檔抓（公開資訊觀測站有限制下載速度，太慢）；4 條線同時抓"""
    from concurrent.futures import ThreadPoolExecutor
    R = {}
    if os.path.exists(FILE):
        try:
            R = json.load(open(FILE, encoding="utf-8"))
        except Exception:
            R = {}
    L = stocks(); print("要抓", len(L), "家", flush=True)
    done = 0
    def job(x):
        time.sleep(0.15)
        return x[0], yahoo(*x)
    with ThreadPoolExecutor(4) as ex:
        for code, got in ex.map(job, L):
            for mo, v in got.items():
                R.setdefault(mo, {})[code] = v
            done += 1
            if done % 200 == 0:
                print("已抓", done, flush=True)
    R = dict(sorted(R.items())[-26:])
    print("月份：", {k: len(v) for k, v in R.items()}, flush=True)
    json.dump(R, open(FILE, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
