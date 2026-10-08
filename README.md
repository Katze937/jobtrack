# JobTrack Public Demo

JobTrack 是一個公開作品集 demo：用假資料展示如何把求職流程轉成資料結構、KPI、圖表與可互動的 Kanban workflow。它不處理真實求職資料，重點是呈現 data model design、workflow tracking、KPI design 和 front-end dashboard implementation。

目前版本不是 React 專案，而是純靜態 `HTML + CSS + JavaScript`。這樣做的好處是不用 build step，推到 GitHub 後可以直接用 Cloudflare Pages 部署。

## Features

- 26 筆假 application records
- 多頁面切換：`Tracker` 管理資料，`Analytics` 看 KPI、圖表與提醒
- Tracker 頁面可新增 application、修改狀態、更新備註
- 每筆 application 可保存 LinkedIn、官網或其他投遞連結，方便回到原始職缺頁追蹤
- Paste Update：貼上拒絕信、offer 或面試通知文字，自動比對公司名稱和狀態關鍵字
- KPI cards：total applications、response rate、interview rate、rejection rate、offer rate、average waiting days
- Chart.js 圖表：status distribution、weekly trend、platform distribution、funnel
- Pending alerts：提醒已 pending 超過 14 天或 30 天的投遞紀錄
- HTML5 drag-and-drop Kanban board
- 拖拉後自動更新 `current_status`、`current_stage_started_at`、`last_updated_at`
- 進入 `offer`、`rejected` 或 `withdrawn` 後，工作流天數會停在進入終止狀態的日期
- `localStorage` 儲存 demo 狀態
- Reset Demo 一鍵回到原始假資料
- Responsive layout for desktop and mobile

## Update Detection Rules

The Paste Update feature is intentionally rule-based and local-only. It does not call an API or send email content to a server.

To support more companies and email styles, update these arrays in `app.js`:

- `STATUS_DETECTION_RULES`: add wording that should map to `rejected`, `offer`, `withdrawn`, `interview`, or `screening`.
- `COMPANY_EXTRACTION_PATTERNS`: add regular expressions for company-name formats that appear in email bodies or signatures.

Examples:

- Add rejection wording such as `not selected`, `not successful`, or `pursue other candidates` under the `rejected` rule.
- Add signature formats such as `The Example Co. Recruiting Team` to `COMPANY_EXTRACTION_PATTERNS`.

Company matching is case-insensitive, so `PolicyMe`, `policyme`, and `POLICYME` are treated as the same company when matching existing records.

## Tech Stack

- HTML
- CSS
- JavaScript
- Chart.js
- Browser `localStorage`
- Static JSON data

## Project Structure

```text
jobtrack/
  index.html
  analytics.html
  styles.css
  app.js
  data/
    sample_applications.json
  docs/
    kpi_definitions.md
    data_dictionary.md
    schema.sql
  README.md
```

## Data Model

每筆 application record 代表一個求職機會。核心欄位包含：

- `application_id`
- `company_name`
- `position_title`
- `platform`
- `source_url`
- `applied_at`
- `current_status`
- `current_stage_started_at`
- `last_updated_at`
- `priority`
- `salary_min_twd`
- `salary_max_twd`
- `notes`

完整欄位定義請見 `docs/data_dictionary.md`。資料庫設計草稿請見 `docs/schema.sql`。

## KPI Definitions

KPI 由 `app.js` 根據目前資料即時計算：

- Total Applications：所有 demo records 數量
- Response Rate：已投遞且進入 screening/interview/offer/rejected 的比例
- Interview Rate：已投遞且進入 interview/offer 的比例
- Rejection Rate：已投遞且目前為 rejected 的比例
- Offer Rate：已投遞且目前為 offer 的比例
- Average Waiting Days：active records 在目前階段等待的平均天數

完整定義請見 `docs/kpi_definitions.md`。

## Privacy Design

這個公開版 demo 不使用真實求職資料。

- 所有公司、職缺、連結、薪資與備註都是假資料。
- 不包含真實姓名、email、電話、履歷、面試內容或公司內部資訊。
- 拖拉後的狀態只存在使用者瀏覽器的 `localStorage`。
- Reset Demo 會清除 `localStorage`，重新載入 `data/sample_applications.json`。

## Run Locally

因為 demo 使用 `fetch()` 載入 JSON，建議透過本機 server 開啟，不要直接雙擊 `index.html`。

```bash
cd jobtrack
npx --yes http-server . -p 8000
```

Then open:

```text
http://localhost:8000
```

頁面：

- `http://localhost:8000/index.html`：Tracker，新增和更新投遞資料
- `http://localhost:8000/analytics.html`：Analytics，查看 KPI、圖表和 pending reminders

如果你的環境有 Python，也可以：

```bash
python -m http.server 8000
```

## Deploy to Cloudflare Pages

這是純靜態網站，不需要 build step。

1. 將此資料夾推到 GitHub repository。
2. 到 Cloudflare dashboard 的 Workers & Pages。
3. 建立 Pages project，選擇 Import an existing Git repository。
4. 選擇 GitHub repository。
5. Production branch 選 `main`。
6. Framework preset 選 None 或不選 framework。
7. Build command 可留空；若介面要求可填 `exit 0`。
8. Build output directory 填 `/` 或留在 repository root。
9. Deploy 後會取得 `*.pages.dev` 網址。

之後每次 push 到 GitHub，Cloudflare Pages 會自動重新部署。

Cloudflare reference:

- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/build-configuration/

## Portfolio Usage

可以把這個 demo 放在個人網站的 project page，或在 portfolio project section 連到 Cloudflare Pages demo。作品集說明可聚焦：

- 如何設計求職流程資料模型
- 如何定義 KPI 與 funnel
- 如何用圖表追蹤 pipeline health
- 如何用 Kanban 互動更新 workflow state
- 如何做 privacy-aware public demo
