interface ImportMetaEnv {
	readonly VITE_CLERK_PUBLISHABLE_KEY?: string
	readonly VITE_FORTISTATE_AUTH_BRIDGE_URL?: string
	readonly VITE_FORTISTATE_API_URL?: string
	readonly VITE_FORTISTATE_COLLAB_WS_URL?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
