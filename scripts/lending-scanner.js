require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');

const ALCHEMY_URL = process.env.ALCHEMY_URL;
const timestamp = new Date().toISOString().split('T')[0];

// Target: Lending protocols and their oracle contracts
const TARGETS = [
  {
    protocol: 'Aave V2',
    type: 'Lending',
    oracle: '0xA50ba011c48153De246E5192C8f9258A2ba79Ca9',
    method: 'getAssetPrice(address)',
    assets: [
      { name: 'WETH', addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { name: 'WBTC', addr: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
      { name: 'USDC', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
      { name: 'DAI', addr: '0x6B175474E89094C44Da98b954EedeAC495271d0F' }
    ]
  },
  {
    protocol: 'Aave V3',
    type: 'Lending',
    oracle: '0x54586bE62E3c3580375aE3723C145253060Ca0C2',
    method: 'getAssetPrice(address)',
    assets: [
      { name: 'WETH', addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { name: 'WBTC', addr: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
      { name: 'LINK', addr: '0x514910771AF9Ca656af840dff83E8264EcF986CA' }
    ]
  },
  {
    protocol: 'Compound V2',
    type: 'Lending',
    oracle: '0x50ce56A3239671Ab62f185704Caedf626352741e',
    method: 'getUnderlyingPrice(address)',
    assets: [
      { name: 'cETH', addr: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5' },
      { name: 'cWBTC', addr: '0xccF4429DB6322D5C611ee964527D42E5d685DD6a' },
      { name: 'cUSDC', addr: '0x39AA39c021dfbaE8faC545936693aC917d5E7563' },
      { name: 'cDAI', addr: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643' }
    ]
  },
  {
    protocol: 'Euler Finance',
    type: 'Lending',
    oracle: '0x1891783cb3497Fdad1F25C933225243c2c7c4102',
    method: 'getPrice(address)',
    assets: [
      { name: 'WETH', addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { name: 'USDC', addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }
    ]
  },
  {
    protocol: 'Alpha Homora V2',
    type: 'Leveraged Farming',
    oracle: '0x1887118E49e0F4A78Bd71B792a49dE03504A764D',
    method: 'getPrice(address)',
    assets: [
      { name: 'WETH', addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { name: 'SUSHI', addr: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2' }
    ]
  }
];

async function checkOracle(target, asset) {
  return new Promise((resolve) => {
    const cmd = `cast call ${target.oracle} "${target.method}" ${asset.addr} --rpc-url ${ALCHEMY_URL} 2>&1`;
    
    exec(cmd, (error, stdout) => {
      if (error || stdout.includes('revert') || !stdout.trim()) {
        resolve({ 
          protocol: target.protocol,
          type: target.type,
          asset: asset.name, 
          status: 'FAILED', 
          risk: 'UNKNOWN' 
        });
        return;
      }
      
      const price = stdout.trim();
      resolve({
        protocol: target.protocol,
        type: target.type,
        asset: asset.name,
        oracle: target.oracle,
        price: price,
        status: 'ACTIVE',
        risk: 'NEEDS_INSPECTION',
        note: 'Manual check required: Review oracle source for getReserves() or slot0() calls'
      });
    });
  });
}

async function scan() {
  console.log('🔍 Scanning Lending Protocol Oracles...\n');
  const results = [];
  let total = TARGETS.reduce((sum, t) => sum + t.assets.length, 0);
  let current = 0;
  
  for (const target of TARGETS) {
    console.log(`📊 ${target.protocol} (${target.type})`);
    
    for (const asset of target.assets) {
      current++;
      console.log(`  [${current}/${total}] ${asset.name}...`);
      const result = await checkOracle(target, asset);
      results.push(result);
      
      if (result.status === 'ACTIVE') {
        console.log(`    ✓ Oracle active`);
      } else {
        console.log(`    ✗ ${result.status}`);
      }
    }
    console.log('');
  }
  
  const active = results.filter(r => r.status === 'ACTIVE');
  
  fs.writeFileSync(
    `findings/lending_scan_${timestamp}.json`,
    JSON.stringify(results, null, 2)
  );
  
  console.log(`✅ Scan Complete!`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Active: ${active.length}`);
  console.log(`   📁 findings/lending_scan_${timestamp}.json`);
  console.log(`\n⚠️  NEXT: Check each oracle source on Etherscan for:`);
  console.log(`   - getReserves() calls`);
  console.log(`   - slot0() usage`);
  console.log(`   - Missing TWAP`);
}

scan().catch(console.error);
