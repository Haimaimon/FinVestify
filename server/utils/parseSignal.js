function parseSignal(message) {
  const assetMatch = message.match(/🔔([A-Z/]+)🔔/);
  const direction = message.match(/Direction:\s*(BUY|SELL)/);
  const entry = message.match(/Entry Price:\s*([\d.]+)/);

  const tpMatches = [...message.matchAll(/TP\d+\s+([\d.]+)/g)];
  const tps = tpMatches.map(m => parseFloat(m[1])).filter(n => !isNaN(n));
  const slMatch = message.match(/SL\s*[:\s]*([\d.]+)/);
  const stopLoss = slMatch ? parseFloat(slMatch[1]) : null;

  let takeProfit = null;

  if (!assetMatch || !direction || !entry) return null;

  const dir = direction[1];
  const entryPrice = parseFloat(entry[1]);

  if (dir === "BUY") {
    const validTps = tps.filter(tp => tp > entryPrice);
    takeProfit = validTps.length ? Math.min(...validTps) : null;
  } else if (dir === "SELL") {
    const validTps = tps.filter(tp => tp < entryPrice);
    takeProfit = validTps.length ? Math.max(...validTps) : null;
  }

  return {
    asset: assetMatch[1],
    direction: dir,
    entry: entryPrice,
    takeProfit,
    stopLoss
  };
}

module.exports = { parseSignal };