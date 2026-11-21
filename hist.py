"""
預測分頁用的歷史資料：每檔股票最近 60 個交易日的收盤價、成交量，
以及上市股票的外資＋投信買賣超（張）。寫成 hist.json。

- 每次執行先補「今天」，再往回補還沒有的日子（每次最多 BACKFILL 天，避免跑太久）。
- 假日或沒資料的日子會記在 skip，不會一直重抓。
- 只用 Python 內建模組，和 update.py 共用抓資料的小工具。
"""
import json, os, sys, time
from datetime import datetime, timedelta
from update import get, num, tables, col, TW, BASE

FILE = "hist.json"
KEEP = 60          # 保留幾個交易日
BACKFILL = int(os.environ.get("BACKFILL", "12"))
TOP = 700          # 只保留成交金額前 700 名（加上原本就有的），檔案才不會太大


def day_twse(dt):
    """上市：某一天全部股票 {代號: [收盤, 成交張數, 名稱]}"""
    ymd = dt.strftime("%Y%m%d")
    mi = get(f"{BASE}/afterTrading/MI_INDEX?date={ymd}&type=ALLBUT0999&response=json")
    if not mi or mi.get("stat") not in (None, "OK"):
        return {}
    out = {}
    for (title, f, data) in tables(mi):
        ic, icl, ish, iam, iname = col(f, "證券代號"), col(f, "收盤價"), col(f, "成交股數"), col(f, "成交金額"), col(f, "證券名稱")
        io, ih, il = col(f, "開盤價"), col(f, "最高價"), col(f, "最低價")
        if ic is None or icl is None:
            continue
        for x in data:
            c = num(x[icl])
            if c is None:
                continue
            out[str(x[ic]).strip()] = [c, int((num(x[ish]) or 0) / 1000), str(x[iname]).strip() if iname is not None else "",
                                       round((num(x[iam]) or 0) / 1e8, 2) if iam is not None else 0,
                                       num(x[io]) if io is not None else None, num(x[ih]) if ih is not None else None, num(x[il]) if il is not None else None]
    return out


def day_otc(dt):
    """上櫃：某一天全部股票（舊版網址可以指定日期）"""
    roc_d = f"{dt.year-1911}/{dt.month:02d}/{dt.day:02d}"
    out = {}
    js = get(f"https://www.tpex.org.tw/web/stock/aftertrading/otc_quotes_no1430/stk_wn1430_result.php?l=zh-tw&d={roc_d}&se=EW&o=json")
    rows = (js or {}).get("aaData") or []
    for x in rows:
        if len(x) >= 10:
            c = num(x[2])
            if c is not None:
                out[str(x[0]).strip()] = [c, int((num(x[8]) or 0) / 1000), str(x[1]).strip(), round((num(x[9]) or 0) / 1e8, 2), num(x[4]), num(x[5]), num(x[6])]
    if out:
        return out
    js = get(f"https://www.tpex.org.tw/www/zh-tw/afterTrading/otc?date={dt.year}%2F{dt.month:02d}%2F{dt.day:02d}&type=EW&id=&response=json")
    for (title, f, data) in tables(js):
        ic, icl, ish, iam, iname = col(f, "代號"), col(f, "收盤"), col(f, "成交股數"), col(f, "成交金額"), col(f, "名稱")
        io, ih, il = col(f, "開盤"), col(f, "最高"), col(f, "最低")
        if ic is None or icl is None:
            continue
        for x in data:
            c = num(x[icl])
            if c is not None:
                out[str(x[ic]).strip()] = [c, int((num(x[ish]) if ish is not None else 0) or 0) // 1000,
                                           str(x[iname]).strip() if iname is not None else "",
                                           round(((num(x[iam]) if iam is not None else 0) or 0) / 1e8, 2),
                                           num(x[io]) if io is not None else None, num(x[ih]) if ih is not None else None, num(x[il]) if il is not None else None]
    return out


def day_inst(dt):
    """上市個股：外資（不含外資自營商）＋投信 買賣超張數（T86）"""
    ymd = dt.strftime("%Y%m%d")
    js = get(f"{BASE}/fund/T86?date={ymd}&selectType=ALLBUT0999&response=json")
    if not js or js.get("stat") not in (None, "OK"):
        return {}
    out = {}
    for (title, f, data) in tables(js):
        ic = col(f, "證券代號")
        ifo = col(f, "外陸資買賣超股數(不含外資自營商)", "外資買賣超股數", "外陸資買賣超股數")
        itr = col(f, "投信買賣超股數")
        if ic is None or (ifo is None and itr is None):
            continue
        for x in data:
            fo = (num(x[ifo]) or 0) if ifo is not None else 0
            tr = (num(x[itr]) or 0) if itr is not None else 0
            out[str(x[ic]).strip()] = int(round((fo + tr) / 1000))
    return out


def main():
    now = datetime.now(TW)
    H = {"dates": [], "skip": [], "s": {}}
    try:  # 讀進緊湊格式，轉回 {日期: 值}
        old = json.load(open(FILE, encoding="utf-8"))
        H["dates"], H["skip"] = old.get("dates", []), old.get("skip", [])
        if old.get("ver") != 2:  # 舊格式沒有開高低，重新抓一次
            raise ValueError("舊版歷史檔，重新建立（加入開盤、最高、最低）")
        for code, row in old.get("s", {}).items():
            n, m, cs, vs, fs = row[:5]
            os_, hs, ls = (row[5:8] + [None, None, None])[:3]
            z = lambda arr: {d: x for d, x in zip(H["dates"], arr or []) if x is not None}
            H["s"][code] = {"n": n, "m": m, "c": z(cs), "v": z(vs), "f": z(fs), "o": z(os_), "h": z(hs), "l": z(ls)}
    except Exception as e:
        print("新的歷史檔", e)
    # H["s"][code] = {"n": 名稱, "m": "o"/"", "c": {date: 收盤}, "v": {date: 張}, "f": {date: 外資+投信張}}

    have, skip = set(H["dates"]), set(H["skip"])
    # 要處理的日子：今天（收盤後）＋往回的平日
    todo = []
    d = now if now.hour * 60 + now.minute >= 14 * 60 + 30 else now - timedelta(days=1)
    for _ in range(130):
        if len(todo) >= BACKFILL or len(have) + len(todo) >= KEEP:
            break
        ds = d.strftime("%Y-%m-%d")
        if d.weekday() < 5 and ds not in have and ds not in skip:
            todo.append(d)
        d -= timedelta(days=1)
    # 已經有 60 天時，上面不會抓今天，所以另外檢查今天
    t0 = now if now.hour * 60 + now.minute >= 14 * 60 + 30 else None
    if t0 and t0.weekday() < 5 and t0.strftime("%Y-%m-%d") not in have and all(x.date() != t0.date() for x in todo):
        todo.insert(0, t0)

    changed = False
    for dt in todo:
        ds = dt.strftime("%Y-%m-%d")
        tw = day_twse(dt); time.sleep(3)
        if not tw:
            if dt.date() < now.date():
                H["skip"].append(ds); changed = True  # 過去的日子沒資料＝休市
            print(ds, "沒有上市資料，略過")
            continue
        ot = day_otc(dt); time.sleep(3)
        inst = day_inst(dt); time.sleep(3)
        print(ds, "上市", len(tw), "上櫃", len(ot), "法人", len(inst))
        # 選股：當天成交金額前 TOP 名 + 已經在追蹤的
        both = [(k, v, "") for k, v in tw.items()] + [(k, v, "o") for k, v in ot.items()]
        ranked = sorted(both, key=lambda z: -(z[1][3] or 0))
        keep = {z[0] for z in ranked[:TOP]} | set(H["s"].keys())
        for code, v, mk in both:
            if code not in keep:
                continue
            e = H["s"].setdefault(code, {"n": v[2], "m": mk, "c": {}, "v": {}, "f": {}, "o": {}, "h": {}, "l": {}})
            if v[2]:
                e["n"] = v[2]
            e["c"][ds] = v[0]; e["v"][ds] = v[1]
            for j, kk in ((4, "o"), (5, "h"), (6, "l")):
                if len(v) > j and v[j] is not None:
                    e.setdefault(kk, {})[ds] = v[j]
            if code in inst:
                e["f"][ds] = inst[code]
        H["dates"].append(ds); changed = True

    # 法人資料有時比收盤行情晚公布：最近 3 天如果還沒有，就再補抓一次
    for ds in sorted(H["dates"])[-3:]:
        if any(ds in e["f"] for e in H["s"].values()):
            continue
        dt = datetime.strptime(ds, "%Y-%m-%d").replace(tzinfo=TW)
        inst = day_inst(dt); time.sleep(3)
        if inst:
            print(ds, "補上法人", len(inst))
            for code, e in H["s"].items():
                if code in inst:
                    e["f"][ds] = inst[code]
            changed = True

    if not changed:
        print("歷史資料不用更新")
        return 0
    H["dates"] = sorted(set(H["dates"]))[-KEEP:]
    keepd = set(H["dates"])
    H["skip"] = sorted(set(H["skip"]))[-80:]
    for code in list(H["s"].keys()):
        e = H["s"][code]
        for k in ("c", "v", "f", "o", "h", "l"):
            e.setdefault(k, {})
            e[k] = {d: x for d, x in e[k].items() if d in keepd}
        if not e["c"]:
            del H["s"][code]
    H["updatedAt"] = now.strftime("%Y-%m-%d %H:%M")
    # 緊湊格式：每檔的陣列和 dates 一一對齊，前端比較好算
    out = {"dates": H["dates"], "skip": H["skip"], "updatedAt": H["updatedAt"], "s": {}}
    for code, e in H["s"].items():
        out["s"][code] = [e["n"], e["m"],
                          [e["c"].get(d) for d in H["dates"]],
                          [e["v"].get(d) for d in H["dates"]],
                          [e["f"].get(d) for d in H["dates"]] if e["f"] else None,
                          [e.get("o", {}).get(d) for d in H["dates"]],
                          [e.get("h", {}).get(d) for d in H["dates"]],
                          [e.get("l", {}).get(d) for d in H["dates"]]]
    out["ver"] = 2
    json.dump(out, open(FILE, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("歷史資料：", len(H["dates"]), "天，", len(H["s"]), "檔")
    return 0


if __name__ == "__main__":
    sys.exit(main())
