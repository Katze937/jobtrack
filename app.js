const DATA_URL = "./data/sample_applications.json";
const STORAGE_KEY = "jobtrack.public-demo.applications.v2";
const LEGACY_STORAGE_KEY = "jobtrack.public-demo.applications.v1";

const STATUS_CONFIG = [
  { id: "saved", label: "Saved", color: "#6b625c" },
  { id: "applied", label: "Applied", color: "#2563eb" },
  { id: "screening", label: "Screening", color: "#0f766e" },
  { id: "interview", label: "Interview", color: "#6d28d9" },
  { id: "offer", label: "Offer", color: "#15803d" },
  { id: "rejected", label: "Rejected", color: "#b91c1c" },
  { id: "withdrawn", label: "Withdrawn", color: "#7c2d12" }
];

const ACTIVE_STATUSES = new Set(["saved", "applied", "screening", "interview"]);
const PENDING_STATUSES = new Set(["applied", "screening", "interview"]);
const TERMINAL_STATUSES = new Set(["offer", "rejected", "withdrawn"]);
const RESPONDED_STATUSES = new Set(["screening", "interview", "offer", "rejected"]);
const INTERVIEW_STATUSES = new Set(["interview", "offer"]);

const STATUS_DETECTION_RULES = [
  {
    status: "rejected",
    keywords: [
      "unfortunately",
      "decline",
      "declined",
      "declining",
      "not move forward",
      "not to move forward",
      "not moving forward",
      "decided not to move forward",
      "decided not to proceed",
      "not proceed with your application",
      "not be proceeding",
      "will not be moving forward",
      "will not move forward",
      "will not proceed",
      "unable to proceed",
      "unable to offer",
      "not selected",
      "not chosen",
      "not successful",
      "no longer under consideration",
      "pursue other candidates",
      "other applicant",
      "other candidates",
      "position has been filled",
      "filled this position",
      "regret",
      "reject",
      "rejected"
    ]
  },
  {
    status: "offer",
    keywords: [
      "offer letter",
      "employment offer",
      "extend an offer",
      "pleased to offer",
      "would like to offer",
      "congratulations",
      "offer"
    ]
  },
  {
    status: "withdrawn",
    keywords: ["withdraw your application", "application withdrawn", "withdrawn", "withdraw"]
  },
  {
    status: "interview",
    keywords: [
      "invite you to interview",
      "schedule an interview",
      "technical interview",
      "technical screen",
      "next round",
      "interview"
    ]
  },
  {
    status: "screening",
    keywords: ["screening call", "phone screen", "recruiter screen", "initial call", "screening"]
  }
];

const COMPANY_EXTRACTION_PATTERNS = [
  /(?:role|position|job|application)\s+(?:at|with)\s+([A-Z][A-Za-z0-9&'’ -]{1,70})(?=[.!?,\n]|$)/i,
  /(?:applied|applying)\s+(?:to|for).{0,90}\s+at\s+([A-Z][A-Za-z0-9&'’ -]{1,70})(?=[.!?,\n]|$)/i,
  /(?:from|by)\s+([A-Z][A-Za-z0-9&'’ -]{1,70})\s+(?:recruiting|talent|careers|hiring)\s+team/i,
  /(?:at|with)\s+([A-Z][A-Za-z0-9&'’ -]{1,70})\s+(?:recruiting|talent|careers|hiring)\s+team/i,
  /^([A-Z][A-Za-z0-9&'’ -]{1,70})\s+(?:recruiting|talent|careers|hiring)\s+team\b/im,
  /^the\s+([A-Z][A-Za-z0-9&'’ -]{1,70})\s+(?:recruiting|talent|careers|hiring)\s+team\b/im,
  /kind regards,?\s*\n+\s*([A-Z][A-Za-z0-9&'’ -]{1,70})\s*$/i,
  /best regards,?\s*\n+\s*([A-Z][A-Za-z0-9&'’ -]{1,70})\s*$/i,
  /sincerely,?\s*\n+\s*([A-Z][A-Za-z0-9&'’ -]{1,70})\s*$/i
];

const state = {
  applications: [],
  charts: {},
  loadedFromStorage: false,
  syncingKanbanScroll: false
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    state.applications = await loadApplications();
    initializePage();
  } catch (error) {
    renderLoadError(error);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function initializePage() {
  const page = document.body.dataset.page;

  if (page === "tracker") {
    initializeTrackerPage();
    return;
  }

  if (page === "analytics") {
    initializeAnalyticsPage();
  }
}

async function loadApplications() {
  const savedApplications =
    localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);

  if (savedApplications) {
    state.loadedFromStorage = true;
    const parsed = JSON.parse(savedApplications);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed, null, 2));
    return parsed;
  }

  state.loadedFromStorage = false;
  return fetchOriginalApplications();
}

async function fetchOriginalApplications() {
  const response = await fetch(DATA_URL, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load ${DATA_URL}`);
  }

  return response.json();
}

async function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  state.loadedFromStorage = false;
  state.applications = await fetchOriginalApplications();

  if (document.body.dataset.page === "tracker") {
    document.querySelector("#applicationForm").reset();
    document.querySelector("#pasteUpdateForm").reset();
    resetParserResult();
    populateStatusSelect(document.querySelector("#currentStatus"), "applied");
    renderTracker();
    return;
  }

  renderAnalytics();
}

function initializeTrackerPage() {
  const formStatus = document.querySelector("#currentStatus");
  const resetButton = document.querySelector("#resetDemoButton");
  const applicationForm = document.querySelector("#applicationForm");
  const pasteUpdateForm = document.querySelector("#pasteUpdateForm");
  const editForm = document.querySelector("#editApplicationForm");
  const modal = document.querySelector("#editModal");

  populateStatusSelect(formStatus, "applied");
  resetButton.addEventListener("click", resetDemo);
  applicationForm.addEventListener("submit", handleApplicationSubmit);
  pasteUpdateForm.addEventListener("submit", handlePasteUpdateSubmit);
  editForm.addEventListener("submit", handleEditSubmit);
  document.querySelector("#closeEditModal").addEventListener("click", closeEditModal);
  document.querySelector("#cancelEditModal").addEventListener("click", closeEditModal);
  document.querySelector("#editSourceUrl").addEventListener("input", (event) => {
    updateSourceLink(event.target.value);
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeEditModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeEditModal();
    }
  });

  renderTracker();
}

function initializeAnalyticsPage() {
  renderAnalytics();
}

function renderTracker() {
  renderTrackerSummary();
  populatePasteUpdateTargets();
  renderKanban();
  renderSaveState();
  setupKanbanScrollSync();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderAnalytics() {
  renderOverview();
  renderKpis();
  renderPendingAlerts();
  renderCharts();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function handleApplicationSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const today = toIsoDate(new Date());
  const status = formData.get("current_status");
  const appliedAt = formData.get("applied_at") || (status === "saved" ? null : today);
  const application = {
    application_id: createApplicationId(),
    company_name: formData.get("company_name").trim(),
    position_title: formData.get("position_title").trim(),
    department: "Demo Entry",
    job_level: "Unspecified",
    employment_type: "Full-time",
    location: "Unspecified",
    work_mode: "Hybrid",
    platform: formData.get("platform"),
    source_url: normalizeUrl(formData.get("source_url")),
    saved_at: today,
    applied_at: appliedAt,
    current_status: status,
    current_stage_started_at: appliedAt || today,
    last_updated_at: today,
    priority: formData.get("priority"),
    salary_min_twd: 0,
    salary_max_twd: 0,
    recruiter_contacted: false,
    notes: formData.get("notes").trim() || "New demo application."
  };

  state.applications.unshift(application);
  persistApplications();
  form.reset();
  populateStatusSelect(document.querySelector("#currentStatus"), "applied");
  renderTracker();
}

function handleEditSubmit(event) {
  event.preventDefault();

  const applicationId = document.querySelector("#editApplicationId").value;
  updateApplication(applicationId, {
    company_name: document.querySelector("#editCompanyName").value.trim(),
    position_title: document.querySelector("#editPositionTitle").value.trim(),
    source_url: normalizeUrl(document.querySelector("#editSourceUrl").value),
    platform: document.querySelector("#editPlatform").value,
    current_status: document.querySelector("#editCurrentStatus").value,
    priority: document.querySelector("#editPriority").value,
    applied_at: document.querySelector("#editAppliedAt").value || null,
    notes: document.querySelector("#editNotes").value.trim() || "No notes."
  });
  closeEditModal();
}

function handlePasteUpdateSubmit(event) {
  event.preventDefault();

  const textArea = document.querySelector("#pasteUpdateText");
  const targetSelect = document.querySelector("#pasteUpdateTarget");
  const result = document.querySelector("#parserResult");
  const parsed = parseStatusUpdate(textArea.value, targetSelect.value);

  if (!parsed.status) {
    result.textContent =
      "Could not detect a status. Try text with declined, rejected, offer, interview, or withdrawn wording.";
    result.className = "parser-result parser-warning";
    return;
  }

  if (!parsed.application) {
    const companyText = parsed.detectedCompany ? ` for ${parsed.detectedCompany}` : "";
    result.textContent = `Detected ${getStatusLabel(parsed.status)}${companyText}, but no matching application record exists. Add it first or choose a target application from the dropdown.`;
    result.className = "parser-result parser-warning";
    return;
  }

  updateApplication(parsed.application.application_id, {
    current_status: parsed.status,
    notes: appendStatusNote(parsed.application.notes, parsed.status)
  });
  textArea.value = "";
  targetSelect.value = "";
  result.textContent = `Updated ${parsed.application.company_name} to ${getStatusLabel(parsed.status)}.`;
  result.className = "parser-result parser-success";
}

function resetParserResult() {
  const result = document.querySelector("#parserResult");

  if (!result) {
    return;
  }

  result.textContent = "Matches company names and status keywords locally.";
  result.className = "parser-result";
}

function createApplicationId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `APP-DEMO-${timestamp}`;
}

function parseStatusUpdate(rawText, selectedApplicationId = "") {
  const text = rawText.trim().toLowerCase();
  const detectedCompany = extractCompanyFromText(rawText);
  const application = selectedApplicationId
    ? state.applications.find((item) => item.application_id === selectedApplicationId)
    : findApplicationInText(rawText, detectedCompany);

  return {
    application,
    detectedCompany,
    status: detectStatusFromText(text)
  };
}

function findApplicationInText(rawText, detectedCompany = "") {
  const normalizedText = normalizeForMatch(rawText);
  const normalizedCompany = normalizeForMatch(detectedCompany);
  const sortedApplications = [...state.applications].sort(
    (a, b) => b.company_name.length - a.company_name.length
  );

  if (normalizedCompany) {
    return sortedApplications.find((application) => {
      const company = normalizeForMatch(application.company_name);
      return (
        company &&
        (company === normalizedCompany ||
          company.includes(normalizedCompany) ||
          normalizedCompany.includes(company))
      );
    });
  }

  const companyMatch = sortedApplications.find((application) => {
    const company = normalizeForMatch(application.company_name);
    return company && normalizedText.includes(company);
  });

  if (companyMatch) {
    return companyMatch;
  }

  const titleMatches = sortedApplications.filter((application) => {
    const title = normalizeForMatch(application.position_title);
    return title && normalizedText.includes(title);
  });

  return titleMatches.length === 1 ? titleMatches[0] : undefined;
}

function extractCompanyFromText(rawText) {
  const text = String(rawText || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  for (const pattern of COMPANY_EXTRACTION_PATTERNS) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanCompanyCandidate(match[1]);
    }
  }

  return "";
}

function cleanCompanyCandidate(value) {
  return String(value || "")
    .replace(/^the\s+/i, "")
    .replace(/\s+(team|talent team|recruiting team|careers team|hiring team|careers)$/i, "")
    .replace(/[.,!?:;]+$/g, "")
    .trim();
}

function detectStatusFromText(text) {
  const normalizedText = String(text || "").toLowerCase();
  const matchedRule = STATUS_DETECTION_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedText.includes(keyword))
  );

  return matchedRule?.status || "";
}

function appendStatusNote(existingNotes, status) {
  const today = toIsoDate(new Date());
  const note = `Parsed update on ${today}: status changed to ${getStatusLabel(status)}.`;
  return existingNotes ? `${existingNotes}\n${note}` : note;
}

function renderTrackerSummary() {
  const total = document.querySelector("#trackerTotal");
  const active = document.querySelector("#trackerActive");

  total.textContent = state.applications.length;
  active.textContent = state.applications.filter((application) =>
    ACTIVE_STATUSES.has(application.current_status)
  ).length;
}

function renderOverview() {
  const pending = getPendingApplications();
  const total = state.applications.length;
  const active = state.applications.filter((application) =>
    ACTIVE_STATUSES.has(application.current_status)
  ).length;
  const pending14 = pending.filter((item) => item.waitingDays >= 14).length;
  const pending30 = pending.filter((item) => item.waitingDays >= 30).length;
  const kpis = calculateKpis(state.applications);
  const followUpPhrase = formatCountNoun(pending14, "follow-up");
  const activePhrase = formatCountNoun(active, "active opportunity", "active opportunities");
  const pending30Phrase = formatCountNoun(pending30, "application");

  setText("#overviewTotal", total);
  setText("#overviewActive", active);
  setText("#overviewPending14", pending14);
  setText("#overviewPending30", pending30);
  setText(
    "#summaryHeadline",
    pending14
      ? `${followUpPhrase} ${pending14 === 1 ? "needs" : "need"} attention across ${activePhrase}`
      : `${activePhrase} with no overdue follow-ups`
  );
  setText(
    "#summarySubcopy",
    pending30
      ? `${pending30Phrase} ${pending30 === 1 ? "is" : "are"} pending 30 days or more. Current response rate is ${formatPercent(
          kpis.responseRate
        )}, with ${formatPercent(kpis.offerRate)} reaching offer.`
      : `Response rate is ${formatPercent(
          kpis.responseRate
        )}, offer rate is ${formatPercent(kpis.offerRate)}, and no application is pending 30 days or more.`
  );
}

function renderKpis() {
  const kpis = calculateKpis(state.applications);

  setText("#kpiTotal", kpis.total);
  setText("#kpiResponseRate", formatPercent(kpis.responseRate));
  setText("#kpiInterviewRate", formatPercent(kpis.interviewRate));
  setText("#kpiRejectionRate", formatPercent(kpis.rejectionRate));
  setText("#kpiOfferRate", formatPercent(kpis.offerRate));
  setText("#kpiWaitingDays", kpis.averageWaitingDays);
}

function calculateKpis(applications) {
  const total = applications.length;
  const submittedApplications = applications.filter((application) => application.applied_at);
  const denominator = submittedApplications.length || total || 1;
  const responded = submittedApplications.filter((application) =>
    RESPONDED_STATUSES.has(application.current_status)
  ).length;
  const interviewed = submittedApplications.filter((application) =>
    INTERVIEW_STATUSES.has(application.current_status)
  ).length;
  const rejected = submittedApplications.filter(
    (application) => application.current_status === "rejected"
  ).length;
  const offered = submittedApplications.filter(
    (application) => application.current_status === "offer"
  ).length;
  const activeApplications = applications.filter((application) =>
    ACTIVE_STATUSES.has(application.current_status)
  );
  const waitingDays = activeApplications.map((application) =>
    daysBetween(application.current_stage_started_at, new Date())
  );

  return {
    total,
    responseRate: responded / denominator,
    interviewRate: interviewed / denominator,
    rejectionRate: rejected / denominator,
    offerRate: offered / denominator,
    averageWaitingDays: waitingDays.length
      ? Math.round(waitingDays.reduce((sum, days) => sum + days, 0) / waitingDays.length)
      : 0
  };
}

function renderPendingAlerts() {
  const alertList = document.querySelector("#pendingAlertList");
  const alerts = getPendingApplications().filter((application) => application.waitingDays >= 14);

  alertList.replaceChildren();

  if (!alerts.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No pending applications over 14 days.";
    alertList.append(empty);
    return;
  }

  alerts.forEach((application) => {
    const alert = document.createElement("article");
    alert.className = `pending-alert ${
      application.waitingDays >= 30 ? "alert-critical" : "alert-warning"
    }`;
    alert.innerHTML = `
      <div>
        <span class="alert-badge">${application.waitingDays >= 30 ? "30d+" : "14d+"}</span>
        <h3>${escapeHtml(application.position_title)}</h3>
        <p>${escapeHtml(application.company_name)} · ${getStatusLabel(application.current_status)}</p>
      </div>
      <strong>${application.waitingDays} days</strong>
    `;
    alertList.append(alert);
  });
}

function getPendingApplications() {
  return state.applications
    .filter((application) => PENDING_STATUSES.has(application.current_status))
    .map((application) => ({
      ...application,
      waitingDays: daysBetween(application.current_stage_started_at, new Date())
    }))
    .sort((a, b) => b.waitingDays - a.waitingDays);
}

function renderCharts() {
  if (!window.Chart) {
    return;
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          color: "#3f3a35",
          font: { weight: "700" }
        }
      }
    }
  };

  renderWeeklyChart(chartOptions);
  renderPlatformChart(chartOptions);
  renderFunnelChart(chartOptions);
}

function renderWeeklyChart(baseOptions) {
  const weeklyCounts = state.applications
    .filter((application) => application.applied_at)
    .reduce((counts, application) => {
      const label = getWeekLabel(application.applied_at);
      counts[label] ||= { applications: 0, responses: 0 };
      counts[label].applications += 1;

      if (RESPONDED_STATUSES.has(application.current_status)) {
        counts[label].responses += 1;
      }

      return counts;
    }, {});
  const labels = Object.keys(weeklyCounts).sort();
  const applications = labels.map((label) => weeklyCounts[label].applications);
  const responseRates = labels.map((label) =>
    Math.round((weeklyCounts[label].responses / weeklyCounts[label].applications) * 100)
  );

  upsertChart(
    "weeklyChart",
    "bar",
    {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Applications",
          data: applications,
          backgroundColor: "rgba(37, 99, 235, 0.78)",
          borderColor: "#2563eb",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y"
        },
        {
          type: "line",
          label: "Response Rate",
          data: responseRates,
          borderColor: "#0f766e",
          backgroundColor: "#0f766e",
          tension: 0.32,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "y1"
        }
      ]
    },
    {
      ...baseOptions,
      scales: getMixedScaleOptions()
    }
  );
}

function renderPlatformChart(baseOptions) {
  const platformCounts = state.applications.reduce((counts, application) => {
    counts[application.platform] = (counts[application.platform] || 0) + 1;
    return counts;
  }, {});
  const labels = Object.keys(platformCounts).sort();
  const data = labels.map((label) => platformCounts[label]);

  upsertChart(
    "platformChart",
    "bar",
    {
      labels,
      datasets: [
        {
          label: "Records",
          data,
          backgroundColor: "#d68f35",
          borderRadius: 6
        }
      ]
    },
    {
      ...baseOptions,
      scales: getLinearScaleOptions()
    }
  );
}

function renderFunnelChart(baseOptions) {
  const submitted = state.applications.filter((application) => application.applied_at);
  const labels = ["Applied", "Response", "Interview", "Offer"];
  const data = [
    submitted.length,
    submitted.filter((application) => RESPONDED_STATUSES.has(application.current_status)).length,
    submitted.filter((application) => INTERVIEW_STATUSES.has(application.current_status)).length,
    submitted.filter((application) => application.current_status === "offer").length
  ];

  upsertChart(
    "funnelChart",
    "bar",
    {
      labels,
      datasets: [
        {
          label: "Applications",
          data,
          backgroundColor: ["#2563eb", "#0f766e", "#6d28d9", "#15803d"],
          borderRadius: 6
        }
      ]
    },
    {
      ...baseOptions,
      indexAxis: "y",
      scales: getLinearScaleOptions()
    }
  );
}

function upsertChart(canvasId, type, data, options) {
  const canvas = document.querySelector(`#${canvasId}`);

  if (!canvas) {
    return;
  }

  if (state.charts[canvasId]) {
    state.charts[canvasId].data = data;
    state.charts[canvasId].options = options;
    state.charts[canvasId].update();
    return;
  }

  state.charts[canvasId] = new Chart(canvas, {
    type,
    data,
    options
  });
}

function getLinearScaleOptions() {
  return {
    x: {
      ticks: { precision: 0, color: "#6b625c", font: { weight: "700" } },
      grid: { color: "rgba(221, 216, 206, 0.65)" }
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: "#6b625c", font: { weight: "700" } },
      grid: { color: "rgba(221, 216, 206, 0.65)" }
    }
  };
}

function getMixedScaleOptions() {
  return {
    x: {
      ticks: { color: "#6b625c", font: { weight: "700" } },
      grid: { color: "rgba(221, 216, 206, 0.58)" }
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0, color: "#6b625c", font: { weight: "700" } },
      grid: { color: "rgba(221, 216, 206, 0.65)" },
      title: {
        display: true,
        text: "Applications",
        color: "#6b625c",
        font: { weight: "800" }
      }
    },
    y1: {
      beginAtZero: true,
      max: 100,
      position: "right",
      ticks: {
        color: "#6b625c",
        font: { weight: "700" },
        callback: (value) => `${value}%`
      },
      grid: { drawOnChartArea: false },
      title: {
        display: true,
        text: "Response rate",
        color: "#6b625c",
        font: { weight: "800" }
      }
    }
  };
}

function renderKanban() {
  const kanbanBoard = document.querySelector("#kanbanBoard");
  const columnTemplate = document.querySelector("#kanbanColumnTemplate");

  kanbanBoard.replaceChildren();

  STATUS_CONFIG.forEach((status) => {
    const columnFragment = columnTemplate.content.cloneNode(true);
    const column = columnFragment.querySelector(".kanban-column");
    const list = columnFragment.querySelector(".card-list");
    const statusDot = columnFragment.querySelector(".status-dot");
    const title = columnFragment.querySelector("h3");
    const count = columnFragment.querySelector(".column-count");
    const cards = state.applications.filter(
      (application) => application.current_status === status.id
    );

    column.dataset.status = status.id;
    list.dataset.status = status.id;
    statusDot.style.backgroundColor = status.color;
    title.textContent = status.label;
    count.textContent = cards.length;

    cards.forEach((application) => {
      list.append(createApplicationCard(application));
    });

    if (!cards.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = "No records";
      list.append(emptyState);
    }

    attachDropHandlers(list);
    kanbanBoard.append(columnFragment);
  });
}

function setupKanbanScrollSync() {
  const topScroll = document.querySelector("#kanbanTopScroll");
  const topContent = document.querySelector("#kanbanTopScrollContent");
  const scrollArea = document.querySelector("#kanbanScrollArea");
  const kanbanBoard = document.querySelector("#kanbanBoard");

  if (!topScroll || !topContent || !scrollArea || !kanbanBoard) {
    return;
  }

  topContent.style.width = `${kanbanBoard.scrollWidth}px`;
  topScroll.scrollLeft = scrollArea.scrollLeft;

  topScroll.onscroll = () => {
    if (state.syncingKanbanScroll) {
      return;
    }

    state.syncingKanbanScroll = true;
    scrollArea.scrollLeft = topScroll.scrollLeft;
    state.syncingKanbanScroll = false;
  };

  scrollArea.onscroll = () => {
    if (state.syncingKanbanScroll) {
      return;
    }

    state.syncingKanbanScroll = true;
    topScroll.scrollLeft = scrollArea.scrollLeft;
    state.syncingKanbanScroll = false;
  };

  window.requestAnimationFrame(() => {
    topContent.style.width = `${kanbanBoard.scrollWidth}px`;
  });
}

function createApplicationCard(application) {
  const cardTemplate = document.querySelector("#applicationCardTemplate");
  const cardFragment = cardTemplate.content.cloneNode(true);
  const card = cardFragment.querySelector(".application-card");
  const days = cardFragment.querySelector(".stage-days");

  card.dataset.applicationId = application.application_id;
  card.setAttribute("aria-label", `Edit ${application.position_title} at ${application.company_name}`);
  card.tabIndex = 0;
  card.querySelector("h4").textContent = application.position_title;
  card.querySelector(".company-name").textContent = application.company_name;
  days.textContent = `${getApplicationDisplayDays(application)}d`;

  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);
  card.addEventListener("click", () => {
    if (card.dataset.wasDragged === "true") {
      return;
    }

    openEditModal(application.application_id);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEditModal(application.application_id);
    }
  });

  return cardFragment;
}

function openEditModal(applicationId) {
  const application = state.applications.find((item) => item.application_id === applicationId);
  const modal = document.querySelector("#editModal");

  if (!application) {
    return;
  }

  document.querySelector("#editApplicationId").value = application.application_id;
  document.querySelector("#editCompanyName").value = application.company_name;
  document.querySelector("#editPositionTitle").value = application.position_title;
  document.querySelector("#editSourceUrl").value = application.source_url || "";
  document.querySelector("#editPlatform").value = application.platform;
  document.querySelector("#editPriority").value = application.priority;
  document.querySelector("#editAppliedAt").value = application.applied_at || "";
  document.querySelector("#editNotes").value = application.notes;
  populateStatusSelect(document.querySelector("#editCurrentStatus"), application.current_status);
  updateSourceLink(application.source_url);

  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector("#editCompanyName").focus();
}

function closeEditModal() {
  const modal = document.querySelector("#editModal");
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function updateSourceLink(sourceUrl) {
  const sourceLink = document.querySelector("#editSourceLink");
  const normalizedUrl = normalizeUrl(sourceUrl);

  if (!normalizedUrl) {
    sourceLink.removeAttribute("href");
    sourceLink.setAttribute("aria-disabled", "true");
    sourceLink.classList.add("is-disabled");
    return;
  }

  sourceLink.href = normalizedUrl;
  sourceLink.removeAttribute("aria-disabled");
  sourceLink.classList.remove("is-disabled");
}

function attachDropHandlers(list) {
  list.addEventListener("dragover", (event) => {
    event.preventDefault();
    list.classList.add("is-over");
  });

  list.addEventListener("dragleave", () => {
    list.classList.remove("is-over");
  });

  list.addEventListener("drop", (event) => {
    event.preventDefault();
    list.classList.remove("is-over");

    const applicationId = event.dataTransfer.getData("text/plain");
    updateApplication(applicationId, { current_status: list.dataset.status });
  });
}

function handleDragStart(event) {
  event.currentTarget.classList.add("is-dragging");
  event.currentTarget.dataset.wasDragged = "true";
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", event.currentTarget.dataset.applicationId);
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("is-dragging");
  window.setTimeout(() => {
    delete event.currentTarget.dataset.wasDragged;
  }, 0);
}

function updateApplication(applicationId, updates) {
  const application = state.applications.find(
    (item) => item.application_id === applicationId
  );

  if (!application) {
    return;
  }

  const today = toIsoDate(new Date());
  const statusChanged =
    updates.current_status && updates.current_status !== application.current_status;

  if (statusChanged) {
    application.current_status = updates.current_status;
    application.current_stage_started_at = today;

    if (updates.current_status !== "saved" && !application.applied_at) {
      application.applied_at = today;
    }
  }

  ["company_name", "position_title", "platform", "priority", "source_url"].forEach((field) => {
    if (typeof updates[field] === "string") {
      application[field] = updates[field];
    }
  });

  if ("applied_at" in updates) {
    application.applied_at = updates.applied_at;

    if (application.current_status !== "saved" && !application.applied_at) {
      application.applied_at = today;
    }
  }

  if (typeof updates.notes === "string") {
    application.notes = updates.notes;
  }

  application.last_updated_at = today;
  persistApplications();
  renderTracker();
}

function populateStatusSelect(select, selectedStatus) {
  select.replaceChildren();

  STATUS_CONFIG.forEach((status) => {
    const option = document.createElement("option");
    option.value = status.id;
    option.textContent = status.label;
    option.selected = status.id === selectedStatus;
    select.append(option);
  });
}

function populatePasteUpdateTargets() {
  const select = document.querySelector("#pasteUpdateTarget");

  if (!select) {
    return;
  }

  const selectedValue = select.value;
  select.replaceChildren();

  const autoOption = document.createElement("option");
  autoOption.value = "";
  autoOption.textContent = "Auto-detect from message";
  select.append(autoOption);

  state.applications.forEach((application) => {
    const option = document.createElement("option");
    option.value = application.application_id;
    option.textContent = `${application.company_name} - ${application.position_title}`;
    option.selected = application.application_id === selectedValue;
    select.append(option);
  });
}

function persistApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.applications, null, 2));
  state.loadedFromStorage = true;
}

function renderSaveState() {
  const saveIndicator = document.querySelector("#saveIndicator");

  saveIndicator.textContent = state.loadedFromStorage
    ? "Saved to localStorage"
    : "Loaded from demo data";
}

function daysBetween(startDate, endDate) {
  if (!startDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(endDate);
  const difference = end - start;
  const dayInMilliseconds = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor(difference / dayInMilliseconds));
}

function getApplicationDisplayDays(application) {
  if (TERMINAL_STATUSES.has(application.current_status)) {
    const startDate =
      application.applied_at || application.saved_at || application.current_stage_started_at;
    const endDate = application.current_stage_started_at;
    return daysBetween(startDate, endDate);
  }

  return daysBetween(application.current_stage_started_at, new Date());
}

function getWeekLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const monday = new Date(date);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  return toIsoDate(monday);
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatCountNoun(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function normalizeUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function normalizeForMatch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function getStatusLabel(statusId) {
  return STATUS_CONFIG.find((status) => status.id === statusId)?.label || statusId;
}

function setText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = value;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderLoadError(error) {
  const message = document.createElement("div");
  message.className = "load-error";
  message.textContent =
    "Demo data could not be loaded. Start a local server from the project folder and open it through http://localhost.";
  document.body.prepend(message);
  console.error(error);
}
