<script>
	import { _ } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$_('footer.cookies')} - {$_('meta.title')}</title>
</svelte:head>

<div class="legal-page">
	<h1>{$_('footer.cookies')}</h1>
	<div class="last-updated">Last updated: October 31, 2024</div>
	
	<section>
		<h2>What are Cookies?</h2>
		<p>
			Cookies are small text files that are stored on your device when you visit our DApp. They help us provide you with a better experience by remembering your preferences and settings.
		</p>
	</section>

	<section>
		<h2>How We Use Cookies</h2>
		<p>
			Our DApp uses the following types of local storage:
		</p>
		
		<div class="cookie-category">
			<h3>🔧 Essential Functionality</h3>
			<ul>
				<li><strong>Theme Preference:</strong> Remembers your light/dark mode setting</li>
				<li><strong>Language Selection:</strong> Stores your preferred language</li>
				<li><strong>Wallet Connection:</strong> Maintains connection state (does not store private keys)</li>
			</ul>
			<p class="cookie-note">These are stored in your browser's localStorage and are essential for the DApp to function properly.</p>
		</div>

		<div class="cookie-category">
			<h3>📊 Analytics (Optional)</h3>
			<ul>
				<li><strong>Usage Statistics:</strong> Anonymous data about page visits and features used</li>
				<li><strong>Performance Metrics:</strong> Loading times and error rates</li>
			</ul>
			<p class="cookie-note">These help us improve the DApp but are not required for functionality.</p>
		</div>
	</section>

	<section>
		<h2>Third-Party Cookies</h2>
		<p>
			Our DApp may interact with third-party services that set their own cookies:
		</p>
		<ul>
			<li><strong>MetaMask:</strong> May store wallet-related preferences</li>
			<li><strong>Blockchain Networks:</strong> Connection and transaction data</li>
		</ul>
		<p>
			We do not control these third-party cookies. Please refer to their respective privacy policies.
		</p>
	</section>

	<section>
		<h2>Managing Cookies</h2>
		<div class="management-info">
			<h3>Browser Settings</h3>
			<p>You can control cookies through your browser settings:</p>
			<ul>
				<li>View and delete existing cookies</li>
				<li>Block cookies from specific sites</li>
				<li>Block all cookies (may break functionality)</li>
			</ul>
			
			<h3>DApp Settings</h3>
			<p>You can manage DApp-specific settings:</p>
			<ul>
				<li>Language preference (top navigation)</li>
				<li>Theme preference (top navigation)</li>
				<li>Wallet disconnection (clears connection data)</li>
			</ul>
		</div>
	</section>

	<section>
		<h2>Data Retention</h2>
		<p>
			Local storage data is retained until:
		</p>
		<ul>
			<li>You manually clear your browser data</li>
			<li>You use the DApp's clear/reset functions</li>
			<li>Your browser automatically clears old data</li>
		</ul>
	</section>

	<section>
		<h2>GDPR Compliance</h2>
		<p>
			Under GDPR, you have the right to:
		</p>
		<ul>
			<li><strong>Access:</strong> See what data is stored locally</li>
			<li><strong>Deletion:</strong> Clear all stored data via browser settings</li>
			<li><strong>Objection:</strong> Disable non-essential analytics</li>
		</ul>
	</section>

	<section>
		<h2>Updates to This Policy</h2>
		<p>
			We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.
		</p>
	</section>

	<section>
		<h2>Contact Us</h2>
		<p>
			If you have questions about our use of cookies, please contact us at: <strong>privacy@doichain.org</strong>
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
	
	.cookie-category {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		margin: 1rem 0;
		border: 1px solid var(--border-color);
	}
	
	.cookie-category h3 {
		margin-top: 0;
		color: var(--accent-color);
	}
	
	.cookie-note {
		font-style: italic;
		color: var(--text-secondary);
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}
	
	.management-info {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}
	
	.management-info h3 {
		color: var(--accent-color);
		margin-bottom: 0.5rem;
	}
	
	ul {
		padding-left: 1.5rem;
	}
	
	li {
		margin-bottom: 0.5rem;
	}
</style>