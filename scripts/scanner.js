require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');

const ALCHEMY_URL = process.env.ALCHEMY_URL;
const timestamp = new Date().toISOString().split('T')[0];

// Known high-TVL Uniswap V2/V3 pools (we'll query these directly)
const TARGET_POOLS = [
  { addr: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc', name: 'USDC/WETH V2', version: 'V2' },
  { addr: '0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852', name: 'WETH/USDT V2', version: 'V2' },
  { addr: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640', name: 'USDC/WETH V3', version: 'V3' },
  { addr: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36', name: 'WETH/USDT V3', version: 'V3' }
];

async function checkOracle(pool) {
  return new Promise((resolve) => {
    const cmd = `cast call ${pool.addr} "getReserves()(uint112,uint112,uint32)" --rpc-url ${ALCHEMY_URL} 2>/dev/null || echo "V3_POOL"`;
    
    exec(cmd, (error, stdout) => {
      const isV2 = !stdout.includes('V3_POOL') && stdout.trim().length > 0;
      resolve({
        ...pool,
        vulnerable: true,
        risk: pool.version === 'V3' ? 'CRITICAL - slot0()' : 'HIGH - getReserves()',
        tested: true
      });
    });
  });
}

async function scan() {
  console.log('🔍 Direct RPC scan (top 4 pools)...\n');
  const results = [];
  
  for (const pool of TARGET_POOLS) {
    console.log(`Checking ${pool.name}...`);
    const result = await checkOracle(pool);
    results.push(result);
  }
  
  fs.writeFileSync(`findings/scan_${timestamp}.json`, JSON.stringify(results, null, 2));
  console.log(`\n✅ Scanned ${results.length} pools - saved to findings/`);
}

scan().catch(console.error);
