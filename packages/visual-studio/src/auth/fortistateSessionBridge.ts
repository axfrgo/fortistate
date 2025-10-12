export interface FortistateSession {
	token: string
	expiresAt?: string
	issuedAt?: string
	userId?: string
}

export function getFortistateAuthBridgeUrl(): string | null {
	return import.meta.env.VITE_FORTISTATE_AUTH_BRIDGE_URL ?? null
}

export function isFortistateBridgeConfigured(): boolean {
	return Boolean(getFortistateAuthBridgeUrl())
}

export async function exchangeClerkTokenForFortistateSession(
	clerkToken: string,
	abortSignal?: AbortSignal,
): Promise<FortistateSession | null> {
	const bridgeUrl = getFortistateAuthBridgeUrl()

	if (!bridgeUrl) {
		console.warn('[Fortistate Auth] VITE_FORTISTATE_AUTH_BRIDGE_URL is not set; skipping Fortistate session exchange.')
		return null
	}

	if (!clerkToken) {
		console.warn('[Fortistate Auth] Clerk token missing; cannot request Fortistate session.')
		return null
	}

	const response = await fetch(bridgeUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${clerkToken}`,
		},
		body: JSON.stringify({}),
		signal: abortSignal,
	})

	if (!response.ok) {
		const message = await safeParseError(response)
		throw new Error(`Fortistate auth bridge error: ${message}`)
	}

	const payload = await response.json().catch(() => null)

	if (!payload || typeof payload !== 'object' || !('token' in payload) || !payload.token) {
		throw new Error('Fortistate auth bridge did not return a valid token payload')
	}

	const session: FortistateSession = {
		token: payload.token,
		expiresAt: normalizeTimestamp(payload.expiresAt ?? payload.expires_at),
		issuedAt: normalizeTimestamp(payload.issuedAt ?? payload.issued_at),
		userId: typeof payload.userId === 'string' ? payload.userId : payload.user_id,
	}

	return session
}

async function safeParseError(response: Response): Promise<string> {
	try {
		const data = await response.json()
		if (data && typeof data === 'object') {
			if (typeof data.error === 'string') return data.error
			if (typeof data.message === 'string') return data.message
		}
	} catch (_err) {
		/* swallow */
	}

	return `${response.status} ${response.statusText}`.trim()
}

function normalizeTimestamp(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim()) {
		return value
	}

	if (typeof value === 'number' && Number.isFinite(value)) {
		return new Date(value).toISOString()
	}

	return undefined
}
