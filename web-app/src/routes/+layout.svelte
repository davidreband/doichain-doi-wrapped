<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import '$lib/i18n';
	
	// Accept SvelteKit page props (this suppresses the warning)
	export let data = {};
	export let params = {};
	
	// Custom stores
	import { theme } from '$lib/stores/theme.js';
	import { locale } from '$lib/stores/locale.js';
	import { walletStore, autoReconnectWallet, setupWalletListeners } from '$lib/stores/wallet.js';
	import { detectMetaMaskTheme } from '$lib/utils/metamask.js';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	
	// Mobile menu state
	let mobileMenuOpen = false;

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
		if (mobileMenuOpen && typeof document !== 'undefined') {
			// Focus the mobile menu for keyboard navigation
			setTimeout(() => {
				const closeButton = document.querySelector('.mobile-menu-close');
				if (closeButton) closeButton.focus();
			}, 100);
		}
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	// Reactive variable for current path
	$: currentPath = $page.url.pathname;
	
	// Function to check if a path is active
	function isActive(path, current = currentPath) {
		// Special case for home page
		if (path === '/') {
			return current === '/';
		}
		
		// For other pages, check if current path starts with the menu path
		return current.startsWith(path);
	}

	// Initialize stores
	onMount(async () => {
		locale.init();
		
		// Initialize wallet with error handling
		try {
			await autoReconnectWallet();
			setupWalletListeners();
		} catch (error) {
			console.error('🚨 Wallet initialization error:', error);
			// Don't throw - app should continue working without wallet
		}
		
		try {
			detectMetaMaskTheme();
		} catch (error) {
			console.error('🚨 MetaMask theme detection error:', error);
			// Don't throw - app should continue working
		}
	});
	
	// Handle locale changes
	function handleLocaleChange(event) {
		locale.set(event.target.value);
	}
	
	// Reactive theme application
	$: if (typeof document !== 'undefined') {
		document.body.setAttribute('data-theme', $theme);
	}

	// Get current year
	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>{$_('meta.title', { default: 'Doichain wDOI' })}</title>
	<meta name="description" content={$_('meta.description', { default: 'Trade wDOI tokens with USDT instantly via MetaMask' })} />
</svelte:head>

<div class="app" data-theme={$theme}>
	<header>
		<nav class="navbar">
			<div class="nav-brand">
				<a href="/" class="brand-link">
					<img src="/images/doichain-logo.svg" alt="Doichain" />
					<span>wDOI</span>
				</a>
			</div>

			<!-- Desktop Menu -->
			<div class="nav-menu desktop-menu">
				<a href="/" class="nav-link" class:active={isActive('/', currentPath)}>{$_('nav.home', { default: 'Home' })}</a>
				<a href="/reserves" class="nav-link" class:active={isActive('/reserves', currentPath)}>{$_('nav.reserves', { default: 'Reserves' })}</a>
				<a href="/liquidity" class="nav-link" class:active={isActive('/liquidity', currentPath)}>{$_('nav.liquidity', { default: 'Liquidity' })}</a>
				
				<!-- Admin-only pages -->
				{#if $walletStore.isCustodian || $walletStore.isMerchant || $walletStore.isAdmin}
					<div class="dropdown">
						<a href="/custodian" class="nav-link dropdown-toggle" class:active={isActive('/custodian', currentPath) || isActive('/merchant', currentPath) || isActive('/bridge', currentPath) || isActive('/direct', currentPath)}>
							{$_('nav.custodian', { default: 'Custodian' })} ▼
						</a>
						<div class="dropdown-menu">
							{#if $walletStore.isCustodian || $walletStore.isAdmin}
								<div class="dropdown-group">
									<div class="dropdown-label">Custodian</div>
									<a href="/custodian" class="dropdown-item">📊 Basic</a>
									<a href="/custodian/enhanced" class="dropdown-item">🎯 Enhanced</a>
								</div>
							{/if}
							
							{#if $walletStore.isMerchant || $walletStore.isAdmin}
								<div class="dropdown-group">
									<div class="dropdown-label">Merchant</div>
									<a href="/merchant" class="dropdown-item">🏪 Operations</a>
								</div>
							{/if}
							
							{#if $walletStore.isAdmin}
								<div class="dropdown-group">
									<div class="dropdown-label">Admin</div>
									<a href="/bridge" class="dropdown-item">🌉 Bridge</a>
								</div>
							{/if}
							
							<div class="dropdown-group">
								<div class="dropdown-label">Trading</div>
								<a href="/direct" class="dropdown-item">⚡ Direct Pool</a>
							</div>
						</div>
					</div>
				{/if}
			</div>
			
			<div class="nav-controls">
				<!-- Wallet Connect -->
				<WalletConnect />
				
				<!-- Mobile Menu Button -->
				<button 
					class="mobile-menu-toggle"
					on:click={toggleMobileMenu}
					aria-label="Toggle Navigation Menu"
				>
					<span class="hamburger-line" class:open={mobileMenuOpen}></span>
					<span class="hamburger-line" class:open={mobileMenuOpen}></span>
					<span class="hamburger-line" class:open={mobileMenuOpen}></span>
				</button>
				<!-- Language Selector -->
				<select 
					value={$locale}
					on:change={handleLocaleChange}
					class="language-selector"
					aria-label={$_('nav.selectLanguage', { default: 'Select Language' })}
				>
					<option value="en">🇬🇧 EN</option>
					<option value="de">🇩🇪 DE</option>
				</select>
				
				<!-- Theme Toggle -->
				<button 
					class="theme-toggle"
					on:click={() => theme.toggle()}
					aria-label={$_('nav.toggleTheme', { default: 'Toggle Theme' })}
				>
					{#if $theme === 'light'}
						🌙
					{:else}
						☀️
					{/if}
				</button>
			</div>
		</nav>

		<!-- Mobile Menu Overlay -->
		{#if mobileMenuOpen}
			<div 
				class="mobile-menu-overlay" 
				on:click={closeMobileMenu}
				on:keydown={(e) => e.key === 'Escape' && closeMobileMenu()}
				role="button"
				tabindex="0"
				aria-label="Close mobile menu"
			></div>
		{/if}

		<!-- Mobile Slide Menu -->
		<div class="mobile-menu" class:open={mobileMenuOpen}>
			<div class="mobile-menu-header">
				<div class="mobile-brand">
					<img src="/images/doichain-logo.svg" alt="Doichain" />
					<span>wDOI</span>
				</div>
				<button 
					class="mobile-menu-close" 
					on:click={closeMobileMenu}
					aria-label="Close mobile menu"
				>
					✕
				</button>
			</div>
			
			<div class="mobile-menu-content">
				<a href="/" class="mobile-nav-link" class:active={isActive('/', currentPath)} on:click={closeMobileMenu}>
					🏠 {$_('nav.home', { default: 'Home' })}
				</a>
				<a href="/reserves" class="mobile-nav-link" class:active={isActive('/reserves', currentPath)} on:click={closeMobileMenu}>
					📊 {$_('nav.reserves', { default: 'Reserves' })}
				</a>
				<a href="/liquidity" class="mobile-nav-link" class:active={isActive('/liquidity', currentPath)} on:click={closeMobileMenu}>
					💧 {$_('nav.liquidity', { default: 'Liquidity' })}
				</a>
				
				<!-- Admin-only mobile links -->
				{#if $walletStore.isCustodian || $walletStore.isAdmin}
					<a href="/custodian" class="mobile-nav-link" class:active={isActive('/custodian', currentPath)} on:click={closeMobileMenu}>
						📊 {$_('nav.custodian', { default: 'Custodian' })} - Basic
					</a>
					<a href="/custodian/enhanced" class="mobile-nav-link" class:active={isActive('/custodian/enhanced', currentPath)} on:click={closeMobileMenu}>
						🎯 {$_('nav.custodian', { default: 'Custodian' })} - Enhanced
					</a>
				{/if}
				
				{#if $walletStore.isMerchant || $walletStore.isAdmin}
					<a href="/merchant" class="mobile-nav-link" class:active={isActive('/merchant', currentPath)} on:click={closeMobileMenu}>
						🏪 {$_('nav.merchant', { default: 'Merchant' })} Operations
					</a>
				{/if}
				
				{#if $walletStore.isAdmin}
					<a href="/bridge" class="mobile-nav-link" class:active={isActive('/bridge', currentPath)} on:click={closeMobileMenu}>
						🌉 {$_('nav.bridge', { default: 'Bridge' })} Operations
					</a>
				{/if}
				
				{#if $walletStore.isCustodian || $walletStore.isMerchant || $walletStore.isAdmin}
					<a href="/direct" class="mobile-nav-link" class:active={isActive('/direct', currentPath)} on:click={closeMobileMenu}>
						⚡ {$_('nav.direct', { default: 'Direct' })} Pool
					</a>
				{/if}
			</div>
		</div>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<div class="footer-content">
			<div class="footer-links">
				<a href="/privacy">{$_('footer.privacy', { default: 'Privacy Policy' })}</a>
				<a href="/terms">{$_('footer.terms', { default: 'Terms of Service' })}</a>
				<a href="/cookies">{$_('footer.cookies', { default: 'Cookie Policy' })}</a>
				<a href="/imprint">{$_('footer.imprint', { default: 'Imprint' })}</a>
				<a href="/about">{$_('footer.about', { default: 'About' })}</a>
				<a href="/docs">{$_('footer.docs', { default: 'Documentation' })}</a>
			</div>
			<div class="footer-info">
				<p>&copy; {currentYear} Doichain wDOI. {$_('footer.rights', { default: 'All rights reserved.' })}</p>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: background-color 0.3s ease, color 0.3s ease;
	}
	
	:global([data-theme="light"]) {
		--bg-primary: #ffffff;
		--bg-secondary: #f8f9fa;
		--bg-navbar: linear-gradient(135deg, #0B3E74 0%, #0390CB 50%, #18D685 100%);
		--bg-footer: linear-gradient(135deg, #0B3E74 0%, #0390CB 50%, #18D685 100%);
		--text-primary: #212529;
		--text-secondary: #6c757d;
		--text-white: #ffffff;
		--border-color: #dee2e6;
		--accent-color: #18D685;
		--accent-secondary: #0390CB;
		--accent-dark: #0B3E74;
		--gradient-brand: linear-gradient(135deg, #18D685 0%, #0390CB 50%, #0B3E74 100%);
	}
	
	:global([data-theme="dark"]) {
		--bg-primary: #1e1e1e;
		--bg-secondary: #2d2d2d;
		--bg-navbar: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #4a4a4a 100%);
		--bg-footer: linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #4a4a4a 100%);
		--text-primary: #ffffff;
		--text-secondary: #cccccc;
		--text-white: #ffffff;
		--border-color: #404040;
		--accent-color: #18D685;
		--accent-secondary: #0390CB;
		--accent-dark: #0B3E74;
		--gradient-brand: linear-gradient(135deg, #18D685 0%, #0390CB 50%, #0B3E74 100%);
	}
	
	.app {
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
		display: flex;
		flex-direction: column;
		position: relative;
	}
	
	.app::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-primary);
		z-index: -2;
	}
	
	:global([data-theme="dark"]) .app::after {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(ellipse at center, rgba(24, 214, 133, 0.05) 0%, rgba(3, 144, 203, 0.03) 50%, transparent 100%);
		z-index: -1;
		pointer-events: none;
	}
	
	.navbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: var(--bg-navbar);
		border-bottom: 2px solid var(--border-color);
		box-shadow: 0 4px 12px rgba(11, 62, 116, 0.2);
		position: relative;
	}
	
	.navbar::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-navbar);
		z-index: -1;
	}
	
	.nav-brand .brand-link {
		display: flex;
		align-items: center;
		text-decoration: none;
		color: var(--text-white);
		font-weight: bold;
		font-size: 1.2rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}
	
	.nav-brand img {
		height: 32px;
		margin-right: 0.5rem;
	}
	
	.nav-menu.desktop-menu {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	/* Mobile Menu Toggle Button */
	.mobile-menu-toggle {
		display: none;
		flex-direction: column;
		justify-content: space-around;
		width: 24px;
		height: 24px;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		margin-right: 1rem;
	}

	.hamburger-line {
		width: 100%;
		height: 2px;
		background: var(--text-primary);
		transition: 0.3s;
		transform-origin: 1px;
	}

	.hamburger-line.open:nth-child(1) {
		transform: rotate(45deg);
	}

	.hamburger-line.open:nth-child(2) {
		opacity: 0;
	}

	.hamburger-line.open:nth-child(3) {
		transform: rotate(-45deg);
	}

	.nav-link {
		color: rgba(255, 255, 255, 0.9);
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: all 0.2s ease;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		position: relative;
	}

	.nav-link:hover {
		color: var(--text-white);
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		transform: translateY(-1px);
	}

	.nav-link.active {
		background: rgba(255, 255, 255, 0.2);
		color: var(--text-white);
		backdrop-filter: blur(10px);
	}

	/* Dropdown Styles */
	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-toggle {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		cursor: pointer;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 220px;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		opacity: 0;
		visibility: hidden;
		transform: translateY(-10px);
		transition: all 0.2s ease;
		z-index: 1000;
		overflow: hidden;
	}

	.dropdown:hover .dropdown-menu {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}

	.dropdown-item {
		display: block;
		padding: 0.75rem 1rem;
		color: var(--text-primary);
		text-decoration: none;
		transition: background-color 0.2s ease;
		border-bottom: 1px solid var(--border-color);
		font-weight: 500;
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item:hover {
		background: var(--bg-secondary);
		color: var(--accent-color);
	}

	.dropdown-group {
		border-bottom: 1px solid var(--border-color);
	}

	.dropdown-group:last-child {
		border-bottom: none;
	}

	.dropdown-label {
		padding: 0.5rem 1rem 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
	}

	.dropdown-group .dropdown-item {
		padding-left: 1.5rem;
		border-bottom: none;
		white-space: nowrap;
	}
	
	.nav-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.language-selector {
		background: rgba(255, 255, 255, 0.2);
		color: var(--text-white);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s ease;
		height: 40px;
		min-width: 80px;
		backdrop-filter: blur(10px);
	}
	
	.language-selector:hover {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
	}
	
	.language-selector:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
	}
	
	.language-selector option {
		background: var(--bg-primary);
		color: var(--text-primary);
	}
	
	.theme-toggle {
		background: rgba(255, 255, 255, 0.2);
		color: var(--text-white);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		font-size: 1.2rem;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		height: 40px;
		backdrop-filter: blur(10px);
	}
	
	.theme-toggle:hover {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
		transform: scale(1.05);
	}

	/* Mobile Menu Styles */
	.mobile-menu-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		opacity: 1;
		animation: fadeIn 0.3s ease;
		cursor: pointer;
	}

	.mobile-menu-overlay:focus {
		outline: 2px solid var(--accent-color);
		outline-offset: -2px;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.mobile-menu {
		position: fixed;
		top: 0;
		left: -100%;
		width: 280px;
		height: 100%;
		background: var(--bg-primary);
		z-index: 1000;
		transition: left 0.3s ease;
		box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
	}

	.mobile-menu.open {
		left: 0;
	}

	.mobile-menu-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-secondary);
	}

	.mobile-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mobile-brand img {
		width: 24px;
		height: 24px;
	}

	.mobile-brand span {
		font-weight: 700;
		color: var(--text-primary);
	}

	.mobile-menu-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--text-primary);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.mobile-menu-close:hover {
		background: var(--border-color);
	}

	.mobile-menu-content {
		flex: 1;
		padding: 1rem 0;
		overflow-y: auto;
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		padding: 1rem 1.5rem;
		color: var(--text-primary);
		text-decoration: none;
		font-weight: 500;
		transition: background-color 0.2s ease;
		border-bottom: 1px solid var(--border-color);
	}

	.mobile-nav-link:hover {
		background: var(--bg-secondary);
	}

	.mobile-nav-link:last-child {
		border-bottom: none;
	}

	.mobile-nav-link.active {
		background: var(--accent-color);
		color: white;
		font-weight: 600;
	}
	
	main {
		flex: 1;
		padding: 2rem;
	}
	
	footer {
		background: var(--bg-footer);
		border-top: 2px solid var(--border-color);
		padding: 2rem;
		box-shadow: 0 -4px 12px rgba(11, 62, 116, 0.2);
		position: relative;
	}
	
	footer::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg-footer);
		z-index: -1;
	}
	
	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.footer-links {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	
	.footer-links a {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
		transition: all 0.2s ease;
	}
	
	.footer-links a:hover {
		color: var(--text-white);
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
	}
	
	.footer-info {
		text-align: center;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	@media (max-width: 768px) {
		.navbar {
			padding: 1rem;
		}

		/* Hide desktop menu on mobile */
		.nav-menu.desktop-menu {
			display: none;
		}

		/* Show mobile menu toggle */
		.mobile-menu-toggle {
			display: flex;
		}

		.nav-controls {
			gap: 0.5rem;
		}

		.language-selector {
			min-width: 70px;
			padding: 0.4rem 0.6rem;
		}

		main {
			padding: 1rem;
		}

		.footer-links {
			justify-content: center;
			gap: 0.5rem;
		}
	}
</style>