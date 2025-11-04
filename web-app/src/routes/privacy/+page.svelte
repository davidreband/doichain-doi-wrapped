<script>
	import { _ } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$_('footer.privacy')} - {$_('meta.title')}</title>
</svelte:head>

<div class="legal-page">
	<h1>{$_('footer.privacy')}</h1>
	<div class="last-updated">Last updated: October 31, 2024</div>
	
	<section>
		<h2>1. Information We Collect</h2>
		<p>
			When you use our decentralized application (DApp), we may collect the following information:
		</p>
		<ul>
			<li>Wallet address when you connect your MetaMask wallet</li>
			<li>Transaction data that is publicly available on the blockchain</li>
			<li>Usage analytics to improve our service (anonymized)</li>
			<li>Language preferences and theme settings (stored locally)</li>
		</ul>
	</section>

	<section>
		<h2>2. How We Use Information</h2>
		<p>
			We use the collected information for:
		</p>
		<ul>
			<li>Facilitating token swaps and transactions</li>
			<li>Providing customer support</li>
			<li>Improving our DApp functionality</li>
			<li>Complying with legal obligations</li>
		</ul>
	</section>

	<section>
		<h2>3. Data Storage and Security</h2>
		<p>
			Your data security is important to us:
		</p>
		<ul>
			<li>We do not store private keys or seed phrases</li>
			<li>Transaction data is stored on the Ethereum blockchain</li>
			<li>Local preferences are stored in your browser only</li>
			<li>We implement industry-standard security measures</li>
		</ul>
	</section>

	<section>
		<h2>4. Third-Party Services</h2>
		<p>
			Our DApp integrates with:
		</p>
		<ul>
			<li>MetaMask wallet for transaction signing</li>
			<li>Ethereum blockchain networks</li>
			<li>IPFS for decentralized hosting (if applicable)</li>
		</ul>
	</section>

	<section>
		<h2>5. Your Rights (GDPR)</h2>
		<p>
			Under GDPR, you have the right to:
		</p>
		<ul>
			<li>Access your personal data</li>
			<li>Rectify inaccurate data</li>
			<li>Erase your data (where technically possible)</li>
			<li>Object to processing</li>
			<li>Data portability</li>
		</ul>
	</section>

	<section>
		<h2>6. Contact Information</h2>
		<p>
			For privacy-related questions, contact us at: <strong>privacy@doichain.org</strong>
		</p>
	</section>
</div>

<style>
	.legal-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		line-height: 1.6;
	}
	
	.legal-page h1 {
		color: var(--accent-color);
		border-bottom: 2px solid var(--border-color);
		padding-bottom: 0.5rem;
	}
	
	.last-updated {
		color: var(--text-secondary);
		font-style: italic;
		margin-bottom: 2rem;
	}
	
	section {
		margin-bottom: 2rem;
	}
	
	section h2 {
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	ul {
		padding-left: 1.5rem;
	}
	
	li {
		margin-bottom: 0.5rem;
	}
</style>