# JobTrack Data Dictionary

`sample_applications.json` 是公開 demo 的唯一資料來源。資料皆為假資料，不包含真實公司聯絡資訊、個人資料或實際求職紀錄。

| Field | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| `application_id` | string | yes | Application 的唯一識別碼。 | `APP-2026-001` |
| `company_name` | string | yes | 假公司名稱。 | `Northstar Analytics` |
| `position_title` | string | yes | 職缺名稱。 | `Frontend Engineer` |
| `department` | string | yes | 職缺部門或職能。 | `Product Engineering` |
| `job_level` | string | yes | 職級分類。 | `Mid-level` |
| `employment_type` | string | yes | 工作型態。 | `Full-time` |
| `location` | string | yes | 職缺地點。 | `Taipei, Taiwan` |
| `work_mode` | string | yes | 遠端、混合或現場。 | `Hybrid` |
| `platform` | string | yes | 找到職缺或投遞的平台。 | `LinkedIn` |
| `source_url` | string | no | LinkedIn、公司官網或其他原始投遞/職缺頁連結。 | `https://www.linkedin.com/jobs/view/...` |
| `saved_at` | date string | yes | 第一次儲存職缺的日期。 | `2026-08-01` |
| `applied_at` | date string/null | no | 正式投遞日期。`saved` 狀態可為 `null`。 | `2026-08-06` |
| `current_status` | enum | yes | Kanban 目前狀態。 | `interview` |
| `current_stage_started_at` | date string | yes | 進入目前狀態的日期。拖拉卡片後會更新。 | `2026-10-07` |
| `last_updated_at` | date string | yes | 最後更新日期。拖拉卡片後會更新。 | `2026-10-07` |
| `priority` | enum | yes | Demo 中的主觀優先級。 | `high` |
| `salary_min_twd` | integer | yes | 假薪資範圍下限，單位 TWD/year。 | `950000` |
| `salary_max_twd` | integer | yes | 假薪資範圍上限，單位 TWD/year。 | `1300000` |
| `recruiter_contacted` | boolean | yes | 是否已有 recruiter contact。 | `true` |
| `notes` | string | yes | 非敏感備註。 | `Technical interview scheduled.` |

## Status Values

| Status | Meaning |
| --- | --- |
| `saved` | 尚未投遞，先存入追蹤清單。 |
| `applied` | 已投遞，等待第一個回覆。 |
| `screening` | 已進入 recruiter 或 HR screening。 |
| `interview` | 已進入面試或技術評估流程。 |
| `offer` | 已收到 offer 或進入 offer discussion。 |
| `rejected` | 已被拒絕或職缺關閉。 |
| `withdrawn` | 主動退出流程。 |

## Privacy Notes

- 不儲存真實履歷、真實聯絡人、email、電話或面試內容。
- `localStorage` 僅存在使用者自己的瀏覽器，不會上傳到伺服器。
- 公開部署時只包含假資料、前端程式碼與說明文件。
