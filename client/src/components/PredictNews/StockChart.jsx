import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import './Pre.css';

const StockChart = ({ data, stockName }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) {
      console.error("No valid data for chart rendering");
      return;
    }
    console.log("Original Chart Data:", data);
  
    // הסרת כפילויות ומיון בסדר עולה לפי time
    const uniqueSortedData = [...new Map(data.map(item => [item.time, item])).values()]
      .sort((a, b) => a.time - b.time);
  
    console.log("Unique and Sorted Chart Data:", uniqueSortedData);
  
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        backgroundColor: "#ffffff",
        textColor: "#000000",
      },
      grid: {
        vertLines: {
          color: "#eeeeee",
        },
        horzLines: {
          color: "#eeeeee",
        },
      },
      crosshair: {
        mode: 0,
      },
      priceScale: {
        borderColor: "#cccccc",
      },
      timeScale: {
        borderColor: "#cccccc",
      },
    });
  
    const priceSeries = chart.addLineSeries({
      color: "rgba(38, 198, 218, 1)",
      lineWidth: 2,
    });
  
    // הגדרת הנתונים לגרף
    priceSeries.setData(
      uniqueSortedData.map((point) => ({
        time: point.time, // UNIX timestamp
        value: point.Close,
      }))
    );
  
    const markers = uniqueSortedData.map((point) => ({
      time: point.time,
      position: "aboveBar",
      shape: point.Indicator === "👍" ? "arrowUp" : point.Indicator === "👎" ? "arrowDown" : "circle",
      color: point.priceChange > 0 ? "green" : "red",
      text: point.Indicator,
    }));
  
    priceSeries.setMarkers(markers);
  
    return () => {
      chart.remove();
    };
  }, [data]);
  

  return (
    <div>
      <h3>{stockName} - Price History with Sentiment & Trends</h3>
      <div ref={chartContainerRef} className="chart-container" />
    </div>
  );
};

export default StockChart;
