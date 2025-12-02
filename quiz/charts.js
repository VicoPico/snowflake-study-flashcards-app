// quiz/charts.js
import { dom } from "../ui/dom.js";

let barChart = null;
let donutChart = null;

// Snowflake-ish palette
const COLOR_PRIMARY = "#4a7eea"; // main Snowflake blue
const COLOR_PRIMARY_LIGHT = "rgba(74, 126, 234, 0.25)";
const COLOR_ACCENT = "#ff9f40"; // contrast orange
const COLOR_ACCENT_LIGHT = "rgba(255, 159, 64, 0.25)";
const COLOR_GRID_LIGHT = "#e1e6ef";
const COLOR_GRID_DARK = "#3a4050";

// Split a long topic label into multiple lines for the x-axis
function splitLabelForChart(label) {
  if (!label) return "";

  // Short labels stay single-line
  if (label.length <= 16) {
    return label;
  }

  // If it contains " & ", break there to keep it readable
  if (label.includes(" & ")) {
    const parts = label.split(" & ");
    const first = parts[0];
    const rest = parts.slice(1).join(" & ");
    return [first, `& ${rest}`];
  }

  // General case: split by words into ~2 lines of similar length
  const words = label.split(" ");
  if (words.length === 1) {
    // No spaces at all, just chop roughly in half
    const mid = Math.floor(label.length / 2);
    return [label.slice(0, mid), label.slice(mid)];
  }

  const target = Math.ceil(label.length / 2);
  let line1 = "";
  let line2 = "";

  for (const w of words) {
    const candidate = (line1 ? line1 + " " : "") + w;
    if (candidate.length <= target || !line1) {
      line1 = candidate;
    } else {
      line2 = (line2 ? line2 + " " : "") + w;
    }
  }

  return line2 ? [line1, line2] : line1;
}

// Create or update charts from per-topic stats
export function renderTopicCharts(perTopicStats) {
  if (!dom.scoreCharts) return;

  const entries = Object.entries(perTopicStats || {});
  if (!entries.length) {
    dom.scoreCharts.innerHTML = "";
    return;
  }

  // Sort topics alphabetically for a stable chart
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b));

  const labels = [];
  const correctPct = [];
  const incorrectPct = [];

  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const [topic, stats] of sorted) {
    const total = stats.total || 0;
    const corr = stats.correct || 0;

    labels.push(topic);
    if (total > 0) {
      const pct = (corr / total) * 100;
      const rounded = Math.round(pct);
      correctPct.push(rounded);
      incorrectPct.push(Math.max(0, 100 - rounded));
    } else {
      correctPct.push(0);
      incorrectPct.push(0);
    }

    totalCorrect += corr;
    totalQuestions += total;
  }

  if (!totalQuestions) {
    dom.scoreCharts.innerHTML = "";
    return;
  }

  const overallPct = Math.round((totalCorrect / totalQuestions) * 100);
  const overallIncorrect = Math.max(0, 100 - overallPct);

  // Build chart card HTML
  dom.scoreCharts.innerHTML = `
    <div class="card shadow-sm score-charts-card">
      <div class="card-body pb-4">
        <h3 class="card-title mb-2 text-center">Accuracy by Topic</h3>
        <p class="small text-muted mb-3 text-center">
          Topic performance and overall score.
        </p>

        <div class="score-charts-row">
          <div class="chart-wrapper">
            <h6 class="small text-muted text-center mb-1">
              Accuracy by Topic (in %)
            </h6>
            <canvas id="topicBarChart"></canvas>
          </div>

          <div class="chart-wrapper">
            <h6 class="small text-muted text-center mb-1">
              Overall Score
            </h6>
            <canvas id="topicDonutChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  const barCtx = document.getElementById("topicBarChart");
  const donutCtx = document.getElementById("topicDonutChart");
  if (!barCtx || !donutCtx || !window.Chart) return;

  // Destroy old charts if they exist
  if (barChart) {
    barChart.destroy();
    barChart = null;
  }
  if (donutChart) {
    donutChart.destroy();
    donutChart = null;
  }

  const isDark = document.body.classList.contains("dark-mode");
  const gridColor = isDark ? COLOR_GRID_DARK : COLOR_GRID_LIGHT;
  const tickColor = isDark ? "#a2abbf" : "#495057";

  const tooManyLabels = labels.length > 6 || window.innerWidth < 900;

  // ---- Stacked bar chart: correct vs incorrect % per topic ----
  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Correct %",
          data: correctPct,
          backgroundColor: COLOR_PRIMARY_LIGHT,
          borderColor: COLOR_PRIMARY,
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          label: "Incorrect %",
          data: incorrectPct,
          backgroundColor: COLOR_ACCENT_LIGHT,
          borderColor: COLOR_ACCENT,
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { bottom: 24 }, // a bit of room for bottom legend
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: tickColor,
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            callback: function (value, index) {
              const label = this.getLabelForValue(value);
              const base = splitLabelForChart(label);

              // On crowded charts, hide every other label to reduce overlap
              if (!tooManyLabels) return base;
              return index % 2 === 0 ? base : "";
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            color: tickColor,
            callback: (val) => `${val}%`,
          },
          grid: {
            color: gridColor,
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: tickColor,
            boxWidth: 14,
            padding: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
          },
        },
      },
    },
  });

  // ---- Donut chart: overall score ----
  donutChart = new Chart(donutCtx, {
    type: "doughnut",
    data: {
      labels: ["Correct", "Incorrect"],
      datasets: [
        {
          data: [overallPct, overallIncorrect],
          // Use same Snowflake blue as bar chart for "Correct"
          backgroundColor: [COLOR_PRIMARY_LIGHT, COLOR_ACCENT_LIGHT],
          borderColor: [COLOR_PRIMARY, COLOR_ACCENT],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: tickColor,
            boxWidth: 14,
            padding: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    },
  });
}

// Clear charts (used when starting a new session or switching mode)
export function clearTopicCharts() {
  if (barChart) {
    barChart.destroy();
    barChart = null;
  }
  if (donutChart) {
    donutChart.destroy();
    donutChart = null;
  }

  if (dom.scoreCharts) {
    dom.scoreCharts.innerHTML = "";
  }
}
