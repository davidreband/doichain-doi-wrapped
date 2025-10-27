# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hardhat-based Ethereum development project called "wrapped-doichain" for creating a wrapped version of Doichain tokens. The project includes a basic ERC20-style token implementation.

## Development Commands
```bash
# Compile smart contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js

# Deploy to specific network
npx hardhat run scripts/deploy.js --network <network-name>

# Verify contracts on Etherscan (after deployment)
npx hardhat verify --network <network-name> <contract-address> [constructor-args]
```

## Project Structure

- `package.json` - Node.js project configuration
- `hardhat.config.js` - Hardhat configuration (Solidity 0.8.27)
- `contracts/` - Solidity smart contracts
  - `WrappedDoichain.sol` - Basic ERC20 token implementation
- `scripts/` - Deployment and interaction scripts
- `test/` - Contract test files
- `artifacts/` - Compiled contract artifacts (generated)
- `cache/` - Hardhat cache (generated)
- `node_modules/` - Dependencies

## Dependencies

- `hardhat@^2.26.3` - Development framework
- `@nomicfoundation/hardhat-toolbox@^6.1.0` - Complete toolbox including:
  - `@nomicfoundation/hardhat-ethers` - Ethers.js integration
  - `ethers` - Ethereum library (v6)
  - `@nomicfoundation/hardhat-verify` - Contract verification on Etherscan
  - Testing tools (Chai, Mocha)
  - Gas reporting and coverage tools
- `@openzeppelin/contracts@^5.4.0` - OpenZeppelin smart contract library

## Environment Variables

Create `.env` file based on `.env.example`:
- `SEPOLIA_URL` - Sepolia testnet RPC URL (e.g., Alchemy/Infura)
- `MAINNET_URL` - Ethereum mainnet RPC URL
- `PRIVATE_KEY` - Private key for deployment (without 0x prefix)
- `ETHERSCAN_API_KEY` - API key for contract verification

## Key Notes

- Project uses CommonJS module system (`"type": "commonjs"`)
- Solidity version: 0.8.27
- Hardhat toolbox provides modern ethers.js integration (v6)
- Initial WrappedDoichain contract implements basic ERC20 functionality