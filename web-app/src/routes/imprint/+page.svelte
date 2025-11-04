<script>
	import { _ } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$_('footer.imprint')} - {$_('meta.title')}</title>
</svelte:head>

<div class="legal-page">
	<h1>Impressum / {$_('footer.imprint')}</h1>
	<div class="last-updated">Gemäß § 5 TMG / According to § 5 TMG</div>
	
	<section>
		<h2>Angaben gemäß § 5 TMG / Information according to § 5 TMG</h2>
		<div class="contact-info">
			<p><strong>Verantwortlich für den Inhalt / Responsible for content:</strong></p>
			<p>
				Doichain Foundation<br>
				[Address to be provided]<br>
				[City, Postal Code]<br>
				Deutschland / Germany
			</p>
		</div>
	</section>

	<section>
		<h2>Kontakt / Contact</h2>
		<div class="contact-info">
			<p><strong>E-Mail:</strong> legal@doichain.org</p>
			<p><strong>Website:</strong> doichain.org</p>
		</div>
	</section>

	<section>
		<h2>Umsatzsteuer-ID / VAT ID</h2>
		<p>
			Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br>
			[VAT ID to be provided]
		</p>
	</section>

	<section>
		<h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
		<div class="contact-info">
			<p>
				Doichain Foundation<br>
				[Address to be provided]<br>
				[City, Postal Code]<br>
				Deutschland / Germany
			</p>
		</div>
	</section>

	<section>
		<h2>Haftung für Inhalte / Liability for Content</h2>
		<p>
			Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
		</p>
		<p>
			As a service provider, we are responsible for our own content on these pages in accordance with § 7, para. 1 TMG under general law. However, according to §§ 8 to 10 TMG, we as a service provider are not under the obligation to monitor transmitted or stored external information or to research circumstances that indicate illegal activity.
		</p>
	</section>

	<section>
		<h2>Haftung für Links / Liability for Links</h2>
		<p>
			Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
		</p>
		<p>
			Our offer contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for this external content. The respective provider or operator of the pages is always responsible for the content of the linked pages.
		</p>
	</section>

	<section>
		<h2>Urheberrecht / Copyright</h2>
		<p>
			Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
		</p>
		<p>
			The content and works created by the site operators on these pages are subject to German copyright law. Reproduction, editing, distribution and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator.
		</p>
	</section>

	<section class="disclaimer">
		<h2>Disclaimer for DeFi Services</h2>
		<p>
			This website provides access to decentralized finance (DeFi) services. These services are experimental and involve significant risks. Users should understand that:
		</p>
		<ul>
			<li>Smart contracts may contain bugs or vulnerabilities</li>
			<li>Token values can be highly volatile</li>
			<li>Transactions on blockchain networks are irreversible</li>
			<li>Regulatory frameworks for DeFi are still developing</li>
		</ul>
		<p>
			Always conduct your own research and never invest more than you can afford to lose.
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
	
	.contact-info {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}
	
	.disclaimer {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		border-left: 4px solid var(--accent-color);
	}
	
	ul {
		padding-left: 1.5rem;
	}
	
	li {
		margin-bottom: 0.5rem;
	}
</style>