exports.formatChartData = (data, trades) => {
  return data.map((candle) => ({
    time: new Date(candle.datetime).getTime() / 1000,
    value: parseFloat(candle.close),
    marker: trades.find((t) => t.time === candle.datetime)
      ? trades.find((t) => t.time === candle.datetime).type
      : null,
  }));
};
