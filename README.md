# Wrapped Doichain (wDOI)

A Hardhat-based Ethereum smart contract project for creating a wrapped version of Doichain tokens.

## Overview

This project implements a basic ERC20-style token contract that represents wrapped Doichain (wDOI) tokens on the Ethereum blockchain.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wrapped-doichain
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:
- Get API keys from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
- Get Etherscan API key from [Etherscan](https://etherscan.io/apis)
- Add your private key (keep it secure!)

## Usage

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Local Network
```bash
# Start local Hardhat network
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Testnet (Sepolia)
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy to Mainnet
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Verify Contract on Etherscan
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Project Structure

```
wrapped-doichain/
├── contracts/              # Solidity smart contracts
│   └── WrappedDoichain.sol # Main ERC20 token contract
├── scripts/                # Deployment and utility scripts
├── test/                   # Contract tests
├── hardhat.config.js       # Hardhat configuration
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Contract Features

The `WrappedDoichain` contract implements:

- **ERC20 Standard**: Basic token functionality (transfer, approve, allowance)
- **Name**: "Wrapped Doichain"
- **Symbol**: "wDOI"
- **Decimals**: 18
- **Events**: Transfer and Approval events for transparency

## Development

### Available Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy locally
npm run deploy:local

# Deploy to testnet
npm run deploy:sepolia

# Deploy to mainnet
npm run deploy:mainnet

# Verify contract
npm run verify
```

### Network Configuration

The project is configured for:
- **Hardhat Network** (local development)
- **Sepolia Testnet** (testing)
- **Ethereum Mainnet** (production)

## Security Considerations

⚠️ **Important Security Notes:**

- Never commit your `.env` file to version control
- Keep your private keys secure
- Test thoroughly on testnets before mainnet deployment
- Consider using a multisig wallet for mainnet deployments
- Audit contracts before production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## Support

For questions and support, please open an issue in the GitHub repository.