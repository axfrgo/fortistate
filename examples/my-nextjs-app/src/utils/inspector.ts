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
