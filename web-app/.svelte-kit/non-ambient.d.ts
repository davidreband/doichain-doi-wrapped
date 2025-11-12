
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/about" | "/bridge" | "/cookies" | "/custodian" | "/custodian/enhanced" | "/direct" | "/imprint" | "/liquidity" | "/merchant" | "/privacy" | "/reserves" | "/terms";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/about": Record<string, never>;
			"/bridge": Record<string, never>;
			"/cookies": Record<string, never>;
			"/custodian": Record<string, never>;
			"/custodian/enhanced": Record<string, never>;
			"/direct": Record<string, never>;
			"/imprint": Record<string, never>;
			"/liquidity": Record<string, never>;
			"/merchant": Record<string, never>;
			"/privacy": Record<string, never>;
			"/reserves": Record<string, never>;
			"/terms": Record<string, never>
		};
		Pathname(): "/" | "/about" | "/about/" | "/bridge" | "/bridge/" | "/cookies" | "/cookies/" | "/custodian" | "/custodian/" | "/custodian/enhanced" | "/custodian/enhanced/" | "/direct" | "/direct/" | "/imprint" | "/imprint/" | "/liquidity" | "/liquidity/" | "/merchant" | "/merchant/" | "/privacy" | "/privacy/" | "/reserves" | "/reserves/" | "/terms" | "/terms/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | "/images/doi-logo.png" | "/images/doichain-logo.svg" | "/images/usdt-logo.svg" | "/images/wdoi-logo.svg" | string & {};
	}
}