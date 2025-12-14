# Oracle Manipulation Attack Map

## Attack Flow Diagram

Step 1: Flashloan from Balancer or Aave (10M+ dollars)
Step 2: Manipulate DEX Pool - Swap in Uniswap V2 pool
Step 3: Vulnerable Protocol Reads Price via getReserves()
Step 4: Exploit Action - Over-borrow or avoid liquidation
Step 5: Repay Flashloan plus fee
Step 6: Profit - Net gain minus flashloan fee and gas

## Known Attack Paths

### Path 1: Aave V2 Collateral Manipulation
Target: Aave V2 markets using Uniswap oracle
Manipulable Pool: Uniswap V2 WBTC/USDC
Attack Steps:
1. Flashloan 10,000 ETH
2. Swap ETH to WBTC in pool (inflate WBTC price)
3. Deposit inflated WBTC as collateral
4. Borrow max USDC based on fake price
5. Restore pool and repay flashloan
6. Profit: Borrowed USDC minus flashloan fee

Economics:
- Cost: 50k dollars (flashloan fee plus gas)
- Potential borrow: 500k+ dollars
- Profit: 450k+ dollars

### Path 2: Alpha Homora LP Token Inflation
Target: Alpha Homora leveraged positions
Manipulable Pool: SushiSwap SUSHI/WETH
Attack Steps:
1. Flashloan SUSHI tokens
2. Add liquidity to inflate LP token value
3. Open leveraged position with over-valued collateral
4. Borrow ETH against inflated LP tokens
5. Remove liquidity and repay flashloan

Economics:
- Cost: 10k to 30k dollars
- Profit: 50k to 150k dollars
- Risk: Medium

## Real Exploit Timeline

Oct 2020 - Harvest Finance - 24M dollars - Curve Y pool manipulation
Aug 2021 - Cream Finance - 18.8M dollars - AMP token oracle
Apr 2022 - Inverse Finance - 15.6M dollars - Curve oracle
Apr 2022 - Hundred Finance - 6M dollars - Solidly spot price
Oct 2022 - Mango Markets - 110M dollars - Pyth oracle manipulation

## Detection Checklist

- Does it call getReserves() directly?
- Does it use slot0() from Uniswap V3?
- Is TWAP window less than 1 hour?
- Is there Chainlink price validation?
- Are there deviation thresholds?
- Is flash loan protection implemented?
- Can price be manipulated in single block?
- What is the cost to move price 10 percent?

Last Updated: 2025-12-14
