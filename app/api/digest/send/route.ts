import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateDigest } from '@/lib/digest-builder'
import { sendDigestEmail } from '@/lib/resend'

// Cron jobs can take a while — one generation+send per user
export const maxDuration = 300

// Called by Vercel cron
// POST /api/digest/send?type=pre   → pre-market (7am weekdays)
// POST /api/digest/send?type=eod   → end of day (5pm weekdays)
// POST /api/digest/send?type=weekly → weekly roundup (Friday 5pm)
export async function POST(req: NextRequest) {
  const digestType = (req.nextUrl.searchParams.get('type') as 'pre' | 'eod' | 'weekly') ?? 'pre'
  const supabase = createServiceClient()

  // Fetch all users who should receive this digest type
  let query = supabase
    .from('profiles')
    .select('id, name, email, frequency, digest_time')
    .not('email', 'is', null)
    .not('name', 'is', null)

  if (digestType === 'weekly') {
    // Weekly: anyone with +weekly in their frequency
    query = query.ilike('frequency', '%weekly%')
  } else if (digestType === 'pre') {
    query = query.or('digest_time.eq.pre,digest_time.eq.both')
  } else {
    query = query.or('digest_time.eq.eod,digest_time.eq.both')
  }

  const { data: profiles, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Process users one at a time to avoid overwhelming APIs
  let succeeded = 0
  let failed = 0
  const errors: string[] = []

  for (const profile of profiles ?? []) {
    try {
      const content = await generateDigest(profile.id, digestType)

      const { data: digest, error: insertError } = await supabase
        .from('digests')
        .insert({
          user_id: profile.id,
          digest_type: digestType,
          content,
          sent_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      if (profile.email) {
        await sendDigestEmail(profile.email, profile.name ?? 'there', content)
      }

      succeeded++
    } catch (err: any) {
      failed++
      errors.push(`${profile.id}: ${err.message}`)
    }
  }

  return NextResponse.json({ sent: succeeded, failed, errors })
}
