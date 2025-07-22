/**import React, { useState } from "react";
import BacktestForm from "../components/BacktestForm";
import BacktestChart from "../components/BacktestChart";

const BacktestPage = () => {
  const [result, setResult] = useState(null);

  return (
    <div>
      <h2>Backtesting Real-Time + Visualization</h2>
      <BacktestForm onResult={setResult} />
      {result && <BacktestChart chartData={result.chartData} />}
    </div>
  );
};

export default BacktestPage;
**/