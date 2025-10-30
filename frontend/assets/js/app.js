// Doichain wDOI/USDT Pool - JavaScript Application

// Contract addresses (localhost deployment)
const WDOI_TOKEN_ADDRESS = '0x5302E909d1e93e30F05B5D6Eea766363D14F9892'; // Latest wDOI
const USDT_TOKEN_ADDRESS = '0x986aaa537b8cc170761FDAC6aC4fc7F9d8a20A8C'; // Latest Mock USDT
const USDT_POOL_ADDRESS = '0xe1Fd27F4390DcBE165f4D60DBF821e4B9Bb02dEd'; // Latest working pool

// Contract ABIs (simplified)
const WDOI_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function approve(address, uint256) returns (bool)"
];

const USDT_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function approve(address, uint256) returns (bool)",
    "function transfer(address, uint256) returns (bool)",
    "function transferFrom(address, address, uint256) returns (bool)"
];

const POOL_ABI = [
    "function getPoolInfo() view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
    "function getAmountOut(uint256, uint256, uint256) view returns (uint256)",
    "function swapUSDTForWDOI(uint256, uint256)",
    "function swapWDOIForUSDT(uint256, uint256)",
    "function reserveWDOI() view returns (uint256)",
    "function reserveUSDT() view returns (uint256)"
];

let provider, signer, userAddress;
let wdoiContract, usdtContract, poolContract;
let usdtBalance = 0, wdoiBalance = 0;
let reserveUSDT = 0, reserveWDOI = 0;
let isUSDTToWDOI = true; // Direction: true = USDT->wDOI, false = wDOI->USDT

// Initialize
async function init() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask detected');
        } else {
            showError('Please install MetaMask to use this app');
            return;
        }
    } catch (error) {
        console.warn('Init warning (can be ignored):', error.message);
    }
}

// Connect/Disconnect wallet
async function connectWallet() {
    // Check if already connected
    if (userAddress) {
        // Disconnect by reloading the page
        location.reload();
        return;
    }
    
    try {
        showLoading(true);
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check network
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.chainId.toString());
        document.getElementById('networkInfo').textContent = `Chain ID: ${network.chainId}`;
        
        if (Number(network.chainId) !== 31337) {
            showError(`Warning: Expected Hardhat Local (Chain ID: 31337), but connected to Chain ID: ${network.chainId}. Contracts may not work.`);
            // Don't return - allow connection but show warning
        }
        
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        // Initialize contracts
        wdoiContract = new ethers.Contract(WDOI_TOKEN_ADDRESS, WDOI_ABI, provider);
        usdtContract = new ethers.Contract(USDT_TOKEN_ADDRESS, USDT_ABI, provider);
        poolContract = new ethers.Contract(USDT_POOL_ADDRESS, POOL_ABI, provider);

        // Update UI
        document.getElementById('connectBtn').textContent = 'Disconnect';
        document.getElementById('connectBtn').disabled = false;
        document.getElementById('walletAddress').textContent = 
            userAddress.slice(0, 6) + '...' + userAddress.slice(-4);
        
        document.getElementById('walletInfo').classList.remove('hidden');
        document.getElementById('swapSection').classList.remove('hidden');

        // Load balances and pool info
        await updateBalances();
        await updatePoolInfo();

        showLoading(false);
        
        // Initialize swap interface after everything is loaded
        updateSwapInterface();
        
    } catch (error) {
        console.error('Connection error:', error);
        showError('Failed to connect wallet: ' + error.message);
        showLoading(false);
    }
}

// Update user balances
async function updateBalances() {
    try {
        // Check if contracts exist
        const wdoiCode = await provider.getCode(WDOI_TOKEN_ADDRESS);
        const usdtCode = await provider.getCode(USDT_TOKEN_ADDRESS);
        
        if (wdoiCode === '0x') {
            console.warn(`wDOI contract not found at ${WDOI_TOKEN_ADDRESS}`);
            showError(`wDOI contract not found. Check network and contract address.`);
            return; // Skip balance update but don't crash
        }
        
        if (usdtCode === '0x') {
            console.warn(`USDT contract not found at ${USDT_TOKEN_ADDRESS}`);
            showError(`USDT contract not found. Check network and contract address.`);
            return; // Skip balance update but don't crash
        }

        const usdtBal = await usdtContract.balanceOf(userAddress);
        const wdoiBal = await wdoiContract.balanceOf(userAddress);

        // Both contracts use 18 decimals
        usdtBalance = parseFloat(ethers.formatEther(usdtBal));
        wdoiBalance = parseFloat(ethers.formatEther(wdoiBal));

        // Update main wallet info balances
        const usdtBalanceEl = document.getElementById('usdtBalance');
        const wdoiBalanceEl = document.getElementById('wdoiBalance');
        if (usdtBalanceEl) usdtBalanceEl.textContent = usdtBalance.toFixed(4);
        if (wdoiBalanceEl) wdoiBalanceEl.textContent = wdoiBalance.toFixed(4);

        // Update swap interface balances using the dedicated function
        updateBalanceDisplay();

        console.log('Balances updated:', { wdoi: wdoiBalance, usdt: usdtBalance });

    } catch (error) {
        console.error('Balance update error:', error);
        showError('Contract not found. Make sure you are on the correct network and contracts are deployed.');
    }
}

// Update pool information
async function updatePoolInfo() {
    try {
        // Check if pool contract exists
        const poolCode = await provider.getCode(USDT_POOL_ADDRESS);
        
        if (poolCode === '0x') {
            console.warn(`Pool contract not found at ${USDT_POOL_ADDRESS}`);
            showError(`Pool contract not found. Check network and contract address.`);
            // Set default values and return
            reserveWDOI = 1000;
            reserveUSDT = 1000; 
            document.getElementById('wdoiRate').textContent = '1.000000';
            document.getElementById('priceImpact').textContent = '0.00%';
            return;
        }

        const poolInfo = await poolContract.getPoolInfo();
        reserveWDOI = parseFloat(ethers.formatEther(poolInfo[0]));
        reserveUSDT = parseFloat(ethers.formatEther(poolInfo[1])); // Using 18 decimals for Mock USDT

        // Update rate display (either wdoiRate or exchangeRate depending on interface state)
        const rate = reserveUSDT > 0 ? (reserveWDOI / reserveUSDT).toFixed(6) : '0';
        const wdoiRateEl = document.getElementById('wdoiRate');
        const exchangeRateEl = document.getElementById('exchangeRate');
        
        if (wdoiRateEl) wdoiRateEl.textContent = rate;
        if (exchangeRateEl) {
            // Calculate rate based on current direction
            if (isUSDTToWDOI) {
                exchangeRateEl.textContent = rate; // USDT -> wDOI rate
            } else {
                const reverseRate = reserveWDOI > 0 ? (reserveUSDT / reserveWDOI).toFixed(6) : '0';
                exchangeRateEl.textContent = reverseRate; // wDOI -> USDT rate
            }
        }

        console.log('Pool info updated:', { reserveWDOI, reserveUSDT, rate });

    } catch (error) {
        console.error('Pool info error:', error);
        showError('Pool contract not found. Make sure contracts are deployed.');
        
        // Set default values for testing without pool
        reserveWDOI = 1000;
        reserveUSDT = 1000; 
        
        const wdoiRateEl = document.getElementById('wdoiRate');
        const exchangeRateEl = document.getElementById('exchangeRate');
        const priceImpactEl = document.getElementById('priceImpact');
        
        if (wdoiRateEl) wdoiRateEl.textContent = '1.000000';
        if (exchangeRateEl) exchangeRateEl.textContent = '1.000000';
        if (priceImpactEl) priceImpactEl.textContent = '0.00%';
    }
}

// Switch swap direction
function switchDirection() {
    isUSDTToWDOI = !isUSDTToWDOI;
    console.log('Direction switched to:', isUSDTToWDOI ? 'USDT -> wDOI' : 'wDOI -> USDT');
    
    // Clear inputs when switching
    document.getElementById('fromInput').value = '';
    document.getElementById('toOutput').value = '';
    
    updateSwapInterface();
    calculateSwap();
}

// Update interface based on swap direction
function updateSwapInterface() {
    const swapSection = document.getElementById('swapSection');
    if (!swapSection || swapSection.classList.contains('hidden')) {
        console.log('Swap section not visible yet');
        return;
    }
    
    const cards = document.querySelectorAll('#swapSection .swap-card');
    const fromCard = cards[0];
    const toCard = cards[1];
    
    if (!fromCard || !toCard) {
        console.log('Swap cards not found, available cards:', document.querySelectorAll('.swap-card').length);
        return;
    }
    
    console.log('Updating interface for direction:', isUSDTToWDOI ? 'USDT -> wDOI' : 'wDOI -> USDT');
    
    if (isUSDTToWDOI) {
        // USDT -> wDOI
        fromCard.querySelector('.token-symbol').innerHTML = '<img src="assets/images/usdt-logo.svg" alt="USDT" class="token-logo">Mock USDT';
        fromCard.querySelector('.token-symbol').className = 'token-symbol usdt-highlight';
        
        const fromBalance = fromCard.querySelector('.token-balance');
        fromBalance.innerHTML = `Balance: <span id="fromBalanceDisplay">0.0000</span><button class="max-btn" onclick="setMaxUSDT()">MAX</button>`;
        
        toCard.querySelector('.token-symbol').innerHTML = '<img src="assets/images/wdoi-logo.svg" alt="wDOI" class="token-logo">wDOI';
        toCard.querySelector('.token-symbol').className = 'token-symbol';
        
        const toBalance = toCard.querySelector('.token-balance');
        toBalance.innerHTML = `Balance: <span id="toBalanceDisplay">0.0000</span>`;
        
        document.getElementById('priceInfo').innerHTML = `
            <div>Rate: 1 USDT = <span id="exchangeRate">0</span> wDOI</div>
            <div>Price Impact: <span id="priceImpact">0.00%</span></div>
            <div>Trading Fee: 0.3%</div>
        `;
    } else {
        // wDOI -> USDT
        fromCard.querySelector('.token-symbol').innerHTML = '<img src="assets/images/wdoi-logo.svg" alt="wDOI" class="token-logo">wDOI';
        fromCard.querySelector('.token-symbol').className = 'token-symbol';
        
        const fromBalance = fromCard.querySelector('.token-balance');
        fromBalance.innerHTML = `Balance: <span id="fromBalanceDisplay">0.0000</span><button class="max-btn" onclick="setMaxWDOI()">MAX</button>`;
        
        toCard.querySelector('.token-symbol').innerHTML = '<img src="assets/images/usdt-logo.svg" alt="USDT" class="token-logo">Mock USDT';
        toCard.querySelector('.token-symbol').className = 'token-symbol usdt-highlight';
        
        const toBalance = toCard.querySelector('.token-balance');
        toBalance.innerHTML = `Balance: <span id="toBalanceDisplay">0.0000</span>`;
        
        document.getElementById('priceInfo').innerHTML = `
            <div>Rate: 1 wDOI = <span id="exchangeRate">0</span> USDT</div>
            <div>Price Impact: <span id="priceImpact">0.00%</span></div>
            <div>Trading Fee: 0.3%</div>
        `;
    }
    
    // Update balances
    updateBalanceDisplay();
}

// Update balance display
function updateBalanceDisplay() {
    const fromDisplay = document.getElementById('fromBalanceDisplay');
    const toDisplay = document.getElementById('toBalanceDisplay');
    
    if (fromDisplay && toDisplay) {
        if (isUSDTToWDOI) {
            fromDisplay.textContent = usdtBalance.toFixed(4);
            toDisplay.textContent = wdoiBalance.toFixed(4);
        } else {
            fromDisplay.textContent = wdoiBalance.toFixed(4);
            toDisplay.textContent = usdtBalance.toFixed(4);
        }
    }
    
    // Also update the main balance display if elements exist
    const usdtSwapEl = document.getElementById('usdtBalanceSwap');
    const wdoiSwapEl = document.getElementById('wdoiBalanceSwap');
    if (usdtSwapEl) usdtSwapEl.textContent = usdtBalance.toFixed(4);
    if (wdoiSwapEl) wdoiSwapEl.textContent = wdoiBalance.toFixed(4);
}

// Calculate swap output
async function calculateSwap() {
    const inputAmount = parseFloat(document.getElementById('fromInput').value) || 0;
    
    if (inputAmount <= 0 || reserveUSDT === 0 || reserveWDOI === 0) {
        document.getElementById('toOutput').value = '';
        document.getElementById('swapBtn').textContent = isUSDTToWDOI ? 'Enter USDT amount' : 'Enter wDOI amount';
        document.getElementById('swapBtn').disabled = true;
        return;
    }

    try {
        let outputAmount;
        let fromReserve, toReserve, userBalance;
        
        if (isUSDTToWDOI) {
            fromReserve = reserveUSDT;
            toReserve = reserveWDOI;
            userBalance = usdtBalance;
        } else {
            fromReserve = reserveWDOI;
            toReserve = reserveUSDT;
            userBalance = wdoiBalance;
        }
        
        // Calculate output using AMM formula
        const inputAmountWei = ethers.parseEther(inputAmount.toString());
        
        try {
            const outputWei = await poolContract.getAmountOut(inputAmountWei, 
                ethers.parseEther(fromReserve.toString()),
                ethers.parseEther(toReserve.toString())
            );
            outputAmount = parseFloat(ethers.formatEther(outputWei));
        } catch (poolError) {
            // Fallback calculation
            outputAmount = inputAmount * (toReserve / fromReserve) * 0.997; // 0.3% fee
        }
        
        document.getElementById('toOutput').value = outputAmount.toFixed(6);

        // Calculate price impact
        const currentRate = toReserve / fromReserve;
        const newRate = (toReserve - outputAmount) / (fromReserve + inputAmount);
        const priceImpact = ((currentRate - newRate) / currentRate * 100).toFixed(2);
        document.getElementById('priceImpact').textContent = priceImpact + '%';
        
        // Update exchange rate
        const rate = (outputAmount / inputAmount).toFixed(6);
        document.getElementById('exchangeRate').textContent = rate;

        // Update swap button
        if (inputAmount > userBalance) {
            const tokenName = isUSDTToWDOI ? 'USDT' : 'wDOI';
            document.getElementById('swapBtn').textContent = `Insufficient ${tokenName} Balance`;
            document.getElementById('swapBtn').disabled = true;
        } else {
            const fromToken = isUSDTToWDOI ? 'USDT' : 'wDOI';
            const toToken = isUSDTToWDOI ? 'wDOI' : 'USDT';
            document.getElementById('swapBtn').textContent = `Swap ${inputAmount} ${fromToken} for ${outputAmount.toFixed(4)} ${toToken}`;
            document.getElementById('swapBtn').disabled = false;
        }

    } catch (error) {
        console.error('Calculation error:', error);
        document.getElementById('toOutput').value = '';
    }
}

// Set maximum USDT amount
function setMaxUSDT() {
    const maxUsdt = Math.max(0, usdtBalance - 0.001);
    document.getElementById('fromInput').value = maxUsdt.toFixed(4);
    calculateSwap();
}

// Set maximum wDOI amount
function setMaxWDOI() {
    const maxWdoi = Math.max(0, wdoiBalance - 0.001);
    document.getElementById('fromInput').value = maxWdoi.toFixed(4);
    calculateSwap();
}

// Execute swap
async function executeSwap() {
    const inputAmount = parseFloat(document.getElementById('fromInput').value);
    const outputAmount = parseFloat(document.getElementById('toOutput').value);

    if (!inputAmount || !outputAmount) {
        showError('Please enter valid amounts');
        return;
    }

    const userBalance = isUSDTToWDOI ? usdtBalance : wdoiBalance;
    const tokenName = isUSDTToWDOI ? 'USDT' : 'wDOI';

    if (inputAmount > userBalance) {
        showError(`Insufficient ${tokenName} balance`);
        return;
    }

    try {
        showLoading(true);
        hideMessages();
        
        console.log('Executing swap:', {
            direction: isUSDTToWDOI ? 'USDT -> wDOI' : 'wDOI -> USDT',
            inputAmount,
            outputAmount,
            inputToken: isUSDTToWDOI ? 'USDT' : 'wDOI',
            outputToken: isUSDTToWDOI ? 'wDOI' : 'USDT'
        });

        const inputAmountWei = ethers.parseEther(inputAmount.toString());
        const minOutputWei = ethers.parseEther((outputAmount * 0.95).toString()); // 5% slippage

        if (isUSDTToWDOI) {
            // USDT -> wDOI swap
            const usdtWithSigner = usdtContract.connect(signer);
            const approveTx = await usdtWithSigner.approve(USDT_POOL_ADDRESS, inputAmountWei);
            showSuccess('USDT approval submitted...');
            await approveTx.wait();

            const poolWithSigner = poolContract.connect(signer);
            const tx = await poolWithSigner.swapUSDTForWDOI(inputAmountWei, minOutputWei, {
                gasLimit: 300000
            });

            showSuccess(`Swap transaction submitted: ${tx.hash.slice(0, 10)}...`);
            await tx.wait();
            showSuccess(`Swap successful! You received ${outputAmount.toFixed(4)} wDOI for ${inputAmount} USDT`);
        } else {
            // wDOI -> USDT swap
            const wdoiWithSigner = wdoiContract.connect(signer);
            const approveTx = await wdoiWithSigner.approve(USDT_POOL_ADDRESS, inputAmountWei);
            showSuccess('wDOI approval submitted...');
            await approveTx.wait();

            const poolWithSigner = poolContract.connect(signer);
            const tx = await poolWithSigner.swapWDOIForUSDT(inputAmountWei, minOutputWei, {
                gasLimit: 300000
            });

            showSuccess(`Swap transaction submitted: ${tx.hash.slice(0, 10)}...`);
            await tx.wait();
            showSuccess(`Swap successful! You received ${outputAmount.toFixed(4)} USDT for ${inputAmount} wDOI`);
        }
        
        // Update balances
        await updateBalances();
        await updatePoolInfo();
        
        // Clear inputs
        document.getElementById('fromInput').value = '';
        document.getElementById('toOutput').value = '';
        calculateSwap();

    } catch (error) {
        console.error('Swap error:', error);
        showError('Swap failed: ' + (error.reason || error.message));
    } finally {
        showLoading(false);
    }
}

// UI Helper functions
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('success');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    setTimeout(() => successDiv.classList.add('hidden'), 5000);
}

function hideMessages() {
    document.getElementById('error').classList.add('hidden');
    document.getElementById('success').classList.add('hidden');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('connectBtn').addEventListener('click', connectWallet);
    
    // MetaMask events
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            try {
                if (!accounts || accounts.length === 0) {
                    location.reload();
                } else if (accounts[0] !== userAddress) {
                    location.reload();
                }
            } catch (error) {
                console.warn('MetaMask accountsChanged error (can be ignored):', error.message);
            }
        });

        window.ethereum.on('chainChanged', () => {
            try {
                location.reload();
            } catch (error) {
                console.warn('MetaMask chainChanged error (can be ignored):', error.message);
            }
        });
    }

    // Initialize app
    init();
    
    // Display contract addresses for debugging
    document.getElementById('wdoiAddress').textContent = WDOI_TOKEN_ADDRESS;
    document.getElementById('usdtAddress').textContent = USDT_TOKEN_ADDRESS;
    document.getElementById('poolAddress').textContent = USDT_POOL_ADDRESS;
});