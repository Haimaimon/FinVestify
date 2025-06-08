import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

const BacktestChart = ({ chartData }) => {
  const chartRef = useRef();

  useEffect(() => {
    if (!chartData || chartData.length === 0) return;

    // מיון הנתונים לפי זמן וסינון כפילויות
    const cleanData = [...chartData]
      .filter((d, i, arr) => i === 0 || d.time !== arr[i - 1].time)
      .sort((a, b) => a.time - b.time);

    const chart = createChart(chartRef.current, {
      width: 800,
      height: 400,
      layout: {
        backgroundColor: "#ffffff",
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#eee" },
        horzLines: { color: "#eee" },
      },
    });

    const lineSeries = chart.addLineSeries({ color: "#2196f3" });
    lineSeries.setData(cleanData.map(d => ({ time: d.time, value: d.value })));

    // 🎯 הוספת סימוני כניסה/יציאה אם קיימים
    const markers = cleanData
      .filter(d => d.marker === "entry" || d.marker === "exit")
      .map(d => ({
        time: d.time,
        position: d.marker === "entry" ? "belowBar" : "aboveBar",
        color: d.marker === "entry" ? "green" : "red",
        shape: d.marker === "entry" ? "arrowUp" : "arrowDown",
        text: d.marker.toUpperCase() + ` @ ${d.value.toFixed(2)}`,
      }));

    lineSeries.setMarkers(markers);

    return () => chart.remove();
  }, [chartData]);

  return <div ref={chartRef} />;
};

export default BacktestChart;
