# AniStream

日本国内で配信されているアニメのスケジュール情報を提供する、静的なAPIリポジトリです。AniListの `anilist_id` に紐づけながら、ABEMA・dアニメストア・Netflix（JP）などの国内サブスクリプション配信情報を手動で補完します。  
> dアニメストアのみ対応が終わっています。(2025/6/25現在)

---

## 構成概要

- `2025/`  
  各シーズンの配信情報を JSON 形式で格納（例：`summer.json`）。  
  これらが本APIのレスポンス対象です。

- `sample/week_schedule.py`  
  上記のJSONファイルをもとに、曜日ごとの週間スケジュール（Markdown形式）を出力するサンプルスクリプトです。

---

## API仕様

静的ホスティングされた `.json` ファイルがAPIの役割を担います。

例：`https://raw.githubusercontent.com/thrashem/AniStream/main/2025/summer.json`

JSON構造は以下の通りです（一部省略）：

```json
{
  "150674": {
    "title": "響け！ユーフォニアム３",
    "streaming": [
      {
        "first_air_date": "2025-04-07",
        "time": "00:00",
        "day_of_week": "Monday",
        "platform": "d_anime",
        "platform_url": "https://animestore.docomo.ne.jp/",
        "url": "",
        "notes": ""
      }
    ]
  }
}
```

- `anilist_id` をキーとし、作品ごとに配信情報をまとめます。
- フィールドは一部省略可能ですが、`first_air_date` / `time` / `day_of_week` / `platform` は必須です。

---

## サンプルスクリプト

静的API（`2025/*.json`）を利用するためのサンプルスクリプトです。

### 📄 [sample/week_schedule.py](https://github.com/thrashem/AniStream/blob/main/sample/week_schedule.py)

指定された `.json` ファイルをもとに、Markdown形式の週間スケジュールを生成します。

#### 使用方法：

```bash
python sample/week_schedule.py --from 2025-07-01 --output 2025-07-01.md
```

- `--from` に指定した日付を起点に、7日間の配信予定を Markdown に出力します。
- 省略した場合は実行日を使用します。
- 出力ファイル名は任意。`.md` 拡張子をつけてください。
- 曜日ごとに作品がまとめられたシンプルな一覧を生成します。

---

## 方針と補足

- AniListに未登録の作品は対象外です。
- タイトル以外の放送局情報などの収集は行っていません。必要な場合はAniListから取得してください。
- 配信スケジュールのみを補完対象とし、手動更新または軽量な補助スクリプトによる運用を前提としています。
- 本リポジトリは静的APIとして設計されており、外部サーバやDBを必要としません。

---

## ライセンス

MIT License
