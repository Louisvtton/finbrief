import LoginClient from './LoginClient'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams
  const product = params.product === 'reader' ? 'reader' : 'digest'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-0.5">
            <span className="font-extrabold text-2xl" style={{ color: '#1D9E75' }}>fin</span>
            <span className="font-extrabold text-2xl text-white">brief</span>
          </a>
          <p className="text-zinc-400 text-sm mt-2">
            {product === 'reader'
              ? 'Your subscriptions, distilled by AI'
              : 'Your personalised AI finance digest'}
          </p>
        </div>
        <LoginClient product={product} />
      </div>
    </div>
  )
}
