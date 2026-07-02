import { Resend } from 'resend'
import type { DigestContent } from '@/types'

const getResend = () => new Resend(process.env.RESEND_API_KEY!)
const from = process.env.RESEND_FROM_EMAIL ?? 'digest@finbrief.app'
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://finbrief-beryl.vercel.app'

export async function sendDigestEmail(
  to: string,
  userName: string,
  digest: DigestContent
): Promise<void> {
  const typeLabel =
    digest.digestType === 'pre' ? '☀️ Pre-market' :
    digest.digestType === 'weekly' ? '📅 Weekly roundup' :
    '📊 End of day'

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const subject = `${typeLabel} briefing — ${dateStr}`
  const html = buildEmailHtml(userName, digest, typeLabel, dateStr)

  const { error } = await getResend().emails.send({ from, to, subject, html })
  if (error) throw new Error(`Resend failed: ${error.message}`)
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  product: 'digest' | 'reader' = 'digest',
): Promise<void> {
  const isReader = product === 'reader'
  const otherProduct = isReader ? 'Digest' : 'Reader'
  const otherDesc = isReader
    ? 'Get a personalised AI briefing built around your watchlist and the industries you follow.'
    : 'Connect your FT, Economist, or Bloomberg subscription and let AI surface only the articles that matter to you.'
  const otherColor = isReader ? '#1D9E75' : '#2563EB'
  const otherLink = isReader ? `${appUrl}/login?product=digest` : `${appUrl}/login?product=reader`

  const { error } = await getResend().emails.send({
    from,
    to,
    subject: isReader
      ? 'Welcome to Finbrief Reader'
      : 'Welcome to Finbrief Digest',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
        <tr><td style="padding-bottom:24px">
          <span style="font-size:22px;font-weight:800;color:#1D9E75">fin</span><span style="font-size:22px;font-weight:800;color:#fff">brief</span>
        </td></tr>
        <tr><td style="background-color:#111;border-radius:16px;padding:32px;border:1px solid #222">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">Welcome, ${userName}.</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#999">Your ${isReader ? 'Reader' : 'Digest'} is set up and ready.</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding:14px 0;border-bottom:1px solid #1A1A1A">
              <span style="font-size:14px;color:#fff;font-weight:600">${isReader ? 'AI-curated reading' : 'Personalised briefings'}</span>
              <p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.5">${isReader ? 'Every morning, we read your subscriptions and surface only what matters to you.' : 'Claude reads the markets and writes a briefing tailored to your holdings and goals.'}</p>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid #1A1A1A">
              <span style="font-size:14px;color:#fff;font-weight:600">Delivered to your inbox</span>
              <p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.5">${isReader ? 'Your curated read arrives on the schedule you chose.' : 'Pre-market, end-of-day, or weekly — on your schedule.'}</p>
            </td></tr>
            <tr><td style="padding:14px 0">
              <span style="font-size:14px;color:#fff;font-weight:600">Gets smarter over time</span>
              <p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.5">The AI adapts based on your feedback and reading patterns.</p>
            </td></tr>
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="${appUrl}/digest" style="display:inline-block;background-color:${isReader ? '#2563EB' : '#1D9E75'};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px">
              ${isReader ? 'View your Reader' : 'Generate your first digest'}
            </a>
          </div>
        </td></tr>

        <!-- Cross-sell -->
        <tr><td style="padding-top:20px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#111;border-radius:12px;border:1px solid #222;padding:20px 24px">
            <tr><td>
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${otherColor};text-transform:uppercase;letter-spacing:0.1em">Also available</p>
              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#fff">Finbrief ${otherProduct}</p>
              <p style="margin:0 0 12px;font-size:13px;color:#666;line-height:1.5">${otherDesc}</p>
              <a href="${otherLink}" style="font-size:13px;font-weight:600;color:${otherColor};text-decoration:none">Try ${otherProduct} →</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding-top:20px;text-align:center">
          <span style="font-size:11px;color:#444"><span style="font-weight:700;color:#1D9E75">fin</span><span style="font-weight:700;color:#888">brief</span> · AI-powered finance intelligence</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
  if (error) throw new Error(`Resend welcome email failed: ${error.message}`)
}

const ASSET_COLORS: Record<string, { border: string; bg: string }> = {
  stock:     { border: '#534AB7', bg: '#EEEDFE' },
  etf:       { border: '#3B6D11', bg: '#EAF3DE' },
  crypto:    { border: '#854F0B', bg: '#FAEEDA' },
  commodity: { border: '#993C1D', bg: '#FAECE7' },
  forex:     { border: '#993556', bg: '#FBEAF0' },
}

function buildEmailHtml(
  name: string,
  digest: DigestContent,
  typeLabel: string,
  dateStr: string
): string {

  // Asset cards
  const assetCards = digest.assets.map(a => {
    const style = ASSET_COLORS[a.assetType] ?? ASSET_COLORS.stock
    const changeColor = a.direction === 'up' ? '#1D9E75' : a.direction === 'down' ? '#E53E3E' : '#888888'
    const arrow = a.direction === 'up' ? '▲' : a.direction === 'down' ? '▼' : '–'
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;border-radius:12px;overflow:hidden;background-color:${style.bg};border-left:4px solid ${style.border}">
        <tr>
          <td style="padding:14px 16px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-weight:700;font-size:15px;color:#1a1a1a">${a.ticker}</span>
                  <span style="font-size:13px;color:#666666;margin-left:8px">${a.name}</span>
                  <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;margin-left:8px;background-color:${style.border}22;color:${style.border}">${a.assetType.toUpperCase()}</span>
                </td>
                <td align="right" style="white-space:nowrap">
                  <span style="font-size:15px;font-weight:700;color:#1a1a1a">${a.price}</span>
                  <span style="font-size:13px;font-weight:600;color:${changeColor};margin-left:6px">${arrow} ${a.change}</span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:8px;font-size:13px;color:#555555;line-height:1.6">${a.insight}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
  }).join('')

  // News items
  const newsItems = digest.news.length > 0
    ? digest.news.map(n => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F0EDE7">
            ${n.url
              ? `<a href="${n.url}" style="color:#378ADD;text-decoration:none;font-size:14px;font-weight:500;line-height:1.4">${n.headline}</a>`
              : `<span style="color:#333333;font-size:14px;font-weight:500;line-height:1.4">${n.headline}</span>`
            }
            <div style="margin-top:4px">
              <span style="font-size:12px;color:#999999">${n.source}</span>
              ${n.industry ? `<span style="font-size:12px;color:#bbbbbb"> · ${n.industry}</span>` : ''}
            </div>
          </td>
        </tr>`).join('')
    : '<tr><td style="color:#999;font-size:13px;padding:8px 0">No industry news available.</td></tr>'

  // Extra indicators
  const extraRows = Object.entries(digest.marketMood.extraIndicators ?? {})
    .map(([k, v]) => `<span style="margin-right:16px;font-size:13px;color:#555555"><strong>${k}:</strong> ${v}</span>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Finbrief</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EB;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;color:#1D9E75">fin</span><span style="font-size:22px;font-weight:800;color:#1a1a1a">brief</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background-color:${digest.digestType === 'pre' ? '#FEF9EC' : digest.digestType === 'weekly' ? '#F5F3FF' : '#EEF4FF'};color:${digest.digestType === 'pre' ? '#92400E' : digest.digestType === 'weekly' ? '#6D28D9' : '#1E40AF'}">${typeLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Date + greeting -->
          <tr>
            <td style="background-color:#FFFFFF;border-radius:16px;padding:28px 28px 20px;margin-bottom:16px;border:1px solid #E8E0D4">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.08em">${dateStr}</p>
              <h1 style="margin:0 0 16px 0;font-size:24px;font-weight:800;color:#1a1a1a;line-height:1.2">Good ${digest.digestType === 'eod' ? 'evening' : 'morning'}, ${name}.</h1>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#444444">${digest.summary}</p>
            </td>
          </tr>

          <tr><td style="height:16px"></td></tr>

          <!-- Watchlist -->
          ${digest.assets.length > 0 ? `
          <tr>
            <td>
              <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:0.1em">Your Watchlist</p>
              ${assetCards}
            </td>
          </tr>
          <tr><td style="height:16px"></td></tr>
          ` : ''}

          <!-- Industry News -->
          ${digest.news.length > 0 ? `
          <tr>
            <td style="background-color:#FFFFFF;border-radius:16px;padding:24px 28px;border:1px solid #E8E0D4">
              <p style="margin:0 0 16px 0;font-size:11px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:0.1em">Industry News</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${newsItems}
              </table>
            </td>
          </tr>
          <tr><td style="height:16px"></td></tr>
          ` : ''}

          <!-- Market Mood -->
          <tr>
            <td style="background-color:#1D9E75;border-radius:16px;padding:24px 28px">
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;color:#B6E8D6;text-transform:uppercase;letter-spacing:0.1em">Market Mood</p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#FFFFFF;line-height:1.6">${digest.marketMood.sentiment}</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px;margin-right:8px">
                    <span style="font-size:12px;color:#B6E8D6;display:block">S&P 500</span>
                    <span style="font-size:15px;font-weight:700;color:#FFFFFF">${digest.marketMood.sp500Change}</span>
                  </td>
                  <td style="width:8px"></td>
                  <td style="background-color:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px">
                    <span style="font-size:12px;color:#B6E8D6;display:block">VIX</span>
                    <span style="font-size:15px;font-weight:700;color:#FFFFFF">${digest.marketMood.vix}</span>
                  </td>
                  <td style="width:8px"></td>
                  <td style="background-color:rgba(255,255,255,0.15);border-radius:8px;padding:8px 14px">
                    <span style="font-size:12px;color:#B6E8D6;display:block">Bullish score</span>
                    <span style="font-size:15px;font-weight:700;color:#FFFFFF">${digest.marketMood.bullishScore}/100</span>
                  </td>
                </tr>
              </table>
              ${extraRows ? `<p style="margin:12px 0 0 0">${extraRows}</p>` : ''}
            </td>
          </tr>

          <tr><td style="height:24px"></td></tr>

          <!-- CTA -->
          <tr>
            <td align="center">
              <a href="${appUrl}/digest" style="display:inline-block;background-color:#1a1a1a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px">
                View full digest in app →
              </a>
            </td>
          </tr>

          <tr><td style="height:32px"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #E8E0D4;padding-top:20px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:11px;color:#AAAAAA">
                      <span style="font-weight:700;color:#1D9E75">fin</span><span style="font-weight:700;color:#555">brief</span>
                      &nbsp;·&nbsp; Not financial advice &nbsp;·&nbsp; For informational purposes only
                    </span>
                  </td>
                  <td align="right">
                    <a href="${appUrl}/settings" style="font-size:11px;color:#AAAAAA;text-decoration:none">Manage preferences</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
