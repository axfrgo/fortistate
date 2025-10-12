export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-vscode-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-accent mb-2">
            FortiState
          </h1>
          <p className="text-vscode-text-secondary text-sm">
            User Admin Dashboard
          </p>
        </div>
        
        {/* Auth Forms Container */}
        <div className="vscode-panel p-8 rounded-lg shadow-xl">
          {children}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6 text-vscode-text-tertiary text-xs">
          © 2025 FortiState. All rights reserved.
        </div>
      </div>
    </div>
  );
}
