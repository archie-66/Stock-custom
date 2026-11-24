"""預測模型（每天在 GitHub 上訓練一次，手機只要讀結果）

為什麼改成預測「會不會贏過大盤」：
  用過去資料測試，「5 天後漲還是跌」主要跟著整個市場走，用個股的價格和成交量猜不出來（測試結果比亂猜還差）。
  但「這檔會比其他股票強還是弱」是猜得出一點的：台股大約 6 成多會對，亂猜是 5 成。

做法：
  1. 每檔股票每天算 18 個數字（最近漲跌、離均線多遠、RSI、波動、成交量變化、K 線實體和影線、法人買賣…）
  2. 同一天所有股票互相比，換成排名（這樣整個市場一起漲或一起跌就不會干擾）
  3. 答案：5 個交易日後，這檔的漲跌幅有沒有贏過「所有股票的中間值」
  4. 用「走一步考一次」的方法考試：只用某天以前的資料訓練，考接下來幾天，一路往後移，最後把每次考試平均起來
  5. 選考得比較好的模型，用全部資料重新訓練，算出每檔股票最新的機率

用法：python model.py tw          （讀 hist.json，寫 pred-tw.json）
      在 us.py 裡呼叫 run(D, "us")  （用 2 年的資料，寫 pred-us.json）
"""
import json
import sys
from datetime import datetime, timezone, timedelta

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression

H = 5
HS = (5, 20)  # 試兩種：5 個交易日（大約 1 週）、20 個交易日（大約 1 個月），選考得比較好的
NEWS_F = ["nn3", "ns3", "ns1"]
REV_F = ["ryoy", "racc", "ryoy3", "rmom"]
BASE_F = ["r1", "r5", "r10", "r20", "r60", "g5", "g20", "slope", "rsi", "vol", "vr", "vr5", "pos", "body", "ush", "lsh", "inst", "dhi"]
FEATS = BASE_F + NEWS_F + REV_F
# 用簡單的話說明每個數字（給手機畫面顯示「主要根據」）
WHY = {
    "r1": ("今天漲比較多", "今天跌比較多"), "r5": ("近 5 天漲比較多", "近 5 天跌比較多"),
    "r10": ("近 10 天漲比較多", "近 10 天跌比較多"), "r20": ("近 1 個月漲比較多", "近 1 個月跌比較多"),
    "r60": ("近 3 個月漲比較多", "近 3 個月跌比較多"), "g5": ("價格在 5 日均線上方", "價格在 5 日均線下方"),
    "g20": ("價格在 20 日均線上方", "價格在 20 日均線下方"), "slope": ("20 日均線往上", "20 日均線往下"),
    "rsi": ("RSI 偏高（漲多）", "RSI 偏低（跌多）"), "vol": ("股價波動大", "股價波動小、比較穩"),
    "vr": ("今天成交量放大", "今天成交量縮小"), "vr5": ("最近成交量放大", "最近成交量縮小"),
    "pos": ("接近一個月的最高價", "接近一個月的最低價"), "body": ("今天收紅 K（收盤比開盤高）", "今天收黑 K（收盤比開盤低）"),
    "ush": ("上影線長（上面有賣壓）", "沒有上影線"), "lsh": ("下影線長（下面有買盤）", "沒有下影線"),
    "inst": ("外資投信在買", "外資投信在賣"), "dhi": ("離一個月高點近", "離一個月高點遠"),
    "ryoy": ("最新月營收比去年成長多", "最新月營收比去年成長少或衰退"), "racc": ("營收成長在加速", "營收成長在變慢"),
    "ryoy3": ("近 3 個月營收成長多", "近 3 個月營收成長少"), "rmom": ("營收比上個月多", "營收比上個月少"),
    "nn3": ("最近新聞很多", "最近幾乎沒新聞"), "ns3": ("近 3 天新聞偏好消息", "近 3 天新聞偏壞消息"), "ns1": ("今天新聞偏好消息", "今天新聞偏壞消息"),
}


def news_arrays(D, mk):
    """把 news-sent.json 對到交易日：每檔股票每個交易日的 [新聞數, 好壞分數]"""
    import bisect, os
    out = {}
    if not os.path.exists("news-sent.json"):
        return out, None
    NS = json.load(open("news-sent.json", encoding="utf-8")).get(mk, {})
    dates = D["dates"]; n = len(dates)
    for d, day in NS.items():
        i = bisect.bisect_left(dates, d)
        if i >= n:
            continue
        for c, (cnt, sc) in day.items():
            a = out.get(c)
            if a is None:
                a = out[c] = np.zeros((2, n))
            a[0, i] += cnt; a[1, i] += sc
    first = min(NS) if NS else None
    return out, (bisect.bisect_left(dates, first) if first else None)
TW = timezone(timedelta(hours=8))


def arr(e, j, n):
    if len(e) > j and e[j]:
        return np.array([np.nan if x is None else x for x in e[j]], float)
    return np.full(n, np.nan)


def mk_of(code):
    return "tw" if code[:1].isdigit() else "us"


def rev_arrays(D):
    """每個交易日能看到的最新月營收：第 M 月的營收當作 M+1 月 11 號才知道"""
    import os
    if not os.path.exists("rev-tw.json"):
        return {}
    RV = json.load(open("rev-tw.json", encoding="utf-8"))
    months = sorted(RV)
    if len(months) < 4:
        return {}
    def avail(mo):
        y, m = map(int, mo.split("-")); m += 1
        if m == 13:
            y, m = y + 1, 1
        return f"{y}-{m:02d}-11"
    dates = D["dates"]; n = len(dates); out = {}
    # 每個交易日 → 最新可用月份的索引
    idx = []; j = -1
    for d in dates:
        while j + 1 < len(months) and avail(months[j + 1]) <= d:
            j += 1
        idx.append(j)
    codes = set().union(*[set(RV[m]) for m in months])
    for c in codes:
        yoy = [RV[m].get(c, [None, None, None])[2] for m in months]
        mom = [RV[m].get(c, [None, None, None])[1] for m in months]
        a = np.full((4, n), np.nan)
        for t, j in enumerate(idx):
            if j < 0 or yoy[j] is None:
                continue
            clip = lambda v: max(-100.0, min(300.0, v))
            a[0, t] = clip(yoy[j])
            if j >= 1 and yoy[j - 1] is not None:
                a[1, t] = clip(yoy[j]) - clip(yoy[j - 1])
            w = [clip(v) for v in yoy[max(0, j - 2):j + 1] if v is not None]
            a[2, t] = sum(w) / len(w) if w else np.nan
            a[3, t] = clip(mom[j]) if mom[j] is not None else np.nan
        out[c] = a
    print("月營收：", len(months), "個月，", len(out), "家公司")
    return out


def features(D, NA=None, RA=None):
    """回傳 DataFrame：每一列是 (日期索引 t, 代號, 18 個數字, 5 天後漲跌幅)"""
    n = len(D["dates"]); out = []
    skip = set(D.get("etf", []))
    for code, e in D["s"].items():
        if code in skip or (mk_of(code) == "tw" and code.startswith("0")):  # ETF、債券、REIT 不算（它們不是公司）
            continue
        c = arr(e, 2, n)
        if np.isfinite(c).sum() < 30:
            continue
        v, f, o, h, l = arr(e, 3, n), arr(e, 4, n), arr(e, 5, n), arr(e, 6, n), arr(e, 7, n)
        s = pd.DataFrame({"c": c, "v": v, "f": f, "o": o, "h": h, "l": l})
        s["c"] = s["c"].ffill(limit=2)
        C = s["c"]; lr = np.log(C).diff()
        hh = s["h"].fillna(C); ll = s["l"].fillna(C)
        ma5, ma20 = C.rolling(5).mean(), C.rolling(20).mean()
        d = C.diff(); gu = d.clip(lower=0).rolling(14).sum(); gd = (-d.clip(upper=0)).rolling(14).sum()
        va = s["v"].shift(1).rolling(20, min_periods=10).mean()
        hi20, lo20 = hh.rolling(20).max(), ll.rolling(20).min()
        rng = (hh - ll).where(hh > ll)
        x = pd.DataFrame({
            "r1": C / C.shift(1) - 1, "r5": C / C.shift(5) - 1, "r10": C / C.shift(10) - 1, "r20": C / C.shift(20) - 1,
            "r60": C / C.shift(60) - 1, "g5": C / ma5 - 1, "g20": C / ma20 - 1, "slope": ma20 / ma20.shift(5) - 1,
            "rsi": gu / (gu + gd), "vol": lr.rolling(20).std(), "vr": np.log1p(s["v"]) - np.log1p(va),
            "vr5": np.log1p(s["v"].rolling(5).mean()) - np.log1p(va), "pos": (C - lo20) / (hi20 - lo20),
            "body": (C - s["o"]) / rng, "ush": (hh - np.maximum(C, s["o"])) / rng, "lsh": (np.minimum(C, s["o"]) - ll) / rng,
            "inst": s["f"].rolling(5, min_periods=1).sum() / (va * 5), "dhi": C / C.rolling(20).max() - 1,
        })
        for hz in HS:
            x[f"fut{hz}"] = C.shift(-hz) / C - 1
        a = (NA or {}).get(code)
        if a is None:
            a = np.zeros((2, n))
        cnt, sc = pd.Series(a[0]), pd.Series(a[1])
        x["nn3"] = np.log1p(cnt.rolling(3, min_periods=1).sum())
        x["ns3"] = sc.rolling(3, min_periods=1).sum(); x["ns1"] = sc
        r = (RA or {}).get(code)
        if r is None:
            r = np.full((4, n), np.nan)
        x["ryoy"], x["racc"], x["ryoy3"], x["rmom"] = r[0], r[1], r[2], r[3]
        x["t"] = np.arange(n); x["code"] = code
        x = x[np.isfinite(s["c"].values) & np.isfinite(x["r20"].values)]
        x = x[x["t"] >= 25]
        out.append(x)
    return pd.concat(out, ignore_index=True)


def ranked(X):
    """同一天互相比，換成 -0.5 ～ 0.5 的排名；沒有資料的放中間"""
    R = X.groupby("t")[FEATS].rank(pct=True) - 0.5
    return R.fillna(0.0)


def make(kind):
    if kind == "logit":
        return LogisticRegression(C=0.1, max_iter=1000)
    return HistGradientBoostingClassifier(max_depth=3, max_iter=150, learning_rate=0.05, l2_regularization=1.0)


def run(D, mk):
    NA, nfirst = news_arrays(D, mk)
    RA = rev_arrays(D) if mk == "tw" else {}
    X = features(D, NA, RA)
    R_all = ranked(X); nd = len(D["dates"])
    if nfirst is not None:
        print(mk, "新聞資料從第", nfirst, "個交易日開始，共", len(NA), "檔有新聞")
    T = X["t"].values; nd = len(D["dates"]); last = int(T.max())
    res = {}
    sets = {"base": BASE_F}
    if NA:
        sets["news"] = BASE_F + NEWS_F
    if RA:
        sets["rev"] = BASE_F + REV_F
        sets["all"] = FEATS
    for fs_name, fs in sets.items():
      R = R_all[fs].values
      for H in HS:
          fut = X[f"fut{H}"]
          med = fut.groupby(X["t"]).transform("median")
          lab = np.isfinite(fut.values)
          Y = (fut.values > med.values).astype(int)
          start = max(40, int(nd * 0.5)); step = max(H, (last - H - start) // 12 // H * H or H)
          folds = list(range(start, last - H + 1, step))
          for kind in ("logit", "gbm"):
              hit = tot = 0; per = []; chit = ctot = 0
              for k in folds:
                  tr = lab & (T < k - H); te = lab & (T >= k) & (T < k + min(H, step))
                  if tr.sum() < 2000 or te.sum() < 100:
                      continue
                  m = make(kind).fit(R[tr], Y[tr]); p = m.predict_proba(R[te])[:, 1]
                  ok = (p > 0.5) == (Y[te] == 1); hit += ok.sum(); tot += len(ok); per.append(round(float(ok.mean()), 3))
                  cf = np.abs(p - 0.5) >= 0.05; chit += ok[cf].sum(); ctot += cf.sum()
              res[(fs_name, H, kind)] = {"acc": float(hit / tot) if tot else None, "n": int(tot), "folds": per,
                                "cAcc": float(chit / ctot) if ctot else None, "cN": int(ctot), "lab": lab, "Y": Y}
              print(mk, fs_name, H, kind, {k: v for k, v in res[(fs_name, H, kind)].items() if k not in ("lab", "Y")})
    ok_ = {k: v for k, v in res.items() if v["acc"] is not None and v["n"] >= 2000}
    # 選考最好的；線性模型比較好解釋，除非另一個明顯比較準（多 2% 以上）
    bestk = max(ok_, key=lambda k: ok_[k]["acc"] + (0.02 if k[2] == "logit" else 0)) if ok_ else ("base", 5, "logit")
    fs_name, H, best = bestk; lab, Y = res[bestk]["lab"], res[bestk]["Y"]
    allres = {f"{a}-{b}-{c}": round(v["acc"], 4) for (a, b, c), v in ok_.items()}
    res = {best: res[bestk]}
    use = sets[fs_name]; R = R_all[use].values
    m = make(best).fit(R[lab], Y[lab])
    now = (X["t"].values == last)
    P = m.predict_proba(R[now])[:, 1]
    codes = X["code"].values[now]
    out = {"upd": datetime.now(TW).strftime("%Y-%m-%d %H:%M"), "date": D["dates"][last], "model": best,
           "acc": res[best]["acc"], "nTest": res[best]["n"], "folds": res[best]["folds"], "cAcc": res[best]["cAcc"], "cN": res[best]["cN"],
           "h": H, "fs": fs_name, "tests": allres, "p": {}, "why": {}}
    for i, c in enumerate(codes):
        out["p"][c] = round(float(P[i]), 3)
    if best == "logit":  # 每檔股票影響最大的 3 個原因
        w = m.coef_[0]; Rn = R[now]
        for i, c in enumerate(codes):
            contrib = w * Rn[i]
            top = np.argsort(-np.abs(contrib))[:3]
            out["why"][c] = [[use[j], 1 if Rn[i][j] > 0 else -1, 1 if contrib[j] > 0 else -1] for j in top if abs(contrib[j]) > 0.01]
    json.dump(out, open(f"pred-{mk}.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(mk, "用", best, "考試", out["acc"], "共", len(out["p"]), "檔")
    return out


if __name__ == "__main__":
    mk = sys.argv[1] if len(sys.argv) > 1 else "tw"
    import os
    run(json.load(open("train-tw.json" if os.path.exists("train-tw.json") else "hist.json", encoding="utf-8")), mk)
