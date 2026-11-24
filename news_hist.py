"""新聞情緒資料：把每天每檔股票的新聞數量和「好消息／壞消息」分數存起來，給預測模型用。

來源：鉅亨網（cnyes）新聞 API，可以查過去任何一段時間，所以能補一年的資料拿來考試。
  台股：tw_stock、tw_quo 分類；美股：wd_stock、us_stock 分類。
  每篇新聞有標記相關股票代號，再加上標題裡出現公司名稱的也算。

好壞判斷：用財經新聞常見的詞（例如「創新高、獲利成長、上修、買超」算好；「虧損、下修、跌停、賣超」算壞）。
  不是很聰明，但簡單、每天都一樣、可以拿過去的資料考試看看有沒有用。

日期：台股收盤是 13:30，收盤後的新聞算到「下一天」，這樣考試時不會偷看到答案。
      美股收盤是美東 16:00（台灣隔天早上），一樣收盤後的新聞算到下一天。

用法：python news_hist.py           只補最近 4 天（每天更新用）
      DAYS=380 python news_hist.py  補一年多（第一次用）
輸出：news-sent.json {"tw": {日期: {代號: [新聞數, 分數]}}, "us": {...}}
"""
import json
import os
import re
import time
import urllib.request
from datetime import datetime, timedelta, timezone

FILE = "news-sent.json"
DAYS = int(os.environ.get("DAYS", "4"))
KEEP = 400
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}

POS = """創新高 新高 大漲 漲停 飆 噴 攻頂 勁揚 走揚 上漲 收紅 反彈 強彈 轉強 看好 樂觀 利多 受惠 搶單 接單 訂單 滿載 擴產 擴廠
獲利成長 獲利增 獲利創 營收創 營收成長 營收增 年增 月增 雙增 三率三升 轉盈 轉虧為盈 優於預期 超乎預期 超預期 優於 上修 調升 調高
目標價 買進 加碼 買超 回補 增持 大買 熱門 突破 創高 配息 高殖利率 股利 回購 庫藏股 合作 結盟 拿下 打入 獨家 首家 量產 認證 獲選 爆發 動能 需求強""".split()
NEG = """新低 大跌 跌停 重挫 崩 暴跌 摔 跌破 走跌 下跌 收黑 翻黑 走弱 轉弱 看壞 悲觀 利空 衝擊 拖累 砍單 延後 停工 停產 裁員 減產 關廠
虧損 轉虧 由盈轉虧 衰退 年減 月減 雙減 三率三降 下滑 不如預期 低於預期 遜於預期 下修 調降 調低 減碼 賣出 賣超 倒貨 大賣 減持 處置
警示 違約 訴訟 罰款 調查 制裁 禁令 關稅 退市 下市 停牌 掏空 爆雷 示警 疑慮 危機 風險 跳水 失守""".split()
# 「不、未、沒」緊接在前面就反過來（例如「不如預期」已經單獨列，這裡只處理簡單情況）
NEGATE = re.compile(r"[不未沒無]$")


def score(text):
    s = 0
    for w in POS:
        i = text.find(w)
        if i >= 0 and not NEGATE.search(text[max(0, i - 1):i]):
            s += 1
    for w in NEG:
        i = text.find(w)
        if i >= 0 and not NEGATE.search(text[max(0, i - 1):i]):
            s -= 1
    return max(-3, min(3, s))


def fetch(url, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return r.read().decode("utf-8", "ignore")
        except Exception as e:
            if k == tries - 1:
                print("抓不到", url[:90], e)
            time.sleep(2 + 3 * k)
    return ""


def key_date(ts, mk):
    utc = datetime.fromtimestamp(ts, timezone.utc)
    if mk == "tw":  # 台灣時間 13:30 收盤後 → 隔天
        return (utc + timedelta(hours=8) + timedelta(hours=10, minutes=30)).strftime("%Y-%m-%d")
    # 美東 16:00 收盤（約 UTC 21:00）後 → 隔天
    return (utc + timedelta(hours=3)).strftime("%Y-%m-%d")


def names_tw():
    for f in ("train-tw.json", "hist.json"):
        if os.path.exists(f):
            D = json.load(open(f, encoding="utf-8"))
            return {c: e[0] for c, e in D["s"].items()}
    return {}


def names_us():
    if os.path.exists("us.json"):
        D = json.load(open("us.json", encoding="utf-8"))
        return {c: e[0] for c, e in D["s"].items()}
    return {}


def crawl(mk, cats, names, out, start, end):
    # 名稱比對：太短的名字容易誤判，至少 2 個字
    zh = [(c, n) for c, n in names.items() if mk == "tw" and n and len(n) >= 2]
    seen = set(); got = 0
    for cat in cats:
        # 一次查 3 天，比較不會漏
        t0 = start
        while t0 < end:
            t1 = min(end, t0 + 3 * 86400)
            page = 1
            while page <= 40:
                t = fetch(f"https://api.cnyes.com/media/api/v1/newslist/category/{cat}?startAt={t0}&endAt={t1}&limit=100&page={page}", tries=2)
                try:
                    J = json.loads(t)["items"]; items = J["data"]
                except Exception:
                    break
                for it in items:
                    nid = it.get("newsId")
                    if nid in seen:
                        continue
                    seen.add(nid)
                    title = (it.get("title") or "").strip(); summ = (it.get("summary") or "")[:160]
                    hit = set()
                    for m in it.get("market") or []:
                        c = str(m.get("code") or m.get("symbol") or "").split(":")
                        c = c[1] if len(c) >= 2 else c[-1]
                        if c in names:
                            hit.add(c)
                    for c, n in zh:
                        if n in title or f"({c})" in title or f"（{c}）" in title:
                            hit.add(c)
                    if not hit:
                        continue
                    try:
                        d = key_date(int(it.get("publishAt")), mk)
                    except Exception:
                        continue
                    s = score(title + " " + summ)
                    day = out.setdefault(d, {})
                    for c in hit:
                        v = day.setdefault(c, [0, 0]); v[0] += 1; v[1] += s
                    got += 1
                if page >= (J.get("last_page") or 1):
                    break
                page += 1; time.sleep(.25)
            t0 = t1
            time.sleep(.3)
    print(mk, "對到股票的新聞", got, "篇")


def main():
    old = {}
    if os.path.exists(FILE):
        try:
            old = json.load(open(FILE, encoding="utf-8"))
        except Exception:
            old = {}
    now = int(time.time()); start = now - DAYS * 86400
    for mk, cats, names in (("tw", ["tw_stock", "tw_quo"], names_tw()), ("us", ["wd_stock", "us_stock"], names_us())):
        if not names:
            continue
        fresh = {}
        crawl(mk, cats, names, fresh, start, now)
        cur = old.get(mk, {})
        # 重抓的日子整天換掉（不會重複算）
        first = min(fresh) if fresh else None
        if first in cur:  # 最早那天只抓到一部分，保留原本完整的
            del fresh[first]
        for d in list(cur):
            if d in fresh:
                del cur[d]
        cur.update(fresh)
        old[mk] = dict(sorted(cur.items())[-KEEP:])
        print(mk, "共", len(old[mk]), "天")
    old["upd"] = datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M")
    json.dump(old, open(FILE, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
