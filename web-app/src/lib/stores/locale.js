import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { locale as svelteI18nLocale } from 'svelte-i18n';

// Create a custom locale store that persists to localStorage
function createLocaleStore() {
	const defaultLocale = 'en';
	
	// Get initial locale
	let initialLocale = defaultLocale;
	if (browser) {
		// Try localStorage first
		const stored = localStorage.getItem('locale');
		if (stored && (stored === 'en' || stored === 'de')) {
			initialLocale = stored;
		} else {
			// Try to detect from browser
			const browserLang = navigator.language.split('-')[0];
			if (browserLang === 'de') {
				initialLocale = 'de';
			}
		}
	}
	
	const { subscribe, set, update } = writable(initialLocale);
	
	return {
		subscribe,
		set: (newLocale) => {
			if (browser) {
				localStorage.setItem('locale', newLocale);
			}
			// Update svelte-i18n locale as well
			svelteI18nLocale.set(newLocale);
			set(newLocale);
		},
		init: () => {
			// Initialize svelte-i18n with stored locale
			svelteI18nLocale.set(initialLocale);
			set(initialLocale);
		}
	};
}

export const locale = createLocaleStore();