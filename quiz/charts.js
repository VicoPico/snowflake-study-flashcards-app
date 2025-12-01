// quiz/charts.js
import { dom } from "../ui/dom.js";

let stackedChart = null;
let donutChart = null;

export function renderTopicCharts(perTopicStats) {
  if (!dom.scoreCharts) return;

  const entries = Object.entries(perTopicStats || {});
  if (!entries.length) {
    dom.scoreCharts.innerHTML = "";
    return;
  }

  // --- Build basic aggregates ---
  const labels = entries.map(([topic]) => topic);
  const correctCounts = entries.map(([_, stats]) => stats.correct || 0);
  const totals = entries.map(([_, stats]) => stats.total || 0);

  const correctPct = totals.map((t, idx) =>
    t > 0 ? Math.round((correctCounts[idx] / t) * 100) : 0
  );
  const incorrectPct = totals.map((t, idx) => 100 - correctPct[idx]);

  const totalCorrect = correctCounts.reduce((a, b) => a + b, 0);
  const totalQuestions = totals.reduce((a, b) => a + b, 0);
  const totalIncorrect = Math.max(totalQuestions - totalCorrect, 0);

  // --- Inject the card + canvases ---
  dom.scoreCharts.innerHTML = `
    <div class="card shadow-sm score-charts-card">
      <div class="card-body">
        <h6 class="card-title mb-1">Performance by topic</h6>
        <p class="small text-muted mb-3">
          Visual breakdown of your answers in this session.
        </p>

        <div class="score-charts-row">
          <div class="chart-wrapper">
            <p class="small text-muted mb-2 chart-title">
              Correct vs incorrect (% per topic)
            </p>
            <canvas id="stackedTopicChart"></canvas>
          </div>

          <div class="chart-wrapper donut-wrapper">
            <p class="small text-muted mb-2 chart-title">
              Overall correctness
            </p>
            <canvas id="sessionDonutChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  const isDark = document.body && document.body.classList.contains("dark-mode");

  const blue = "#4a7eea"; // Snowflake-ish blue
  const grey = isDark ? "#c0c6d3" : "#a2abbf"; // neutral grey
  const axisColor = isDark ? "#a2abbf" : "#6c757d";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "#e5e9f2";

  const stackedCtx = document
    .getElementById("stackedTopicChart")
    .getContext("2d");
  const donutCtx = document
    .getElementById("sessionDonutChart")
    .getContext("2d");

  // Destroy old charts if they exist
  if (stackedChart) stackedChart.destroy();
  if (donutChart) donutChart.destroy();

  // --- Stacked bar: Correct vs Incorrect % per topic ---
  stackedChart = new Chart(stackedCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Correct %",
          data: correctPct,
          backgroundColor: blue,
          borderRadius: 4,
          stack: "pct",
        },
        {
          label: "Incorrect %",
          data: incorrectPct,
          backgroundColor: grey,
          borderRadius: 4,
          stack: "pct",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: axisColor,
            boxWidth: 14,
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}%`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: axisColor,
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 10, // smaller so long labels stay inside the chart
            },
            padding: 4,
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
            color: axisColor,
            stepSize: 20,
            callback: (value) => `${value}%`,
          },
          grid: {
            color: gridColor,
          },
        },
      },
    },
  });

  // --- Donut: overall correct vs incorrect ---
  donutChart = new Chart(donutCtx, {
    type: "doughnut",
    data: {
      labels: ["Correct", "Incorrect"],
      datasets: [
        {
          data: [totalCorrect, totalIncorrect],
          backgroundColor: [blue, grey],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%", // keeps the donut visually lighter / smaller
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: axisColor,
            boxWidth: 14,
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.raw || 0;
              const pct =
                totalQuestions > 0
                  ? Math.round((value / totalQuestions) * 100)
                  : 0;
              return `${ctx.label}: ${value} (${pct}%)`;
            },
          },
        },
      },
      layout: {
        padding: {
          top: 8,
          bottom: 8,
        },
      },
    },
  });
}
