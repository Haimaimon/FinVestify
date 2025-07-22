// utils/parseMessage.js

/**
 * Parses a trading message and extracts relevant signal data
 * @param {string} message - The input message from user
 * @returns {object|null} parsed signal object or null if invalid
 */
export function parseMessage(message) {
  const assetMatch = message.match(/🔔([A-Z/]+)🔔/);
  const direction = message.match(/Direction:\s*(BUY|SELL)/);
  const entry = message.match(/Entry Price:\s*([\d.]+)/);

  const tpMatches = [...message.matchAll(/TP\d+\s+([\d.]+)/g)];
  const tps = tpMatches.map(m => parseFloat(m[1])).filter(n => !isNaN(n));

  const slMatch = message.match(/SL\s*[:\s]*([\d.]+)/);
  const stopLoss = slMatch ? parseFloat(slMatch[1]) : null;

  if (!assetMatch || !direction || !entry) return null;

  const entryPrice = parseFloat(entry[1]);
  const dir = direction[1];

  let takeProfit = null;
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
