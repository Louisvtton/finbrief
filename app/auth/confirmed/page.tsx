'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConfirmedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/onboarding'
  const [seconds, setSeconds] = useState(4)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(interval)
          router.push(next)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [next, router])

  const isOnboarding = next.includes('onboarding')

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#F8F5EF' }}
    >
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-2xl font-bold" style={{ color: '#1D9E75' }}>finbrief</span>
        </div>

        {/* Success card */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm px-8 py-10">
          {/* Checkmark */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#E8FAF4' }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 20L17 27L30 14"
                stroke="#1D9E75"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email confirmed!
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {isOnboarding
              ? "Your account is verified and ready. Let's set up your personalised finance digest."
              : "You're signed in and ready to go. Welcome back to Finbrief."}
          </p>

          {/* Progress ring */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => router.push(next)}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1D9E75' }}
            >
              {isOnboarding ? 'Set up my digest →' : 'Go to my digest →'}
            </button>
            <p className="text-xs text-gray-400">
              Redirecting automatically in {seconds}s…
            </p>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-xs text-gray-400 mt-6">
          Finbrief · AI-powered personal finance digest
        </p>
      </div>
    </div>
  )
}

export default function ConfirmedPage() {
  return (
    <Suspense>
      <ConfirmedContent />
    </Suspense>
  )
}
