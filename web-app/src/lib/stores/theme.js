import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Initialize theme from localStorage or system preference
function createThemeStore() {
	const defaultTheme = 'light';
	
	// Get initial theme
	let initialTheme = defaultTheme;
	if (browser) {
		// Try localStorage first
		const stored = localStorage.getItem('theme');
		if (stored && (stored === 'light' || stored === 'dark')) {
			initialTheme = stored;
		} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			initialTheme = 'dark';
		}
		
		// Apply theme immediately to prevent flash
		document.body.setAttribute('data-theme', initialTheme);
	}
	
	const { subscribe, set, update } = writable(initialTheme);
	
	return {
		subscribe,
		set: (theme) => {
			if (browser) {
				localStorage.setItem('theme', theme);
				document.body.setAttribute('data-theme', theme);
			}
			set(theme);
		},
		toggle: () => {
			update(theme => {
				const newTheme = theme === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', newTheme);
					document.body.setAttribute('data-theme', newTheme);
				}
				return newTheme;
			});
		},
		syncWithMetaMask: (metaMaskTheme) => {
			if (metaMaskTheme && (metaMaskTheme === 'light' || metaMaskTheme === 'dark')) {
				if (browser) {
					localStorage.setItem('theme', metaMaskTheme);
					document.body.setAttribute('data-theme', metaMaskTheme);
				}
				set(metaMaskTheme);
			}
		}
	};
}

export const theme = createThemeStore();