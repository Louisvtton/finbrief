import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getQuote, getCompanyNews, getDateRange } from '@/lib/finnhub'
import { getYahooQuote, toYahooTicker } from '@/lib/yahoo-finance'
import { generateDigestWithClaude } from '@/lib/claude'
import { Resend } from 'resend'

export const maxDuration = 60

const from = process.env.RESEND_FROM_EMAIL ?? 'digest@finbrief.app'
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://finbrief-beryl.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const { userId, ticker, name: assetName, assetType } = await req.json()
    if (!userId || !ticker) {
      return NextResponse.json({ error: 'userId and ticker required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name, job_role')
      .eq('id', userId)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // Fetch data for the asset
    const { from: dateFrom, to: dateTo } = getDateRange()
    let quote = await getQuote(ticker).catch(() => null)
    if (!quote || quote.c === 0) {
      quote = await getYahooQuote(toYahooTicker(ticker)).catch(() => null)
    }
    const news = await getCompanyNews(ticker, dateFrom, dateTo).catch(() => [])

    // Generate a focused report with Claude
    const systemPrompt = `You are a finance analyst writing a focused one-page report on ${assetName} (${ticker}) for ${profile.name ?? 'a user'}.

Write a concise, insightful report covering:
1. Current price and recent movement
2. Key news and events affecting this asset
3. Short-term outlook and what to watch

Be specific and data-driven. This is NOT financial advice.

Return ONLY a valid JSON object:
{
  "title": string,
  "summary": string (3-5 sentences, the main takeaway),
  "priceAnalysis": string (2-3 sentences about price action),
  "keyNews": Array<{ headline: string, detail: string }> (2-4 items),
  "outlook": string (2-3 sentences, what to watch next)
}`

    const userPrompt = `Current data for ${ticker} (${assetName}):

QUOTE: ${JSON.stringify(quote)}

RECENT NEWS:
${JSON.stringify(news.slice(0, 8), null, 2)}`

    const report = await generateDigestWithClaude(systemPrompt, userPrompt) as any

    // Build and send email
    const newsHtml = (report.keyNews ?? []).map((n: any) => `
      <tr><td style="padding:10px 0;border-bottom:1px solid #f0ede7">
        <span style="font-size:14px;font-weight:600;color:#1a1a1a">${n.headline}</span>
        <p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.5">${n.detail}</p>
      </td></tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F1EB;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
        <tr><td style="padding-bottom:24px">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><span style="font-size:22px;font-weight:800;color:#1D9E75">fin</span><span style="font-size:22px;font-weight:800;color:#1a1a1a">brief</span></td>
            <td align="right"><span style="font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;background-color:#534AB722;color:#534AB7">Asset Report</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="background-color:#FFFFFF;border-radius:16px;padding:28px;border:1px solid #E8E0D4">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.08em">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1a1a1a">${ticker} — ${assetName}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#444">${report.summary ?? ''}</p>
          ${report.priceAnalysis ? `
          <div style="background-color:#EEEDFE;border-left:4px solid #534AB7;border-radius:12px;padding:14px 16px;margin-bottom:16px">
            <span style="font-size:11px;font-weight:700;color:#534AB7;text-transform:uppercase;letter-spacing:0.08em">Price Analysis</span>
            <p style="margin:8px 0 0;font-size:14px;color:#333;line-height:1.6">${report.priceAnalysis}</p>
          </div>` : ''}
          ${newsHtml ? `
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em">Key Events</p>
          <table width="100%" cellpadding="0" cellspacing="0">${newsHtml}</table>` : ''}
          ${report.outlook ? `
          <div style="background-color:#E8FAF4;border-left:4px solid #1D9E75;border-radius:12px;padding:14px 16px;margin-top:16px">
            <span style="font-size:11px;font-weight:700;color:#1D9E75;text-transform:uppercase;letter-spacing:0.08em">Outlook</span>
            <p style="margin:8px 0 0;font-size:14px;color:#333;line-height:1.6">${report.outlook}</p>
          </div>` : ''}
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center">
          <a href="${appUrl}/digest" style="display:inline-block;background-color:#1a1a1a;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px">View full digest →</a>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center">
          <span style="font-size:11px;color:#aaa"><span style="font-weight:700;color:#1D9E75">fin</span><span style="font-weight:700;color:#555">brief</span> · Not financial advice · For informational purposes only</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const { error } = await resend.emails.send({
      from,
      to: profile.email,
      subject: `${ticker} report — ${assetName}`,
      html,
    })
    if (error) throw new Error(`Email failed: ${error.message}`)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
