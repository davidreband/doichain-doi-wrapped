
// Testnet Configuration for LOCALHOST
// Generated automatically on 2025-10-30T14:07:40.646Z

const NETWORK_CONFIG = {
  chainId: 0x7a69, // Localhost (31337)
  chainName: "Localhost 8545",
  rpcUrls: ["http://127.0.0.1:8545"],
  blockExplorerUrls: ["http://127.0.0.1:8545"]
};

// Contract Addresses (LOCALHOST)
const CONTRACT_ADDRESSES = {
  WDOI_TOKEN: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  USDT_TOKEN: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  USDT_POOL: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
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
