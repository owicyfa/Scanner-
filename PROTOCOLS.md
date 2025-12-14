# Target Protocols for Oracle Manipulation Exploits

## Overview
We target protocols that **consume price data** from manipulable DEX pools (Uniswap V2/V3, SushiSwap, Curve) without proper protection (TWAP, Chainlink, or deviation checks).

---

## 🎯 Primary Targets

### 1. **Aave V2 & V3** (Lending)
- **What**: Decentralized lending markets
- **Vulnerability**: Some markets use Uniswap V2/V3 oracles for collateral pricing
- **Contracts**: 
  - PriceOracle: 0xA50ba011c48153De246E5192C8f9258A2ba79Ca9 (V2)
  - AaveOracle: 0x54586bE62E3c3580375aE3723C145253060Ca0C2 (V3)
- **Attack Vector**: Manipulate collateral price → over-borrow or avoid liquidation
- **TVL**: $10B+

### 2. **Compound V2 & V3** (Lending)
- **What**: Algorithmic money market protocol
- **Vulnerability**: UniswapAnchoredView uses V2 pools as fallback
- **Contracts**:
  - Comptroller: 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B (V2)
  - PriceOracle: 0x50ce56A3239671Ab62f185704Caedf626352741e
- **Attack Vector**: Skew TWAP anchor → manipulate all market prices
- **TVL**: $3B+

### 3. **Euler Finance** (Lending)
- **What**: Permissionless lending protocol
- **Vulnerability**: Uses Uniswap V3 TWAP but short windows (30min)
- **Contracts**:
  - Euler: 0x27182842E098f60e3D576794A5bFFb0777E025d3
  - Oracle: 0x1891783cb3497Fdad1F25C933225243c2c7c4102
- **Attack Vector**: Multi-block TWAP manipulation
- **TVL**: $200M+

### 4. **Alpha Homora V2** (Leveraged Yield Farming)
- **What**: Leveraged yield farming positions
- **Vulnerability**: Uses Uniswap/SushiSwap spot prices for LP token valuation
- **Contracts**:
  - Bank: 0xba5eBAf3fc1Fcca67147050Bf80462393814E54B
  - Oracle: 0x1887118E49e0F4A78Bd71B792a49dE03504A764D
- **Attack Vector**: Inflate LP token value → over-borrow ETH
- **TVL**: $100M+

### 5. **Yearn Finance** (Yield Aggregator)
- **What**: Automated yield farming vaults
- **Vulnerability**: Strategy contracts trust DEX spot prices for rebalancing
- **Contracts**: Multiple vault strategies
- **Attack Vector**: Manipulate price during harvest → steal yield
- **TVL**: $300M+

---

## 🔍 Detection Strategy

For each protocol, we check:
1. **Oracle Contract**: What does getPrice() or getUnderlyingPrice() call?
2. **Source Validation**: Does it use Chainlink, TWAP (>30min), or spot price?
3. **Deviation Checks**: Is there a percent threshold before accepting prices?
4. **Flash Loan Protection**: Does it block same-block oracle updates?

---

## 🚨 Red Flags (High Priority)

- Direct calls to IUniswapV2Pair.getReserves()
- Direct calls to IUniswapV3Pool.slot0()
- Curve get_dy() without manipulation checks
- TWAP windows less than 30 minutes
- No Chainlink price validation
- No block.number or block.timestamp checks

---

## 🎓 Case Studies (Historical Exploits)

1. **Harvest Finance (Oct 2020)**: $24M via Curve Y pool manipulation
2. **Cream Finance (Aug 2021)**: $18.8M via AMP token price manipulation  
3. **Inverse Finance (Apr 2022)**: $15.6M via Curve oracle manipulation
4. **Hundred Finance (Apr 2022)**: $6M via Solidly spot price
5. **Mango Markets (Oct 2022)**: $110M via Pyth oracle manipulation

---

*Last Updated: 2025-12-14*
