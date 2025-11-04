<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import '$lib/i18n';
	
	// Accept SvelteKit page props (this suppresses the warning)
	export let data = {};
	export let params = {};
	
	// Custom stores
	import { theme } from '$lib/stores/theme.js';
	import { locale } from '$lib/stores/locale.js';
	import { detectMetaMaskTheme } from '$lib/utils/metamask.js';
	
	// Initialize stores
	onMount(() => {
		locale.init();
		detectMetaMaskTheme();
	});
	
	// Handle locale changes
	function handleLocaleChange(event) {
		locale.set(event.target.value);
	}
	
	// Reactive theme application
	$: if (typeof document !== 'undefined') {
		document.body.setAttribute('data-theme', $theme);
	}
</script>

<svelte:head>
	<title>{$_('meta.title', { default: 'Doichain wDOI/USDT Pool' })}</title>
	<meta name="description" content={$_('meta.description', { default: 'Trade wDOI tokens with USDT instantly via MetaMask' })} />
</svelte:head>

<div class="app" data-theme={$theme}>
	<header>
		<nav class="navbar">
			<div class="nav-brand">
				<a href="/" class="brand-link">
					<img src="/images/doichain-logo.svg" alt="Doichain" />
					<span>wDOI Pool</span>
				</a>
			</div>

			<div class="nav-menu">
				<a href="/" class="nav-link">{$_('nav.swap', { default: 'Swap' })}</a>
				<a href="/liquidity" class="nav-link">{$_('nav.liquidity', { default: 'Liquidity' })}</a>
			</div>
			
			<div class="nav-controls">
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
				<p>&copy; 2024 Doichain wDOI Pool. {$_('footer.rights', { default: 'All rights reserved.' })}</p>
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
	
	.nav-menu {
		display: flex;
		align-items: center;
		gap: 1.5rem;
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
			flex-wrap: wrap;
			gap: 1rem;
		}

		.nav-menu {
			order: 3;
			width: 100%;
			justify-content: center;
			padding-top: 1rem;
			border-top: 1px solid rgba(255, 255, 255, 0.2);
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