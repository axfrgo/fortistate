/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

const stripTrailingSlash = (value: string) => value.replace(/\/$/, '');

const INSPECTOR_HOST = stripTrailingSlash(
	process.env.NEXT_PUBLIC_INSPECTOR_URL ?? 'http://localhost:4000'
);

const PROXY_BASE = '/api/fortistate';

export const getInspectorHost = () => INSPECTOR_HOST;

export const buildInspectorHttpUrl = (
	path: string,
	params?: Record<string, string | undefined>
) => {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	const url = new URL(normalized, 'http://placeholder.local');

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (typeof value !== 'undefined') {
				url.searchParams.set(key, value);
			}
		});
	}

	const search = url.searchParams.toString();
	return `${PROXY_BASE}${url.pathname}${search ? `?${search}` : ''}`;
};

export const buildInspectorWsUrl = (path = '/ws') => {
	try {
		const url = new URL(INSPECTOR_HOST);
		url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
		url.pathname = `${url.pathname.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
		url.search = '';
		return url.toString();
	} catch (err) {
		console.warn('[Inspector utils] Invalid inspector host, falling back to ws://localhost:4000/ws', err);
		return 'ws://localhost:4000/ws';
	}
};

export const getInspectorDisplayHost = () => {
	return INSPECTOR_HOST.replace(/^https?:\/\//, '');
};

/**
 * Get the inspector token from localStorage or generate a default one
 * The inspector auto-detects this from URL params or localStorage
 */
export const getInspectorToken = (): string | null => {
	if (typeof window === 'undefined') return null;
	
	try {
		// Check localStorage first
		const stored = localStorage.getItem('fortistate-inspector-token');
		if (stored) return stored;
		
		// Check URL params
		const urlParams = new URLSearchParams(window.location.search);
		const urlToken = urlParams.get('token') || urlParams.get('inspectorToken');
		if (urlToken) {
			localStorage.setItem('fortistate-inspector-token', urlToken);
			return urlToken;
		}
	} catch (e) {
		console.debug('[inspector] Token detection failed', e);
	}
	
	return null;
};

/**
 * Set the inspector token and persist it
 */
export const setInspectorToken = (token: string) => {
	if (typeof window === 'undefined') return;
	
	try {
		localStorage.setItem('fortistate-inspector-token', token);
	} catch (e) {
		console.error('[inspector] Failed to save token', e);
	}
};

/**
 * Get the target store key that inspector should focus on
 * The inspector auto-detects the most relevant store using heuristics
 */
export const getTargetStoreKey = (): string | null => {
	if (typeof window === 'undefined') return null;
	
	try {
		return localStorage.getItem('fortistate-target-key');
	} catch (e) {
		return null;
	}
};

/**
 * Set the target store key for inspector
 */
export const setTargetStoreKey = (key: string) => {
	if (typeof window === 'undefined') return;
	
	try {
		localStorage.setItem('fortistate-target-key', key);
	} catch (e) {
		console.error('[inspector] Failed to save target key', e);
	}
};

/**
 * Open the inspector in a new window/tab
 */
export const openInspector = () => {
	if (typeof window === 'undefined') return;
	
	const token = getInspectorToken();
	const url = token 
		? `${INSPECTOR_HOST}?token=${encodeURIComponent(token)}`
		: INSPECTOR_HOST;
	
	window.open(url, '_blank');
};

/**
 * Check if inspector is reachable
 */
export const checkInspectorConnection = async (): Promise<boolean> => {
	try {
		const response = await fetch(`${INSPECTOR_HOST}/health`, {
			method: 'GET',
			mode: 'cors',
		});
		return response.ok;
	} catch (e) {
		return false;
	}
};

/**
 * Expose stores to the inspector for automatic detection
 * Call this in your app initialization
 */
export const exposeStoresToInspector = (storeKeys: string[]) => {
	if (typeof window === 'undefined') return;
	
	try {
		// Expose on window for inspector to discover
		(window as any).__FORTISTATE_STORES__ = storeKeys;
		console.debug('[inspector] Exposed stores:', storeKeys);
	} catch (e) {
		console.error('[inspector] Failed to expose stores', e);
	}
};

/**
 * Announce this app to the inspector
 */
export const announceToInspector = async (appInfo: {
	name: string;
	version?: string;
	stores: string[];
}) => {
	try {
		await fetch(buildInspectorHttpUrl('/announce'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(appInfo),
		});
		console.debug('[inspector] Announced app:', appInfo.name);
	} catch (e) {
		console.debug('[inspector] Failed to announce to inspector', e);
	}
};
