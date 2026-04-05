const fs = require("fs");
const fetch = require("node-fetch");

const FILE = "./data/solana-history.json";

async function fetchSolana() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=solana"
  );
  const data = await res.json();
  const sol = data[0];

  return {
    price: sol.current_price,
    volume: sol.total_volume,
    market_cap: sol.market_cap,
    timestamp: new Date().toISOString()
  };
}

function calculateSignal(prev, current) {
  const change = ((current.price - prev.price) / prev.price) * 100;

  let signal = "neutral";
  if (change > 1) signal = "bullish";
  if (change < -1) signal = "bearish";

  return {
    change_1h: change,
    signal
  };
}

async function main() {
  const newData = await fetchSolana();

  let history = [];

  if (fs.existsSync(FILE)) {
    history = JSON.parse(fs.readFileSync(FILE));
  }

  let enrichedData = {
    ...newData,
    change_1h: null,
    signal: "neutral"
  };

  if (history.length > 0) {
    const prev = history[history.length - 1];
    const analysis = calculateSignal(prev, newData);

    enrichedData = {
      ...enrichedData,
      ...analysis
    };
  }

  history.push(enrichedData);

  if (history.length > 500) {
    history = history.slice(-500);
  }

  fs.writeFileSync(FILE, JSON.stringify(history, null, 2));

  console.log("Updated:", enrichedData);
}

main();