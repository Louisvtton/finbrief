'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Mode = 'signin' | 'signup' | 'magic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

interface PasswordStrength {
  score: number   // 0-4
  label: string
  color: string
  checks: {
    length: boolean
    uppercase: boolean
    number: boolean
    special: boolean
  }
}

function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#1D9E75']
  return { score, label: labels[score], color: colors[score], checks }
}

export default function LoginClient({ product = 'digest' }: { product?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const reset = () => { setMessage(''); setError('') }
  const redirectTo = () => `${APP_URL || window.location.origin}/auth/callback?product=${product}`

  const strength = mode === 'signup' && password ? getPasswordStrength(password) : null
  const isStrongEnough = !strength || strength.score >= 3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    reset()

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo() },
        })
        if (error) throw error
        setMessage('Check your email — we sent you a magic link!')
      } else if (mode === 'signup') {
        if (!isStrongEnough) {
          throw new Error('Please choose a stronger password before continuing.')
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo() },
        })
        if (error) throw error
        setMessage('Account created! Check your email to confirm your address.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.session) {
          // Check if onboarding is complete
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.session.user.id)
            .single()

          router.refresh()
          if (!profile?.name) {
            router.push(`/onboarding?product=${product}`)
          } else {
            router.push('/digest')
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border p-7 shadow-sm" style={{ backgroundColor: '#111', borderColor: '#222' }}>
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg p-1 mb-6" style={{ backgroundColor: '#1A1A1A' }}>
        {([['signin', 'Sign in'], ['signup', 'Sign up'], ['magic', 'Magic link']] as [Mode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m as Mode); reset() }}
            className="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={
              mode === m
                ? { backgroundColor: '#222', color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }
                : { color: '#666' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
          />
        </div>

        {mode !== 'magic' && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={mode === 'signup' ? 8 : 6}
              className="w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
            />
            {/* Strength meter — only shown on signup */}
            {strength && (
              <div className="mt-2 space-y-2">
                {/* Bar */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors duration-200"
                      style={{
                        backgroundColor: i <= strength.score ? strength.color : '#e5e7eb',
                      }}
                    />
                  ))}
                </div>
                {/* Label */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                  <span className="text-xs text-gray-400">{strength.score}/4</span>
                </div>
                {/* Checklist */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  {[
                    { key: 'length',    label: '8+ characters' },
                    { key: 'uppercase', label: 'Uppercase letter' },
                    { key: 'number',    label: 'Number' },
                    { key: 'special',   label: 'Special character' },
                  ].map(({ key, label }) => {
                    const ok = strength.checks[key as keyof typeof strength.checks]
                    return (
                      <div key={key} className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: ok ? '#1D9E75' : '#d1d5db' }}>
                          {ok ? '✓' : '○'}
                        </span>
                        <span className="text-xs" style={{ color: ok ? '#374151' : '#9ca3af' }}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        {message && (
          <p className="text-xs text-[#1D9E75] bg-[#1D9E75]/10 rounded-lg px-3 py-2">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading || !isStrongEnough}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#1D9E75' }}
        >
          {loading
            ? 'Signing in…'
            : mode === 'signin'
            ? 'Sign in'
            : mode === 'signup'
            ? 'Create account'
            : 'Send magic link'}
        </button>
      </form>

      <p className="text-xs text-zinc-600 text-center mt-5">
        By continuing you agree this is a personal project and not financial advice.
      </p>
    </div>
  )
}
