<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import SwapInterface from '$lib/components/SwapInterface.svelte';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
</script>

<svelte:head>
	<title>{$_('swap.title')} - {$_('meta.title')}</title>
	<meta name="description" content={$_('meta.description')} />
</svelte:head>

<div class="home-container">
	<NetworkWarning />
	
	<div class="hero-section">
		<h1>{$_('swap.title')}</h1>
		<p class="hero-subtitle">{$_('swap.subtitle')}</p>
	</div>
	
	<SwapInterface />
</div>

<style>
	.home-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 0 1rem;
	}
	
	.hero-section {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.hero-section h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		background: var(--gradient-brand);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 700;
	}
	
	.hero-subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin-bottom: 0;
	}
	
	@media (max-width: 768px) {
		.hero-section h1 {
			font-size: 2rem;
		}
		
		.hero-subtitle {
			font-size: 1rem;
		}
	}
</style>