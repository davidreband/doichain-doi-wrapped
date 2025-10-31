
// Testnet Configuration for SEPOLIA
// Generated automatically on 2025-10-31T08:00:52.926Z

const NETWORK_CONFIG = {
  chainId: 0xaa36a7, // Sepolia
  chainName: "Sepolia Test Network",
  rpcUrls: ["https://sepolia.infura.io/v3/"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"]
};

// Contract Addresses (SEPOLIA)
const CONTRACT_ADDRESSES = {
  WDOI_TOKEN: "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5",
  USDT_TOKEN: "0x584d5D62adaa8123E1726777AA6EEa154De6c76f",
  USDT_POOL: "0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C"
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

console.log("📡 Frontend configuration loaded for SEPOLIA");
console.log("Contract addresses:", CONTRACT_ADDRESSES);
