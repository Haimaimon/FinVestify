import React, { useState, useRef } from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";
import StrategyForm from "./StrategyForm";
import StrategyChart from "./StrategyChart";
import StrategyResults from "./StrategyResults";
import { useStrategyTrade } from "../../../hooks/useStrategyTrade";

const StrategyTrade = () => {
  const chartRef = useRef();
  const [params, setParams] = useState(null);
  const { runStrategyTest, data, isLoading, error } = useStrategyTrade();

  const handleRun = (formParams) => {
    setParams(formParams);
    runStrategyTest({ params: formParams });
  };

  return (
    <Paper elevation={4} sx={{ maxWidth: "900px", m: "auto", p: 4, bgcolor: "#f9f9f9" }}>
      <Typography variant="h4" gutterBottom>Strategy Trade</Typography>
      <Divider sx={{ mb: 3 }} />

      <StrategyForm onRun={handleRun} isLoading={isLoading} />

      {data?.strategyResult && <StrategyResults results={data.strategyResult} />}
      {data?.chartData && (
        <Box mt={4}>
          <StrategyChart chartRef={chartRef} rawData={data.chartData} strategyData={data.strategyResult} />
        </Box>
      )}
    </Paper>
  );
};

export default StrategyTrade;
