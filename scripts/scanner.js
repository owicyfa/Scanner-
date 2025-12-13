require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const ALCHEMY_URL = process.env.ALCHEMY_URL;
const timestamp = new Date().toISOString().split('T')[0];

// Uniswap V2 query
const V2_QUERY = `{
  pairs(first: 30, orderBy: reserveUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    reserveUSD
  }
}`;

// Uniswap V3 query
const V3_QUERY = `{
  pools(first: 30, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    feeTier
    totalValueLockedUSD
  }
}`;

async function scanProtocols() {
  console.log('🔍 Starting DeFi oracle scanner (V2 + V3)...\n');
  const vulnerable = [];
  
  // Scan Uniswap V2
  console.log('📊 Scanning Uniswap V2...');
  const v2Response = await axios.post(
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
    { query: V2_QUERY }
  );
  
  for (const pair of v2Response.data.data.pairs) {
    console.log(`  V2: ${pair.token0.symbol}/${pair.token1.symbol} - $${Math.round(pair.reserveUSD).toLocaleString()}`);
    if (pair.reserveUSD > 500000) {
      vulnerable.push({
        version: 'V2',
        address: pair.id,
        pair: `${pair.token0.symbol}/${pair.token1.symbol}`,
        tvl: pair.reserveUSD,
        risk: 'HIGH - Uses getReserves() spot price'
      });
    }
  }
  
  // Scan Uniswap V3
  console.log('\n📊 Scanning Uniswap V3...');
  const v3Response = await axios.post(
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    { query: V3_QUERY }
  );
  
  for (const pool of v3Response.data.data.pools) {
    console.log(`  V3: ${pool.token0.symbol}/${pool.token1.symbol} (${pool.feeTier/10000}%) - $${Math.round(pool.totalValueLockedUSD).toLocaleString()}`);
    if (pool.totalValueLockedUSD > 500000) {
      vulnerable.push({
        version: 'V3',
        address: pool.id,
        pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        feeTier: `${pool.feeTier/10000}%`,
        tvl: pool.totalValueLockedUSD,
        risk: 'CRITICAL - Uses slot0() spot price'
      });
    }
  }
  
  // Save findings
  fs.writeFileSync(
    `findings/scan_${timestamp}.json`,
    JSON.stringify(vulnerable, null, 2)
  );
  
  console.log(`\n✅ Found ${vulnerable.length} high-value targets (V2 + V3)`);
  console.log(`📁 Results: findings/scan_${timestamp}.json`);
}

scanProtocols().catch(console.error);
