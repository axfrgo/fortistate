const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''

if (!publishableKey) {
  console.warn(
    '[Fortistate Auth] Missing VITE_CLERK_PUBLISHABLE_KEY. ClerkProvider will render a fallback until the key is provided.',
  )
}

export const clerkPublishableKey = publishableKey

export function assertClerkEnv(): string {
  if (!clerkPublishableKey) {
    throw new Error(
      'VITE_CLERK_PUBLISHABLE_KEY is not defined. Please set it in your environment before starting the Visual Studio dev server.',
    )
  }

  return clerkPublishableKey
}
