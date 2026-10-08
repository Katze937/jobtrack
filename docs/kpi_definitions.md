# JobTrack KPI Definitions

本文件定義公開 demo 使用的 KPI。所有指標都由 `data/sample_applications.json` 的假資料即時計算，拖拉 Kanban 卡片後會重新計算並儲存在瀏覽器 `localStorage`。

## Total Applications

- 定義：目前 demo dataset 中的所有 application records。
- 公式：`count(applications)`
- 用途：顯示追蹤池規模。

## Response Rate

- 定義：已投遞且進入 `screening`、`interview`、`offer` 或 `rejected` 的比例。
- 分母：`applied_at` 不為空的 records。
- 分子：`current_status in ("screening", "interview", "offer", "rejected")`
- 公式：`responded_applications / submitted_applications`
- 用途：衡量履歷投遞後收到任何明確回覆的比例。

## Interview Rate

- 定義：已投遞且進入 `interview` 或 `offer` 的比例。
- 分母：`applied_at` 不為空的 records。
- 分子：`current_status in ("interview", "offer")`
- 公式：`interview_applications / submitted_applications`
- 用途：衡量履歷和 screening 後轉進面試階段的效率。

## Rejection Rate

- 定義：已投遞且目前狀態為 `rejected` 的比例。
- 分母：`applied_at` 不為空的 records。
- 分子：`current_status = "rejected"`
- 公式：`rejected_applications / submitted_applications`
- 用途：觀察 pipeline 中已關閉但未成功的比例。

## Offer Rate

- 定義：已投遞且目前狀態為 `offer` 的比例。
- 分母：`applied_at` 不為空的 records。
- 分子：`current_status = "offer"`
- 公式：`offer_applications / submitted_applications`
- 用途：衡量整體投遞到 offer 的轉換結果。

## Average Waiting Days

- 定義：仍在進行中的 records 在目前階段等待的平均天數。
- 範圍：`current_status in ("saved", "applied", "screening", "interview")`
- 單筆等待天數：`today - current_stage_started_at`
- 公式：`average(waiting_days for active_applications)`
- 用途：找出需要 follow-up 或優先處理的 application。

## Funnel

Funnel chart 使用階段累積概念：

- Applied：`applied_at` 不為空。
- Response：狀態為 `screening`、`interview`、`offer` 或 `rejected`。
- Interview：狀態為 `interview` 或 `offer`。
- Offer：狀態為 `offer`。

這種定義可讓圖表呈現從投遞到結果的轉換漏斗。
