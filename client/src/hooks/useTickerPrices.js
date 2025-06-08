import { useQuery } from "@tanstack/react-query";
import axios from "../features/axiosConfig";

export const useTickerPrices = () => {
  return useQuery({
    queryKey: ["tickerPrices"],
    queryFn: async () => {
      const res = await axios.get("/prices/tickers");
      return res.data;
    },
    refetchInterval: 10000, // כל 10 שניות אוטומטית
    staleTime: 5000,
  });
};
