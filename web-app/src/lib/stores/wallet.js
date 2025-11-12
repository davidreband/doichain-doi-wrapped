import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { isAdminAddress, isCustodianAddress, isMerchantAddress } from '$lib/config/addresses.js';

// Wallet state store
export const walletStore = writable({
	isConnected: false,
	address: null,
	balance: 0,
	network: null,
	isAdmin: false,
	isCustodian: false,
	isMerchant: false,
	isLoading: true // Добавляем состояние загрузки
});

// Type guard for ethereum provider
function hasEthereum() {
	return typeof window !== 'undefined' && window.ethereum && typeof window.ethereum.request === 'function';
}

// Connect wallet function
export async function connectWallet() {
	console.log('🔄 Attempting to connect wallet...');
	console.log('Browser check:', browser);
	console.log('Ethereum provider check:', hasEthereum());
	
	if (!browser || !hasEthereum()) {
		const error = 'MetaMask не установлен';
		console.error('❌ Connection failed:', error);
		throw new Error(error);
	}

	try {
		// Request account access
		const accounts = await window.ethereum.request({ 
			method: 'eth_requestAccounts' 
		});
		
		if (accounts.length === 0) {
			throw new Error('Нет доступных аккаунтов');
		}

		const address = accounts[0];
		console.log('📝 Connected address:', address);
		
		// Get network info
		const chainId = await window.ethereum.request({ 
			method: 'eth_chainId' 
		});
		console.log('🌐 Network chain ID:', chainId);

		// Get balance
		const balance = await window.ethereum.request({
			method: 'eth_getBalance',
			params: [address, 'latest']
		});
		console.log('💰 Balance (wei):', balance);

		// Check user roles
		const isAdmin = isAdminAddress(address);
		const isCustodian = isCustodianAddress(address);
		const isMerchant = isMerchantAddress(address);
		console.log('🔑 Roles:', { isAdmin, isCustodian, isMerchant });

		// Update store
		const walletState = {
			isConnected: true,
			address,
			balance: balance ? parseInt(balance, 16) / Math.pow(10, 18) : 0, // Convert wei to ETH
			network: chainId,
			isAdmin,
			isCustodian,
			isMerchant,
			isLoading: false // Загрузка завершена
		};
		
		console.log('✅ Wallet connected successfully:', walletState);
		walletStore.set(walletState);

		// Save to localStorage
		if (browser) {
			localStorage.setItem('walletConnected', 'true');
			localStorage.setItem('walletAddress', address);
		}

		return { address, isAdmin, isCustodian, isMerchant };

	} catch (error) {
		console.error('❌ Ошибка подключения кошелька:', error);
		// Reset wallet state on error
		disconnectWallet();
		throw error;
	}
}

// Disconnect wallet function
export function disconnectWallet() {
	walletStore.set({
		isConnected: false,
		address: null,
		balance: 0,
		network: null,
		isAdmin: false,
		isCustodian: false,
		isMerchant: false,
		isLoading: false // Загрузка завершена даже при отключении
	});

	// Clear localStorage
	if (browser) {
		localStorage.removeItem('walletConnected');
		localStorage.removeItem('walletAddress');
	}
}

// Auto-reconnect function (call on app initialization)
export async function autoReconnectWallet() {
	console.log('🔄 Auto-reconnect wallet attempt...');
	
	if (!browser) {
		console.log('❌ Not in browser environment');
		return;
	}
	
	if (!hasEthereum()) {
		console.log('❌ No ethereum provider');
		// Clear saved state if MetaMask not available
		disconnectWallet();
		return;
	}

	try {
		// Check if was previously connected
		const wasConnected = localStorage.getItem('walletConnected');
		console.log('📋 Was previously connected:', !!wasConnected);
		
		if (!wasConnected) {
			return;
		}

		// Get current accounts without requesting permission
		const accounts = await window.ethereum.request({ 
			method: 'eth_accounts' 
		});
		
		console.log('📝 Available accounts:', accounts.length);
		
		if (accounts.length > 0) {
			console.log('✅ Auto-reconnecting to:', accounts[0]);
			await connectWallet();
		} else {
			console.log('⚠️ No accounts available, clearing state');
			// Clear saved state if no accounts available
			disconnectWallet();
		}
	} catch (error) {
		console.error('❌ Ошибка автоподключения:', error);
		disconnectWallet();
	}
	
	// Если мы дошли до этой точки без подключения, отмечаем загрузку как завершенную
	walletStore.update(state => ({
		...state,
		isLoading: false
	}));
}

// Listen for account/network changes
export function setupWalletListeners() {
	if (!browser || !hasEthereum()) {
		return;
	}

	console.log('👂 Setting up wallet event listeners...');

	// Account changed
	window.ethereum.on('accountsChanged', async (accounts) => {
		console.log('🔄 Account changed:', accounts);
		if (accounts.length === 0) {
			console.log('❌ No accounts, disconnecting');
			disconnectWallet();
		} else {
			console.log('🔄 Reconnecting to new account:', accounts[0]);
			try {
				await connectWallet();
			} catch (error) {
				console.error('❌ Failed to reconnect:', error);
				disconnectWallet();
			}
		}
	});

	// Network changed
	window.ethereum.on('chainChanged', async (chainId) => {
		console.log('🌐 Network changed to:', chainId);
		// Reload page to avoid issues with network changes
		window.location.reload();
	});
}