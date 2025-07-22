import { useMutation } from "@tanstack/react-query";
import { runBacktest } from "../services/backtestService";

export const useBacktest = () => {
  return useMutation({ mutationFn: runBacktest });
};
