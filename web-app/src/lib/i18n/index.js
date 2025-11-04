import { addMessages, init } from 'svelte-i18n';
import { browser } from '$app/environment';

import en from './en.json';
import de from './de.json';
import ru from './ru.json';

addMessages('en', en);
addMessages('de', de);
addMessages('ru', ru);

// Get initial locale from localStorage or default to 'en'
function getInitialLocale() {
	if (browser) {
		const stored = localStorage.getItem('locale');
		if (stored && (stored === 'en' || stored === 'de')) {
			return stored;
		}
		
		// Fallback to browser language detection
		const browserLang = navigator.language.split('-')[0];
		if (browserLang === 'de') {
			return 'de';
		}
	}
	return 'en';
}

init({
	fallbackLocale: 'en',
	initialLocale: getInitialLocale()
});