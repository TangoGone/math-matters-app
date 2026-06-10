export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Account Pending Approval</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Your account is waiting to be approved by an administrator. You'll be able to log in once approved.
        </p>
        <a href="/auth/login" className="text-blue-600 hover:underline text-sm mt-6 inline-block">
          Back to login
        </a>
      </div>
    </div>
  )
}