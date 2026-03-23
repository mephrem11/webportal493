export function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">Signing You In...</h1>
        <p className="mt-3 text-sm text-gray-600">
          Please wait while we complete your Auth0 sign-in.
        </p>
      </section>
    </main>
  );
}
