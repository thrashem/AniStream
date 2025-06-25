import argparse
from datetime import datetime, timedelta
import json
import requests

# --- 引数処理 ---
parser = argparse.ArgumentParser(description="1週間のアニメ配信予定をMarkdown形式で出力")
parser.add_argument("--from", dest="from_date", help="起点日 (例: 2025-07-01)")
parser.add_argument("--output", dest="output_file", help="保存先ファイル名")
args = parser.parse_args()

now = datetime.now()
has_from = bool(args.from_date)

if has_from:
    base_date = datetime.strptime(args.from_date, "%Y-%m-%d").date()
else:
    base_date = now.date()

day_count = 7
day_order = [(base_date + timedelta(days=i)).strftime("%A") for i in range(day_count)]
day_slots = {day: [] for day in day_order}

# --- JSON 取得（GitHub API経由）---
API_URL = "https://raw.githubusercontent.com/thrashem/AniStream/main/2025/summer.json"

try:
    res = requests.get(API_URL)
    res.raise_for_status()
    data = res.json()
except requests.RequestException as e:
    print(f"[ERROR] データ取得に失敗しました: {e}")
    exit(1)

# --- 掲載対象の抽出---
for anime in data:
    for s in anime.get("streaming", []):
        if not all(k in s for k in ("first_air_date", "day_of_week", "time")):
            continue
        try:
            first_date = datetime.strptime(s["first_air_date"], "%Y-%m-%d").date()
        except ValueError:
            continue

        for i in range(day_count):
            date = base_date + timedelta(days=i)
            if date.strftime("%A") != s["day_of_week"]:
                continue
            if date < first_date:
                continue

            day_slots[date.strftime("%A")].append({
                "id": anime.get("anilist_id") or anime.get("id"),
                "title": anime.get("title"),
                "time": s["time"],
                "platform": s.get("platform")
            })

# --- 並び替え ---
for items in day_slots.values():
    items.sort(key=lambda x: x["time"])

# --- Markdown 出力（空曜日はスキップ） ---
lines = []

for i, day in enumerate(day_order):
    items = day_slots[day]
    if not items:
        continue

    date = base_date + timedelta(days=i)
    label = date.strftime("%Y-%m-%d (%a)")

    lines.append(f"### {label}")
    lines.append("| ID | Title | Time | Site |")
    lines.append("|----|-------|------|------|")
    for item in items:
        lines.append(f"| {item.get('id','')} | {item['title']} | {item['time']} | {item['platform']} |")
    lines.append("")

output_text = "\n".join(lines)

# --- 出力制御 ---
if not args.output_file:
    print(output_text)

output_file = args.output_file or base_date.strftime("%Y-%m-%d") + ".md"
with open(output_file, "w", encoding="utf-8") as f:
    f.write(output_text)
