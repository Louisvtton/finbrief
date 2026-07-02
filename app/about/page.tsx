import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="border-b border-zinc-100 px-6 py-4 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <span className="font-extrabold text-xl tracking-tight" style={{ color: '#1D9E75' }}>fin</span>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">brief</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg text-white font-semibold shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#1D9E75' }}
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16">
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#1D9E75' }}>About Finbrief</p>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-8">
          We built the newsletter<br />
          <span
            className="italic"
            style={{ color: '#1D9E75', fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            we were tired of not having.
          </span>
        </h1>
      </section>

      {/* Main copy */}
      <section className="max-w-3xl mx-auto px-6 pb-20 space-y-8 text-lg text-gray-600 leading-relaxed">

        <p>
          Let's be honest — most finance newsletters are <span className="font-semibold text-gray-900">terrible</span>. They're written for a mythical average reader who cares equally about oil futures, semiconductor earnings, and whatever macro trend the author wants to talk about this week. You scroll through three paragraphs about a sector you don't follow, a company you don't hold, and a currency pair that has nothing to do with your portfolio — just to find the one sentence that actually applies to you.
        </p>

        <p>
          And then there are five more newsletters in your inbox doing exactly the same thing.
        </p>

        <p>
          The problem isn't that financial news is bad. It's that <span className="font-semibold text-gray-900">it was never designed for you specifically</span>. A Bloomberg terminal costs $24,000 a year and still doesn't summarise your exact holdings every morning. A financial advisor calls you once a quarter. Your brokerage app shows you numbers but doesn't tell you what they mean.
        </p>

        <div className="border-l-4 pl-6 my-10" style={{ borderColor: '#1D9E75' }}>
          <p className="text-2xl font-bold text-gray-900 italic leading-snug" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            "What if your morning briefing was written by someone who knew exactly what you held, what you followed, and how you liked to receive information?"
          </p>
        </div>

        <p>
          That's the question that led to Finbrief. We connected Claude — Anthropic's AI, one of the most capable language models in the world — to live market data, and gave it one job: write a daily briefing for <em>you</em>. Not for a demographic. Not for "retail investors." For the specific person with the specific portfolio who signed up and said "here's what I care about."
        </p>

        <p>
          Every morning before the market opens, and every evening after it closes, Finbrief pulls live prices and news for your watchlist, scans the industries you follow, reads the feedback you left on your last digest, and hands all of it to Claude. What comes back is a briefing that reads like it was written by a well-informed analyst who happens to know your portfolio inside out.
        </p>

        <p>
          It's not financial advice. It's something more useful: <span className="font-semibold text-gray-900">context</span>. The kind that helps you start the day knowing exactly what moved, why it matters to you, and what to watch.
        </p>
      </section>

      {/* Founder section */}
      <section className="bg-zinc-950 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-sm font-semibold uppercase tracking-widest mb-10" style={{ color: '#1D9E75' }}>The Founder</p>
          <div className="flex flex-col md:flex-row items-start gap-10">
            {/* Initials avatar */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shrink-0"
              style={{ background: 'linear-gradient(135deg, #1D9E75, #378ADD)' }}
            >
              LS
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-1">Louis Sost</h2>
              <p className="text-sm font-medium mb-6" style={{ color: '#1D9E75' }}>Founder, Finbrief</p>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  I built Finbrief because I was drowning in generic finance content and starving for relevant information. Every morning I'd open my inbox, skim five newsletters, and still not have a clear picture of what mattered for my specific holdings that day.
                </p>
                <p>
                  The technology to fix this finally exists. Large language models can read, reason, and write. Live market data is accessible. The only thing missing was a product that connected them properly — one that put <em>your</em> portfolio at the centre of the experience rather than as an afterthought.
                </p>
                <p>
                  Finbrief is that product. I'm building it for investors who are tired of being treated like everyone else.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-12 tracking-tight">What we believe</h2>
          <div className="space-y-8">
            {[
              {
                title: 'Relevance over volume',
                body: 'One piece of information that applies to your situation is worth more than a hundred that don\'t. We obsess over signal-to-noise ratio.',
              },
              {
                title: 'Personalisation isn\'t a feature, it\'s the product',
                body: 'Generic is easy. Tailored is hard. We chose hard because that\'s what actually makes someone\'s morning better.',
              },
              {
                title: 'Honest about what we are',
                body: 'Finbrief is not a financial advisor. It\'s a well-informed briefing tool. We\'re upfront about that in every digest, every email, every page.',
              },
              {
                title: 'Built to get smarter',
                body: 'Every rating you give, every tag you select, every note you leave makes your next digest better. This is a product that improves because you use it.',
              },
            ].map(v => (
              <div key={v.title} className="flex gap-6 items-start">
                <div className="w-2 h-2 rounded-full mt-2.5 shrink-0" style={{ backgroundColor: '#1D9E75' }} />
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{v.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6" style={{ background: 'linear-gradient(135deg, #f0fdf8 0%, #eff6ff 100%)' }}>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">Ready to read the news that's actually about you?</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Set up takes 2 minutes. Your first digest is generated the moment you finish onboarding.</p>
        <Link
          href="/login"
          className="inline-block px-10 py-4 rounded-xl text-white font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1D9E75' }}
        >
          Get my first briefing →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span className="font-extrabold" style={{ color: '#1D9E75' }}>fin</span>
            <span className="font-extrabold text-gray-700">brief</span>
          </div>
          <p>© {new Date().getFullYear()} Finbrief · Not financial advice · Built with Claude AI</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
