<script>
	import { _ } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$_('footer.about')} - {$_('meta.title')}</title>
</svelte:head>

<div class="about-page">
	<section class="hero">
		<h1>About Doichain wDOI/USDT Pool</h1>
		<p class="hero-subtitle">
			A decentralized exchange interface for trading wrapped Doichain tokens (wDOI) with USDT
		</p>
	</section>

	<section class="what-is">
		<h2>What is wDOI?</h2>
		<p>
			wDOI (Wrapped Doichain) is an ERC-20 token that represents Doichain (DOI) tokens on the Ethereum blockchain. 
			This allows DOI holders to participate in the Ethereum DeFi ecosystem while maintaining exposure to Doichain.
		</p>
		
		<div class="features-grid">
			<div class="feature-card">
				<h3>🏦 Custodial Wrapping</h3>
				<p>Secure wrapping of Doichain tokens through trusted custodians with full reserve backing and transparency.</p>
			</div>
			
			<div class="feature-card">
				<h3>💱 Instant Trading</h3>
				<p>Trade wDOI tokens with USDT instantly through our automated market maker (AMM) liquidity pool.</p>
			</div>
			
			<div class="feature-card">
				<h3>🔒 Security First</h3>
				<p>Built with security best practices including reentrancy guards, access controls, and emergency pause functionality.</p>
			</div>
			
			<div class="feature-card">
				<h3>🌍 Decentralized</h3>
				<p>Fully decentralized protocol with no central authority controlling your funds or transactions.</p>
			</div>
		</div>
	</section>

	<section class="how-it-works">
		<h2>How It Works</h2>
		<div class="steps">
			<div class="step">
				<div class="step-number">1</div>
				<div class="step-content">
					<h3>Connect Wallet</h3>
					<p>Connect your MetaMask wallet to the Sepolia testnet to get started.</p>
				</div>
			</div>
			
			<div class="step">
				<div class="step-number">2</div>
				<div class="step-content">
					<h3>Get Test Tokens</h3>
					<p>Acquire test USDT and wDOI tokens for trading on the testnet environment.</p>
				</div>
			</div>
			
			<div class="step">
				<div class="step-number">3</div>
				<div class="step-content">
					<h3>Trade Instantly</h3>
					<p>Swap between wDOI and USDT using our automated market maker with 0.3% trading fees.</p>
				</div>
			</div>
		</div>
	</section>

	<section class="technology">
		<h2>Technology Stack</h2>
		<div class="tech-grid">
			<div class="tech-item">
				<h4>Smart Contracts</h4>
				<ul>
					<li>Solidity 0.8.27</li>
					<li>OpenZeppelin libraries</li>
					<li>Hardhat development framework</li>
				</ul>
			</div>
			
			<div class="tech-item">
				<h4>Frontend</h4>
				<ul>
					<li>SvelteKit framework</li>
					<li>Ethers.js v6</li>
					<li>Responsive design</li>
				</ul>
			</div>
			
			<div class="tech-item">
				<h4>Blockchain</h4>
				<ul>
					<li>Ethereum Sepolia testnet</li>
					<li>MetaMask integration</li>
					<li>ERC-20 standard</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="risks">
		<h2>Important Risks</h2>
		<div class="risk-warning">
			<h3>⚠️ Please Read Carefully</h3>
			<p>
				DeFi protocols involve significant risks. Before using our service, please understand:
			</p>
			<ul>
				<li><strong>Smart Contract Risk:</strong> Bugs or vulnerabilities in smart contracts could lead to loss of funds</li>
				<li><strong>Market Risk:</strong> Token prices can be highly volatile and unpredictable</li>
				<li><strong>Impermanent Loss:</strong> Providing liquidity may result in losses compared to holding tokens</li>
				<li><strong>Technical Risk:</strong> Blockchain networks may experience congestion or downtime</li>
				<li><strong>Regulatory Risk:</strong> Future regulations may impact DeFi services</li>
			</ul>
			<p>
				<strong>Never invest more than you can afford to lose.</strong> Always conduct your own research and consider consulting with financial advisors.
			</p>
		</div>
	</section>

	<section class="community">
		<h2>Community & Support</h2>
		<div class="community-links">
			<div class="link-group">
				<h4>Development</h4>
				<ul>
					<li><a href="https://github.com/doichain" target="_blank" rel="noopener">GitHub Repository</a></li>
					<li><a href="/docs">Documentation</a></li>
					<li><a href="https://sepolia.etherscan.io" target="_blank" rel="noopener">Etherscan (Sepolia)</a></li>
				</ul>
			</div>
			
			<div class="link-group">
				<h4>Community</h4>
				<ul>
					<li><a href="https://doichain.org" target="_blank" rel="noopener">Doichain Website</a></li>
					<li><a href="https://discord.gg/doichain" target="_blank" rel="noopener">Discord Community</a></li>
					<li><a href="https://twitter.com/doichain" target="_blank" rel="noopener">Twitter Updates</a></li>
				</ul>
			</div>
		</div>
	</section>

	<section class="disclaimer">
		<h2>Disclaimer</h2>
		<p>
			This is experimental software provided "as is" without warranty of any kind. The developers and contributors 
			are not responsible for any losses, damages, or claims arising from the use of this software. 
			Use at your own risk and always conduct thorough research before making any financial decisions.
		</p>
	</section>
</div>

<style>
	.about-page {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
		line-height: 1.6;
	}
	
	.hero {
		text-align: center;
		margin-bottom: 3rem;
	}
	
	.hero h1 {
		font-size: 2.5rem;
		color: var(--accent-color);
		margin-bottom: 0.5rem;
	}
	
	.hero-subtitle {
		font-size: 1.2rem;
		color: var(--text-secondary);
		max-width: 600px;
		margin: 0 auto;
	}
	
	section {
		margin-bottom: 3rem;
	}
	
	section h2 {
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		font-size: 1.8rem;
	}
	
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}
	
	.feature-card {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid var(--border-color);
	}
	
	.feature-card h3 {
		margin-top: 0;
		color: var(--accent-color);
		font-size: 1.1rem;
	}
	
	.steps {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 2rem;
	}
	
	.step {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
	}
	
	.step-number {
		background: var(--accent-color);
		color: white;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 1.2rem;
		flex-shrink: 0;
	}
	
	.step-content h3 {
		margin-top: 0;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}
	
	.tech-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}
	
	.tech-item {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}
	
	.tech-item h4 {
		margin-top: 0;
		color: var(--accent-color);
	}
	
	.tech-item ul {
		margin-bottom: 0;
		padding-left: 1.2rem;
	}
	
	.risk-warning {
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 12px;
		padding: 2rem;
		margin-top: 1rem;
	}
	
	.risk-warning h3 {
		color: #856404;
		margin-top: 0;
	}
	
	.risk-warning ul {
		padding-left: 1.5rem;
	}
	
	.risk-warning li {
		margin-bottom: 0.8rem;
	}
	
	:global([data-theme="dark"]) .risk-warning {
		background: #3d3d00;
		border-color: #595900;
	}
	
	:global([data-theme="dark"]) .risk-warning h3 {
		color: #ffeb3b;
	}
	
	.community-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}
	
	.link-group {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}
	
	.link-group h4 {
		margin-top: 0;
		color: var(--accent-color);
	}
	
	.link-group ul {
		list-style: none;
		padding: 0;
	}
	
	.link-group li {
		margin-bottom: 0.5rem;
	}
	
	.link-group a {
		color: var(--text-primary);
		text-decoration: none;
	}
	
	.link-group a:hover {
		color: var(--accent-color);
		text-decoration: underline;
	}
	
	.disclaimer {
		background: var(--bg-secondary);
		padding: 2rem;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		font-style: italic;
		text-align: center;
	}
	
	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2rem;
		}
		
		.hero-subtitle {
			font-size: 1rem;
		}
		
		.step {
			flex-direction: column;
			text-align: center;
		}
	}
</style>