import React, { useEffect } from "react";
import { createChart } from "lightweight-charts";

const StrategyChart = ({ chartRef, rawData, strategyData }) => {
  useEffect(() => {
    if (!rawData || !rawData.prices || !rawData.dates) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chartElement = document.getElementById("chart-container");
    chartRef.current = createChart(chartElement, {
      width: 800,
      height: 400,
      layout: {
        backgroundColor: "#ffffff",
        textColor: "#333333",
      },
      grid: {
        vertLines: { color: "#e0e0e0" },
        horzLines: { color: "#e0e0e0" },
      },
    });

    const lineSeries = chartRef.current.addLineSeries({ color: "#2196f3" });

    const chartData = rawData.dates.map((date, index) => ({
      time: Math.floor(new Date(date).getTime() / 1000),
      value: rawData.prices[index],
    })).sort((a, b) => a.time - b.time);

    lineSeries.setData(chartData);

    // Add markers from strategy result
    if (strategyData?.positions) {
      const markers = strategyData.positions.map((pos) => ({
        time: Math.floor(new Date(pos.date).getTime() / 1000),
        position: pos.type === "buy" ? "belowBar" : "aboveBar",
        color: pos.type === "buy" ? "green" : "red",
        shape: pos.type === "buy" ? "arrowUp" : "arrowDown",
        text: `${pos.type.toUpperCase()} @ ${pos.price.toFixed(2)}`,
      }));
      lineSeries.setMarkers(markers);
    }

    // Draw indicator line if exists
    if (strategyData?.indicator_data) {
      const indicatorSeries = chartRef.current.addLineSeries({
        color: strategyData.indicator === "macd" ? "blue" : "purple",
      });
      const indicatorData = strategyData.indicator_data.map((point) => ({
        time: Math.floor(new Date(point.date).getTime() / 1000),
        value: point.value,
      }));
      indicatorSeries.setData(indicatorData);
    }

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [rawData, strategyData]);

  return <div id="chart-container" style={{ width: "100%", height: 400 }} />;
};

export default StrategyChart;
