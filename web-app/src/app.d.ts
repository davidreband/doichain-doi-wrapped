// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// MetaMask ethereum provider type definitions
	interface EthereumProvider {
		request: (args: { method: string; params?: any[] }) => Promise<any>;
		on: (eventName: string, handler: (...args: any[]) => void) => void;
		removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
		isMetaMask?: boolean;
		_metamask?: {
			getProviderState?: () => Promise<{ theme?: string }>;
		};
	}

	interface Window {
		ethereum?: EthereumProvider;
	}
}

export {};