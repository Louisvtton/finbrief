'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) (e.target as HTMLElement).style.cssText += 'opacity:1;transform:translateY(0)' }),
      { threshold: 0.1 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function NavBar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1A1A1A' }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-0.5" onClick={() => setOpen(false)}>
          <span className="font-extrabold text-xl tracking-tight" style={{ color: '#1D9E75' }}>fin</span>
          <span className="font-extrabold text-xl tracking-tight text-white">brief</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {[['#digest', 'Digest'], ['#reader', 'Reader'], ['#how', 'How it works']].map(([h, l]) => (
            <a key={h} href={h} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">{l}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/login" className="text-sm px-5 py-2.5 rounded-lg text-white font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: '#1D9E75' }}>
            Get started
          </Link>
          {/* Hamburger */}
          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setOpen(o => !o)} aria-label="Menu">
            <span className="block w-5 h-0.5 bg-white transition-all" style={open ? { transform: 'rotate(45deg) translate(3px,3px)' } : {}} />
            <span className="block w-5 h-0.5 bg-white transition-all" style={open ? { opacity: 0 } : {}} />
            <span className="block w-5 h-0.5 bg-white transition-all" style={open ? { transform: 'rotate(-45deg) translate(3px,-3px)' } : {}} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-5 py-6 flex flex-col gap-5" style={{ backgroundColor: '#0D0D0D', borderColor: '#1A1A1A' }}>
          {[['#digest', 'Digest'], ['#reader', 'Reader'], ['#how', 'How it works'], ['/login', 'Sign in']].map(([h, l]) => (
            <a key={h} href={h} className="text-base font-medium text-zinc-300 hover:text-white transition-colors" onClick={() => setOpen(false)}>{l}</a>
          ))}
        </div>
      )}
    </nav>
  )
}

const rev = { opacity: 0, transform: 'translateY(32px)', transition: 'opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1)' } as React.CSSProperties
const revD = (d: number) => ({ ...rev, transitionDelay: `${d}s` }) as React.CSSProperties

export default function LandingPage() {
  useReveal()

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse-green { 0%,100% { box-shadow: 0 0 0 0 rgba(29,158,117,0.4) } 50% { box-shadow: 0 0 0 12px rgba(29,158,117,0) } }
        .anim-1 { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.1s both }
        .anim-2 { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.25s both }
        .anim-3 { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.4s both }
        .anim-4 { animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.55s both }
        .dot-pulse { animation: pulse-green 2s ease-in-out infinite }
        .hover-lift { transition: transform 0.3s cubic-bezier(.22,1,.36,1), border-color 0.3s ease }
        .hover-lift:hover { transform: translateY(-4px) }
        .hover-lift:hover { border-color: #2A2A2A !important }
      `}</style>

      <div style={{ backgroundColor: '#0A0A0A', color: '#fff', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
        <NavBar />

        {/* ══════════════════════════════
            HERO
        ══════════════════════════════ */}
        <section className="min-h-screen flex flex-col justify-center px-5 pt-16" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(29,158,117,0.12) 0%, transparent 70%)' }}>
          <div className="max-w-4xl mx-auto w-full py-24 md:py-32">

            {/* Live badge */}
            <div className="anim-1 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-10 border" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
              <span className="dot-pulse w-2 h-2 rounded-full block" style={{ backgroundColor: '#1D9E75' }} />
              <span className="text-xs font-medium text-zinc-400">AI-powered finance briefings</span>
            </div>

            <h1 className="anim-2 font-extrabold tracking-tight leading-[1.05] mb-7" style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)' }}>
              Your financial world,<br />
              <span style={{ color: '#1D9E75', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, fontStyle: 'italic' }}>
                explained every morning.
              </span>
            </h1>

            <p className="anim-3 text-lg md:text-xl text-zinc-400 leading-relaxed max-w-xl mb-10">
              Finbrief reads the markets and your newsletters so you don't have to. Two products, one account — built for investors who want clarity, not clutter.
            </p>

            <div className="anim-4 flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-85" style={{ backgroundColor: '#1D9E75' }}>
                Get started free
              </Link>
              <a href="#products" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-zinc-300 transition-colors hover:text-white border" style={{ borderColor: '#222' }}>
                See how it works
              </a>
            </div>
            <p className="anim-4 text-xs text-zinc-600 mt-4">No credit card. 2-minute setup.</p>
          </div>

          {/* Scroll indicator */}
          <div className="hidden md:flex justify-center pb-10">
            <div className="flex flex-col items-center gap-2 opacity-30">
              <span className="text-xs text-zinc-500">Scroll</span>
              <div className="w-px h-8 bg-zinc-600" />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            TWO PRODUCTS
        ══════════════════════════════ */}
        <section id="products" className="px-5 py-24 md:py-32" style={{ backgroundColor: '#0D0D0D' }}>
          <div className="max-w-5xl mx-auto">

            <div data-reveal style={rev} className="mb-14 md:mb-20">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#1D9E75' }}>Two products</p>
              <h2 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>
                One for your portfolio.<br />
                One for your inbox.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* DIGEST */}
              <div id="digest" data-reveal style={revD(0.1)} className="hover-lift rounded-2xl p-7 md:p-8 border flex flex-col" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 self-start" style={{ backgroundColor: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1D9E75' }} />
                  <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>Finbrief Digest</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3 text-white">
                  Know exactly what's moving in your portfolio — before markets open.
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-8 flex-1">
                  Add what you hold. Pick your schedule. Every morning (or evening, or weekly), Finbrief writes a briefing about your specific assets — not the whole market.
                </p>

                {/* Mini preview */}
                <div className="rounded-xl overflow-hidden mb-8 border" style={{ borderColor: '#222' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: '#1A1A1A', backgroundColor: '#0D0D0D' }}>
                    <p className="text-xs text-zinc-500">Pre-market briefing · Tuesday 7:02 AM</p>
                    <p className="text-sm text-white mt-1"><span className="font-semibold">Good morning.</span> Apple's upgrade is the standout on your watchlist today.</p>
                  </div>
                  <div className="px-3 py-3 space-y-1.5" style={{ backgroundColor: '#0A0A0A' }}>
                    {[
                      { t: 'AAPL', c: '+1.4%', up: true, n: 'Goldman upgrade ahead of earnings' },
                      { t: 'BTC',  c: '-2.1%', up: false, n: 'Back to $61k support level' },
                      { t: 'SPY',  c: '+0.3%', up: true, n: 'Futures pointing higher' },
                    ].map(a => (
                      <div key={a.t} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: '#111' }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold text-white shrink-0">{a.t}</span>
                          <span className="text-xs text-zinc-500 truncate">{a.n}</span>
                        </div>
                        <span className="text-sm font-semibold ml-3 shrink-0" style={{ color: a.up ? '#1D9E75' : '#EF4444' }}>{a.c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/login?product=digest" className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-85" style={{ backgroundColor: '#1D9E75' }}>
                  Start with Digest →
                </Link>
              </div>

              {/* READER */}
              <div id="reader" data-reveal style={revD(0.2)} className="hover-lift rounded-2xl p-7 md:p-8 border flex flex-col" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 self-start" style={{ backgroundColor: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
                  <span className="text-xs font-semibold" style={{ color: '#2563EB' }}>Finbrief Reader</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3 text-white">
                  Stop reading every article. Read only the ones that matter to you.
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-8 flex-1">
                  Connect your FT, Economist, or Bloomberg RSS feeds. Finbrief scans every article and surfaces only what's relevant to your interests — with AI summaries so you decide what's worth your time.
                </p>

                {/* Mini preview */}
                <div className="rounded-xl overflow-hidden mb-8 border" style={{ borderColor: '#222' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: '#1A1A1A', backgroundColor: '#0D0D0D' }}>
                    <p className="text-xs text-zinc-500">Your morning read · 3 of 14 articles flagged</p>
                  </div>
                  <div className="px-3 py-3 space-y-1.5" style={{ backgroundColor: '#0A0A0A' }}>
                    {[
                      { src: 'Financial Times',  title: 'UK utilities face regulatory headwind', tag: 'Matches your watchlist' },
                      { src: 'The Economist',    title: 'ECB policy shift and European equities', tag: 'Macro interest' },
                      { src: 'Bloomberg',        title: 'OPEC decision sets oil market tone', tag: 'Commodities' },
                    ].map(a => (
                      <div key={a.title} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#111' }}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-zinc-500">{a.src}</span>
                          <span className="text-xs font-medium" style={{ color: '#2563EB' }}>{a.tag}</span>
                        </div>
                        <p className="text-sm text-white leading-snug">{a.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/login?product=reader" className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-85" style={{ backgroundColor: '#2563EB' }}>
                  Start with Reader →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            HOW IT WORKS
        ══════════════════════════════ */}
        <section id="how" className="px-5 py-24 md:py-32 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-5xl mx-auto">
            <div data-reveal style={rev} className="mb-16 md:mb-20">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#1D9E75' }}>How it works</p>
              <h2 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>
                Set up in minutes.<br />
                <span style={{ color: '#777', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, fontStyle: 'italic' }}>Sharper every week.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">
              {/* Digest steps */}
              <div>
                <div data-reveal style={rev} className="flex items-center gap-3 mb-10">
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#1D9E75' }}>Digest</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#1A1A1A' }} />
                </div>
                <div className="space-y-10">
                  {[
                    { n: '01', title: 'Add what you hold', desc: 'Search any stock, ETF, crypto, or commodity — from NYSE to Euronext. Tap from popular picks or type any company name.' },
                    { n: '02', title: 'Choose your schedule', desc: 'Pre-market at 7am, end-of-day at 5pm, weekly recap — or any combination. Your inbox, your timing.' },
                    { n: '03', title: 'Read and refine', desc: 'Rate each briefing. Finbrief adapts the depth, tone, and focus based on what you engage with.' },
                  ].map((s, i) => (
                    <div key={s.n} data-reveal style={revD(i * 0.1)} className="flex gap-5">
                      <span className="text-3xl font-black shrink-0 leading-none mt-1" style={{ color: '#1A1A1A' }}>{s.n}</span>
                      <div>
                        <h4 className="text-base font-bold text-white mb-1.5">{s.title}</h4>
                        <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div data-reveal style={revD(0.3)} className="mt-10">
                  <Link href="/login?product=digest" className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: '#1D9E75' }}>
                    Start with Digest →
                  </Link>
                </div>
              </div>

              {/* Reader steps */}
              <div>
                <div data-reveal style={rev} className="flex items-center gap-3 mb-10">
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#2563EB' }}>Reader</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#1A1A1A' }} />
                </div>
                <div className="space-y-10">
                  {[
                    { n: '01', title: 'Connect your subscriptions', desc: 'Paste the RSS feed URL from any publication you already pay for. We show you exactly where to find it for the FT, Economist, Bloomberg, and more.' },
                    { n: '02', title: 'Pick your topics', desc: 'Macro, equities, fixed income, commodities, FX. Finbrief scores every article against what you actually care about.' },
                    { n: '03', title: 'Get your curated read', desc: 'Every morning: only the articles relevant to you, with summaries so you can decide what deserves your full attention.' },
                  ].map((s, i) => (
                    <div key={s.n} data-reveal style={revD(i * 0.1)} className="flex gap-5">
                      <span className="text-3xl font-black shrink-0 leading-none mt-1" style={{ color: '#1A1A1A' }}>{s.n}</span>
                      <div>
                        <h4 className="text-base font-bold text-white mb-1.5">{s.title}</h4>
                        <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div data-reveal style={revD(0.3)} className="mt-10">
                  <Link href="/login?product=reader" className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: '#2563EB' }}>
                    Start with Reader →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            FEATURES
        ══════════════════════════════ */}
        <section className="px-5 py-24 md:py-32 border-t" style={{ borderColor: '#1A1A1A', backgroundColor: '#0D0D0D' }}>
          <div className="max-w-5xl mx-auto">
            <div data-reveal style={rev} className="mb-14">
              <p className="text-xs font-semibold tracking-widest uppercase mb-4 text-zinc-500">Built for both</p>
              <h2 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>
                One account.<br />
                <span style={{ color: '#1D9E75', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, fontStyle: 'italic' }}>Both products.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: 'AI that learns from you', desc: 'Rate each briefing and Finbrief adjusts. The more you use it, the sharper it gets.', accent: '#1D9E75' },
                { title: 'Global market coverage', desc: 'US, European, and Asian equities. ETFs, crypto, commodities, forex. Any major exchange.', accent: '#1D9E75' },
                { title: 'Start with one, add the other', desc: 'Your watchlist and preferences carry across Digest and Reader. One login for both.', accent: '#2563EB' },
                { title: 'Delivered to your inbox', desc: 'No app to open. Your briefing arrives when you need it — before you reach for your phone.', accent: '#1D9E75' },
                { title: 'Any publication with RSS', desc: 'Reader works with every publication that has an RSS feed. We walk you through finding it.', accent: '#2563EB' },
                { title: 'Private by design', desc: 'Your watchlist and subscriptions are never shared or used to train models.', accent: '#777' },
              ].map((f, i) => (
                <div key={f.title} data-reveal style={revD((i % 3) * 0.1)} className="rounded-2xl p-6 border" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                  <div className="w-2 h-2 rounded-full mb-4" style={{ backgroundColor: f.accent }} />
                  <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            SOCIAL PROOF
        ══════════════════════════════ */}
        <section className="px-5 py-24 md:py-32 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-5xl mx-auto">
            <div data-reveal style={rev} className="mb-14">
              <h2 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>
                Built for people who<br />
                <span style={{ color: '#555', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, fontStyle: 'italic' }}>read to act</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { q: 'Finally a finance briefing built around what I hold, not the whole market. Every line is relevant.', name: 'Alex M.', role: 'Angel investor' },
                { q: 'I replaced three newsletters with Finbrief. The pre-market brief is part of my morning routine now.', name: 'Sarah K.', role: 'Portfolio manager' },
                { q: 'It knows my watchlist. That changes everything — no more sifting through market commentary I don\'t care about.', name: 'Tom R.', role: 'Day trader' },
              ].map((s, i) => (
                <div key={s.name} data-reveal style={revD(i * 0.1)} className="rounded-2xl p-6 border flex flex-col justify-between" style={{ borderColor: '#1A1A1A', backgroundColor: '#111' }}>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6">"{s.q}"</p>
                  <div>
                    <p className="text-sm font-bold text-white">{s.name}</p>
                    <p className="text-xs text-zinc-500">{s.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            FINAL CTA
        ══════════════════════════════ */}
        <section className="px-5 py-24 md:py-32 border-t" style={{ borderColor: '#1A1A1A', background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(29,158,117,0.1) 0%, transparent 70%)' }}>
          <div className="max-w-2xl mx-auto text-center">
            <div data-reveal style={rev}>
              <h2 className="font-extrabold tracking-tight mb-5" style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', lineHeight: 1.05 }}>
                Two ways to stay<br />
                <span style={{ color: '#1D9E75', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, fontStyle: 'italic' }}>ahead of the market</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10 leading-relaxed">Choose one or use both. One account, one login, free to start.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/login?product=digest" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-85" style={{ backgroundColor: '#1D9E75' }}>
                  Start with Digest
                </Link>
                <Link href="/login?product=reader" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-85" style={{ backgroundColor: '#2563EB' }}>
                  Start with Reader
                </Link>
              </div>
              <p className="text-xs text-zinc-600 mt-6">No credit card required.</p>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="px-5 py-8 border-t" style={{ borderColor: '#1A1A1A', backgroundColor: '#080808' }}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
            <div className="flex items-center gap-0.5">
              <span className="font-extrabold text-sm" style={{ color: '#1D9E75' }}>fin</span>
              <span className="font-extrabold text-sm text-zinc-400">brief</span>
            </div>
            <p>© {new Date().getFullYear()} Finbrief. Not financial advice.</p>
            <div className="flex gap-5">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
