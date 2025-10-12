import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import {
	exchangeClerkTokenForFortistateSession,
	isFortistateBridgeConfigured,
	type FortistateSession,
} from './fortistateSessionBridge'
import { subscriptionActions } from '../subscription/subscriptionModel'
import type { UserAccount } from '../subscription/subscriptionModel'
import { sessionActions } from '../session/sessionPersistence'

type FortistateAuthStatus = 'idle' | 'loading' | 'ready' | 'error'

interface FortistateAuthContextValue {
	status: FortistateAuthStatus
	isLoaded: boolean
	isSignedIn: boolean
	clerkUser: ReturnType<typeof useUser>['user']
	fortistateSession: FortistateSession | null
	error: string | null
	refresh: () => Promise<void>
	bridgeConfigured: boolean
}

const FortistateAuthContext = createContext<FortistateAuthContextValue | null>(null)

interface FortistateAuthProviderProps {
	children: ReactNode
}

export function FortistateAuthProvider({ children }: FortistateAuthProviderProps) {
		const { isLoaded, isSignedIn, getToken } = useAuth()
	const { user } = useUser()
	const bridgeConfigured = isFortistateBridgeConfigured()
	const [status, setStatus] = useState<FortistateAuthStatus>('idle')
	const [session, setSession] = useState<FortistateSession | null>(null)
	const [error, setError] = useState<string | null>(null)

	const syncFortistateSession = useCallback(
		async (signal?: AbortSignal) => {
					const loaded = Boolean(isLoaded)
					const signedIn = Boolean(isSignedIn)

					if (!loaded) return

					if (!signedIn) {
				setSession(null)
				setStatus('idle')
				setError(null)
				return
			}

			if (!bridgeConfigured) {
				setSession(null)
				setStatus('ready')
				setError(null)
				return
			}

			setStatus((current) => (current === 'ready' ? current : 'loading'))
			setError(null)

			try {
				const clerkToken = await getToken({ template: 'fortistate' }).catch(() => getToken())

				if (!clerkToken) {
					throw new Error('Unable to retrieve Clerk session token for Fortistate exchange')
				}

				const result = await exchangeClerkTokenForFortistateSession(clerkToken, signal)
				setSession(result)
				setStatus('ready')
			} catch (err) {
				if ((err as Error).name === 'AbortError') {
					return
				}

				const message = err instanceof Error ? err.message : 'Unknown Fortistate auth error'
				setSession(null)
				setStatus('error')
				setError(message)
				console.error('[Fortistate Auth] Failed to exchange Clerk session for Fortistate session:', err)
			}
		},
		[bridgeConfigured, getToken, isLoaded, isSignedIn],
	)

	useEffect(() => {
		const controller = new AbortController()

		void syncFortistateSession(controller.signal)

		return () => {
			controller.abort()
		}
	}, [syncFortistateSession])

	// Initialize subscription when user signs in
	useEffect(() => {
		if (isLoaded && isSignedIn && user) {
			try {
				// Create/update user account in subscription store
				const account: UserAccount = {
					id: user.id,
					clerkUserId: user.id,
					email: user.primaryEmailAddress?.emailAddress || '',
					name: user.fullName || user.username || 'User',
					createdAt: typeof user.createdAt === 'number' ? user.createdAt : user.createdAt?.getTime() || Date.now(),
					subscriptionId: null, // Will be auto-created as free plan by constraint
				}
				subscriptionActions.setAccount(account)
				
				// Start session tracking
				const clerkSessionId = getToken.toString() // Use a session identifier
				sessionActions.startSession(user.id, clerkSessionId)
			} catch (error) {
				console.error('[Fortistate Auth] Failed to initialize subscription:', error)
				// Don't crash the app if subscription init fails
			}
		} else if (isLoaded && !isSignedIn) {
			try {
				// Clear subscription when user signs out
				subscriptionActions.clearCurrentUser()
				
				// End session tracking
				void sessionActions.endSession()
			} catch (error) {
				console.error('[Fortistate Auth] Failed to clear subscription:', error)
				// Don't crash the app if cleanup fails
			}
		}
	}, [isLoaded, isSignedIn, user, getToken])

	const refresh = useCallback(async () => {
		const controller = new AbortController()
		try {
			await syncFortistateSession(controller.signal)
		} finally {
			controller.abort()
		}
	}, [syncFortistateSession])

	const value = useMemo<FortistateAuthContextValue>(
			() => ({
			status,
				isLoaded: Boolean(isLoaded),
				isSignedIn: Boolean(isSignedIn),
			clerkUser: user ?? null,
			fortistateSession: session,
			error,
			refresh,
			bridgeConfigured,
		}),
			[bridgeConfigured, error, isLoaded, isSignedIn, refresh, session, status, user],
	)

	return <FortistateAuthContext.Provider value={value}>{children}</FortistateAuthContext.Provider>
}

export function useFortistateAuth(): FortistateAuthContextValue {
	const context = useContext(FortistateAuthContext)
	if (!context) {
		throw new Error('useFortistateAuth must be used within a FortistateAuthProvider')
	}
	return context
}
