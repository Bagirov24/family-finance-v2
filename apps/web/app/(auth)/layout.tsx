export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💰</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Finance</h1>
          <p className="text-muted-foreground text-sm mt-1">Умный учёт семейных финансов</p>
        </div>
        {children}
      </div>
    </div>
  )
}
