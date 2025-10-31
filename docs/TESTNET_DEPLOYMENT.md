# Sepolia Testnet Deployment Guide

## Overview
This document describes the complete deployment and setup process for the Doichain wDOI/USDT pool system on Sepolia testnet.

## Deployed Contracts (Sepolia)

### Contract Addresses
- **wDOI Token (Custodial)**: `0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5`
- **Mock USDT Token**: `0x584d5D62adaa8123E1726777AA6EEa154De6c76f`
- **USDT/wDOI Pool**: `0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C`

### Verification Status
All contracts are verified on Sepolia Etherscan:
- View contracts at: https://sepolia.etherscan.io/

## System Architecture

### Tokens
1. **wDOI (Wrapped Doichain)**
   - ERC20 token with 18 decimals
   - Custodial model based on WBTC architecture
   - Merchant/custodian role system with multisig confirmations

2. **Mock USDT**
   - ERC20 token with 6 decimals (matches real USDT)
   - Includes faucet function for testing
   - Maximum 10,000 USDT per faucet call

### AMM Pool
- **USDT/wDOI Liquidity Pool**
  - Constant product formula (x * y = k)
  - 0.3% trading fee
  - Handles decimal differences (USDT: 6, wDOI: 18)
  - Pricing formula: `(reserveUSDT * 1e30) / reserveWDOI`

## Deployment Process

### Prerequisites
1. Sepolia testnet ETH for gas fees
2. Environment variables configured:
   ```bash
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   PRIVATE_KEY=your_private_key_without_0x
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Step 1: Deploy Contracts
```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

This deploys:
- WrappedDoichainCustodial contract
- MockUSDT contract  
- wDOIUSDTPool contract

### Step 2: Add Initial Liquidity
```bash
npx hardhat run scripts/add-liquidity-simple.js --network sepolia
```

This:
- Gets 1000 USDT from faucet
- Adds 500 wDOI + 500 USDT to pool
- Tests a sample swap

### Step 3: Configure Frontend
Frontend configuration is automatically generated in `frontend/config-sepolia.js`:
```javascript
const CONTRACT_ADDRESSES = {
  WDOI_TOKEN: "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5",
  USDT_TOKEN: "0x584d5D62adaa8123E1726777AA6EEa154De6c76f",
  USDT_POOL: "0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C"
};
```

## Frontend Testing

### MetaMask Setup
1. Add Sepolia network to MetaMask:
   - Network Name: Sepolia Test Network
   - RPC URL: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   - Chain ID: 11155111 (0xaa36a7)
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.etherscan.io

2. Import tokens to MetaMask:
   - wDOI: `0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5`
   - USDT: `0x584d5D62adaa8123E1726777AA6EEa154De6c76f`

### Testing Flow
1. Open `frontend/index.html` in browser
2. Connect MetaMask wallet
3. Get test USDT using faucet (available in contract)
4. Test token swaps in both directions
5. Verify balance updates and transaction confirmations

## Technical Details

### Decimal Handling
Critical fix implemented for proper decimal handling:
- USDT operations use `parseUnits(amount, 6)` and `formatUnits(amount, 6)`
- wDOI operations use `parseEther(amount)` and `formatEther(amount)`
- Pool calculations account for decimal differences

### Security Features
- ReentrancyGuard on all pool functions
- Pausable functionality for emergency stops
- Access control for administrative functions
- Input validation and slippage protection

### Gas Optimization
- Efficient AMM calculations
- Batched operations where possible
- Optimized approval flows

## Troubleshooting

### Common Issues
1. **"Contract not found"**: Ensure correct network (Sepolia) and contract addresses
2. **"Insufficient balance"**: Use USDT faucet or check token balances
3. **"Transaction failed"**: Check gas limits and slippage settings
4. **MetaMask connection issues**: Verify network configuration

### Debug Information
Frontend displays contract addresses and network information for debugging:
- Check browser console for detailed logs
- Verify contract interactions on Sepolia Etherscan
- Monitor transaction status and gas usage

## Next Steps

### Production Deployment
For mainnet deployment:
1. Replace MockUSDT with real USDT contract
2. Update network configuration
3. Implement production security measures
4. Conduct security audits

### Feature Enhancements
- Liquidity provider rewards
- Advanced trading features
- Integration with other DEX protocols
- Mobile app development

## Support
For issues or questions:
- Check contract verification on Sepolia Etherscan
- Review transaction logs for error details
- Test with small amounts first