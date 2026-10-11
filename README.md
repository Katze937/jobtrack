# JobTrack Public Demo

JobTrack is a portfolio-ready public demo that shows how a real job-search workflow can be translated into a structured data model, interactive workflow tracking, KPI definitions, and dashboard analytics.

The project is intentionally privacy-aware. It uses fake application records only and does not store or process real job-search data on a server.

This is not a React project. It is a static `HTML + CSS + JavaScript` application, which keeps the demo easy to run locally and simple to deploy on Cloudflare Pages without a build step.

## Features

- 26 sample application records
- Multi-page structure:
  - `Tracker` for adding, editing, and updating application records
  - `Analytics` for KPI summaries, charts, and follow-up alerts
- Add application records with company, role, platform, status, priority, notes, and application URL
- Store LinkedIn, company career page, or other posting links for later follow-up
- Import job posting or application screenshots with browser-side OCR that fills the Add Application form for review
- Click a Kanban card to open an edit modal
- HTML5 drag-and-drop Kanban workflow
- Workflow statuses:
  - `Saved`
  - `Applied`
  - `Screening`
  - `Interview`
  - `Offer`
  - `Rejected`
  - `Withdrawn`
- Automatic updates after drag-and-drop:
  - `current_status`
  - `current_stage_started_at`
  - `last_updated_at`
  - KPI calculations
  - charts
  - `localStorage`
- Smart Import parser for pasted text, full emails, dropped images, and uploaded screenshots
- OCR-assisted parsing for company, position, platform, status, source URL, and notes
- Case-insensitive company matching for pasted email updates
- Terminal statuses stop the day count at the date the record becomes `offer`, `rejected`, or `withdrawn`
- Analytics dashboard with:
  - pipeline snapshot
  - response rate
  - interview rate
  - rejection rate
  - offer rate
  - average waiting days
  - pending 14-day and 30-day alerts
  - combined weekly applications and response-rate chart
  - platform distribution chart
  - funnel chart
- Reset Demo button to restore the original sample data
- Responsive layout for desktop and mobile

## Tech Stack

- HTML
- CSS
- JavaScript
- Chart.js
- Tesseract.js
- Browser `localStorage`
- Static JSON sample data

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

Each application record represents one job opportunity. The core fields are:

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

The full data dictionary is available in `docs/data_dictionary.md`. A SQL schema draft is available in `docs/schema.sql`.

## KPI Definitions

The Analytics page calculates KPIs in `app.js` from the current browser-side dataset.

- Total Applications: all demo application records
- Response Rate: submitted applications that reached `screening`, `interview`, `offer`, or `rejected`
- Interview Rate: submitted applications that reached `interview` or `offer`
- Rejection Rate: submitted applications currently marked as `rejected`
- Offer Rate: submitted applications currently marked as `offer`
- Average Waiting Days: average number of days active records have spent in their current stage
- Pending 14d+: active applications waiting at least 14 days
- Pending 30d+: active applications waiting at least 30 days

Detailed KPI definitions are available in `docs/kpi_definitions.md`.

## Analytics Dashboard

The Analytics page is designed as a compact dashboard rather than a long report page.

- Pipeline Snapshot combines the main workflow counts and conversion rates.
- Pending Alerts highlights applications that may need follow-up.
- Average Waiting Days is shown inside the follow-up area because it is directly related to pending records.
- Weekly Applications + Response Rate combines a bar chart and a line chart:
  - bars show weekly application volume
  - the line shows response rate for each weekly cohort
- Platform Distribution shows where applications were submitted.
- Funnel shows how records move from applied to response, interview, and offer.

## Smart Import Detection Rules

The Smart Import feature is rule-based and local-only. It does not call an API and does not send email content or screenshots to a server.

The shared Smart Import box can handle:

- pasted rejection, offer, interview, screening, or withdrawn emails
- pasted job posting text
- pasted, dropped, or uploaded screenshots

Text is parsed directly. Images are read in the browser with Tesseract.js, then the recognized text is placed into the same Smart Import box and analyzed by the same rules.

To support more companies and message styles, update these arrays in `app.js`:

- `STATUS_DETECTION_RULES`: add wording that should map to `rejected`, `offer`, `withdrawn`, `interview`, or `screening`
- `COMPANY_EXTRACTION_PATTERNS`: add regular expressions for company-name formats that appear in email bodies or signatures

Examples:

- Add rejection wording such as `not selected`, `not successful`, or `pursue other candidates` under the `rejected` rule.
- Add signature formats such as `The Example Co. Recruiting Team` to `COMPANY_EXTRACTION_PATTERNS`.

Company matching is case-insensitive, so `PolicyMe`, `policyme`, and `POLICYME` are treated as the same company when matching existing records.

If an email does not include a clear company name, the user can choose a target application manually from the Smart Import dropdown.

## Screenshot OCR Import

The Tracker page includes screenshot support inside Smart Import. Users can upload, drag-and-drop, or paste an image of a job posting or application confirmation into the shared input flow.

The OCR flow:

1. Reads the image text in the browser with Tesseract.js.
2. Places recognized text into the Smart Import box.
3. Updates a matched existing record if the text is a status update.
4. Otherwise extracts likely company, position, platform, status, source URL, and notes.
5. Fills the Add Application form for review before the user creates a record.

The OCR feature is intentionally review-first. It does not automatically create a record because screenshots can be noisy and OCR may misread company names or job titles.

## Privacy Design

This public demo is designed to avoid real personal or job-search data.

- All companies, job titles, links, salary ranges, and notes are sample data.
- The project does not include real names, email addresses, phone numbers, resumes, interview content, or internal company information.
- Changes made in the demo are saved only in the user's browser through `localStorage`.
- Screenshot OCR runs in the browser and is used to fill the form for review.
- The Reset Demo button clears the demo state and reloads `data/sample_applications.json`.
- No backend API is required for the public version.

## Run Locally

Because the demo uses `fetch()` to load the JSON sample data, run it through a local server instead of opening `index.html` directly.

```bash
cd jobtrack
npx --yes http-server . -p 8000
```

Then open:

```text
http://localhost:8000
```

Pages:

- `http://localhost:8000/index.html`: Tracker page for adding and updating application records
- `http://localhost:8000/analytics.html`: Analytics page for KPIs, charts, and pending alerts

If port `8000` is already in use, choose another port:

```bash
npx --yes http-server . -p 8001
```

If Python is available, this also works:

```bash
python -m http.server 8000
```

## Deploy to Cloudflare Pages

This is a static website and does not require a build step.

1. Push the project folder to a GitHub repository.
2. Open the Cloudflare dashboard.
3. Go to Workers & Pages.
4. Create a Pages project.
5. Choose Import an existing Git repository.
6. Select the GitHub repository.
7. Set the production branch to `main`.
8. Choose `None` for the framework preset, or leave the framework unset.
9. Leave the build command empty. If Cloudflare requires a command, use `exit 0`.
10. Set the build output directory to `/` or the repository root.
11. Deploy the project.

After deployment, Cloudflare Pages provides a `*.pages.dev` URL. Future pushes to the selected GitHub branch automatically trigger new deployments.

Cloudflare references:

- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/build-configuration/

## Portfolio Usage

This demo can be presented as a project page in a personal portfolio or linked from a portfolio project section.

Suggested portfolio talking points:

- Designed a structured data model for a real job-application workflow
- Built an interactive Kanban tracker with drag-and-drop state updates
- Defined KPI logic for response rate, interview rate, rejection rate, offer rate, and waiting days
- Created a dashboard that combines workflow status, follow-up risk, trend analysis, source distribution, and funnel analysis
- Added browser-side OCR import to demonstrate practical automation without a custom backend
- Implemented a privacy-aware public demo using fake data and browser-local storage
- Prepared a static deployment path for GitHub and Cloudflare Pages

## Future Enhancements

Possible next versions:

- Add filters for status, platform, job type, and date range
- Add search by company or position
- Export the current demo state as JSON
- Add simulated status-history records
- Add an optional project case-study page for portfolio presentation
- Add a read-only data table below the dashboard charts
