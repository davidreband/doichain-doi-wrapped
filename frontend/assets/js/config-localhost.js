// Local Development Configuration for LOCALHOST
// Generated automatically on 2025-10-31T08:00:52.926Z

const NETWORK_CONFIG = {
  chainId: 0x7a69, // Hardhat local network
  chainName: "Hardhat Local Network",
  rpcUrls: ["http://127.0.0.1:8545"],
  blockExplorerUrls: ["http://localhost:8545"] // No real explorer for localhost
};

// Contract Addresses (LOCALHOST)
// These will be populated after local deployment
const CONTRACT_ADDRESSES = {
  WDOI_TOKEN: "", // To be filled after deployment
  USDT_TOKEN: "", // To be filled after deployment  
  USDT_POOL: "" // To be filled after deployment
};

// Contract ABIs (minimal for frontend)
const WDOI_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function faucet(address to, uint256 amount)" // Only for testnet
];

const POOL_ABI = [
  "function getPoolInfo() view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
  "function getWDOIPrice() view returns (uint256)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)",
  "function swapUSDTForWDOI(uint256 usdtAmountIn, uint256 minWDOIOut)",
  "function swapWDOIForUSDT(uint256 wdoiAmountIn, uint256 minUSDTOut)",
  "function addLiquidity(uint256 wdoiAmount, uint256 usdtAmount, uint256 minWDOI, uint256 minUSDT) returns (uint256)",
  "function removeLiquidity(uint256 lpTokens, uint256 minWDOI, uint256 minUSDT)"
];

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.NETWORK_CONFIG = NETWORK_CONFIG;
  window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
  window.WDOI_ABI = WDOI_ABI;
  window.USDT_ABI = USDT_ABI;
  window.POOL_ABI = POOL_ABI;
}

console.log("📡 Frontend configuration loaded for LOCALHOST");
console.log("Contract addresses:", CONTRACT_ADDRESSES);
console.log("⚠️ Remember to update CONTRACT_ADDRESSES after local deployment");