"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Data Visualizer — interactive charts using Chart.js loaded from CDN.
 * Supports bar, line, pie, doughnut, radar, and scatter charts.
 */

declare global {
  interface Window {
    Chart?: new (...args: any[]) => any;
  }
}

type ChartType = "bar" | "line" | "pie" | "doughnut" | "radar" | "scatter";

interface ChartConfig {
  type: ChartType;
  label: string;
}

const CHARTS: ChartConfig[] = [
  { type: "bar", label: "Bar Chart" },
  { type: "line", label: "Line Chart" },
  { type: "pie", label: "Pie Chart" },
  { type: "doughnut", label: "Doughnut" },
  { type: "radar", label: "Radar" },
  { type: "scatter", label: "Scatter" },
];

const COLORS = [
  "rgba(59, 130, 246, 0.8)",
  "rgba(16, 185, 129, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(239, 68, 68, 0.8)",
  "rgba(139, 92, 246, 0.8)",
  "rgba(236, 72, 153, 0.8)",
  "rgba(6, 182, 212, 0.8)",
  "rgba(249, 115, 22, 0.8)",
];

const BORDER_COLORS = COLORS.map((c) => c.replace("0.8", "1"));

function getChartData(type: ChartType) {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const data = [65, 59, 80, 81, 56, 55, 40, 72];

  switch (type) {
    case "bar":
    case "line":
      return {
        labels,
        datasets: [
          {
            label: "Revenue ($K)",
            data,
            backgroundColor: type === "bar" ? COLORS.slice(0, 8) : "rgba(59, 130, 246, 0.2)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 2,
            fill: type === "line",
            tension: 0.4,
          },
          {
            label: "Expenses ($K)",
            data: [28, 48, 40, 19, 36, 27, 25, 35],
            backgroundColor: type === "bar" ? COLORS.slice(0, 8).map((c) => c.replace("0.8", "0.5")) : "rgba(239, 68, 68, 0.2)",
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 2,
            fill: type === "line",
            tension: 0.4,
          },
        ],
      };
    case "pie":
    case "doughnut":
      return {
        labels: ["React", "Vue", "Angular", "Svelte", "Solid", "Others"],
        datasets: [
          {
            data: [35, 22, 18, 12, 8, 5],
            backgroundColor: COLORS.slice(0, 6),
            borderColor: BORDER_COLORS.slice(0, 6),
            borderWidth: 2,
          },
        ],
      };
    case "radar":
      return {
        labels: ["JavaScript", "Python", "Rust", "Go", "TypeScript", "C++"],
        datasets: [
          {
            label: "Proficiency",
            data: [90, 75, 60, 55, 85, 45],
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(59, 130, 246, 1)",
          },
          {
            label: "Interest",
            data: [80, 85, 90, 70, 75, 50],
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(16, 185, 129, 1)",
          },
        ],
      };
    case "scatter":
      return {
        datasets: [
          {
            label: "Frontend",
            data: Array.from({ length: 20 }, () => ({
              x: Math.random() * 100,
              y: Math.random() * 100,
            })),
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
          },
          {
            label: "Backend",
            data: Array.from({ length: 20 }, () => ({
              x: Math.random() * 100,
              y: Math.random() * 100,
            })),
            backgroundColor: "rgba(239, 68, 68, 0.6)",
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 1,
          },
        ],
      };
    default:
      return { labels: [], datasets: [] };
  }
}

export default function ChartApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const [activeChart, setActiveChart] = useState<ChartType>("bar");
  const [status, setStatus] = useState("Loading Chart.js…");

  useEffect(() => {
    if (window.Chart) {
      setStatus("Ready");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js";
    script.onload = () => setStatus("Ready");
    script.onerror = () => setStatus("Failed to load Chart.js");
    document.head.appendChild(script);
  }, []);

  const renderChart = useCallback(() => {
    if (!canvasRef.current || !window.Chart) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chartData = getChartData(activeChart);

    chartRef.current = new window.Chart(ctx, {
      type: activeChart,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#c0c0e0",
              font: { family: "-apple-system, sans-serif", size: 12 },
            },
          },
          title: {
            display: true,
            text: CHARTS.find((c) => c.type === activeChart)?.label ?? "Chart",
            color: "#e0e0e0",
            font: { family: "-apple-system, sans-serif", size: 14, weight: "bold" },
          },
        },
        scales:
          activeChart === "pie" || activeChart === "doughnut" || activeChart === "radar"
            ? undefined
            : {
                x: {
                  ticks: { color: "#8888aa" },
                  grid: { color: "rgba(255,255,255,0.06)" },
                },
                y: {
                  ticks: { color: "#8888aa" },
                  grid: { color: "rgba(255,255,255,0.06)" },
                },
              },
      },
    });
  }, [activeChart]);

  useEffect(() => {
    const timer = setTimeout(renderChart, 100);
    return () => clearTimeout(timer);
  }, [renderChart, status]);

  return (
    <div className={styles.chartApp}>
      <div className={styles.pgliteToolbar}>
        <BarChart3 size={12} />
        <span className={styles.pgliteStatus}>{status}</span>
      </div>

      {/* Chart type selector */}
      <div className={styles.chartTypeBar}>
        {CHARTS.map((c) => (
          <button
            key={c.type}
            className={`${styles.chartTypeBtn} ${activeChart === c.type ? styles.chartTypeBtnActive : ""}`}
            onClick={() => setActiveChart(c.type)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className={styles.chartCanvas}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
