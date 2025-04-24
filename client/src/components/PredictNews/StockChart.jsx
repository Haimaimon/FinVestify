import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import './Pre.css';

const StockChart = ({ data, stockName }) => {
  const chartContainerRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) {
      console.error("No valid data for chart rendering");
      return;
    }

    const uniqueSortedData = [...new Map(data.map(item => [item.time, item])).values()]
      .sort((a, b) => a.time - b.time);

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        backgroundColor: "#ffffff",
        textColor: "#000000",
      },
      grid: {
        vertLines: { color: "#eeeeee" },
        horzLines: { color: "#eeeeee" },
      },
      crosshair: { mode: 0 },
      priceScale: { borderColor: "#cccccc" },
      timeScale: { borderColor: "#cccccc" },
    });

    const priceSeries = chart.addLineSeries({
      color: "rgba(38, 198, 218, 1)",
      lineWidth: 2,
    });

    priceSeries.setData(uniqueSortedData.map(point => ({
      time: point.time,
      value: point.Close,
    })));

    const markers = uniqueSortedData.map(point => ({
      time: point.time,
      position: "aboveBar",
      shape: point.Indicator === "👍" ? "arrowUp" : point.Indicator === "👎" ? "arrowDown" : "circle",
      color: point.priceChange > 0 ? "green" : "red",
      text: point.Indicator,
    }));

    priceSeries.setMarkers(markers);

    // Tooltip יצירת
    tooltipRef.current = document.createElement('div');
    Object.assign(tooltipRef.current.style, {
      position: 'absolute',
      display: 'none',
      backgroundColor: 'rgba(0,0,0,0.75)',
      color: 'white',
      padding: '8px',
      borderRadius: '4px',
      zIndex: 1000,
      fontSize: '12px',
      pointerEvents: 'none',
    });

    chartContainerRef.current.appendChild(tooltipRef.current);

    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData.has(priceSeries)) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const point = uniqueSortedData.find(p => p.time === param.time);
      if (!point) return;

      const date = new Date(point.time * 1000);
      tooltipRef.current.innerHTML = `
        <strong>Date:</strong> ${date.toLocaleDateString()}<br/>
        <strong>Close:</strong> $${point.Close?.toFixed(2)}<br/>
        <strong>Change:</strong> ${point.priceChange?.toFixed(2)}%<br/>
        <strong>Sentiment:</strong> ${point.Indicator}
      `;

      const { x, y } = param.point;
      tooltipRef.current.style.left = x + 20 + "px";
      tooltipRef.current.style.top = y + 20 + "px";
      tooltipRef.current.style.display = 'block';
    });

    return () => {
      chart.remove();
    };
  }, [data]);

  return (
    <div>
      <h3>{stockName} - Price History with Sentiment & Trends</h3>
      <div ref={chartContainerRef} className="chart-container" />
      <div style={{ marginTop: "20px", textAlign: "left", fontSize: "0.95rem", color: "#555" }}>
        <h4>Legend:</h4>
        <p>🔴 Red Circle – News article with <strong>Negative</strong> sentiment.</p>
        <p>🔻 Red Arrow – <strong>Mismatch</strong> between sentiment and price.</p>
        <p>🟢 Green Circle – Positive sentiment with upward price confirmation.</p>
        <p style={{ fontSize: "0.95rem", marginTop: "1rem", color: "#666" }}>
  💡 <strong>Tooltip Explanation:</strong>  
        When you hover over a specific point on the graph, you'll see a box showing:
        <ul>
          <li><strong>Date</strong> – The specific day in the chart</li>
          <li><strong>Close</strong> – The stock's closing price on that day</li>
          <li><strong>Change</strong> – The percentage change from the previous day</li>
          <li><strong>Sentiment</strong> – The AI-evaluated sentiment based on related news articles</li>
        </ul>
        This helps you understand whether the market reacted in alignment with the news sentiment.
      </p>
      </div>
    </div>
  );
};

export default StockChart;