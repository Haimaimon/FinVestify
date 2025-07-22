import { useMutation, useQueryClient } from "@tanstack/react-query";
import { testStrategy, fetchStockData } from "../services/strategyService";

export const useStrategyTrade = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ params }) => {
      const strategyResult = await testStrategy(params);
      const chartData = await fetchStockData({
        ticker: params.ticker,
        period: params.period,
        interval: params.interval,
      });
      return { strategyResult, chartData };
    }
  });

  return {
    runStrategyTest: mutation.mutate,
    isLoading: mutation.isLoading,
    data: mutation.data,
    error: mutation.error,
  };
};
