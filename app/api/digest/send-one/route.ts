import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendDigestEmail } from '@/lib/resend'

export const maxDuration = 30

// POST /api/digest/send-one
// Sends a single already-generated digest to the user's email on demand
export async function POST(req: NextRequest) {
  try {
    const { userId, digestId } = await req.json()
    if (!userId || !digestId) {
      return NextResponse.json({ error: 'userId and digestId required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch the digest
    const { data: digest, error: digestError } = await supabase
      .from('digests')
      .select('content, digest_type')
      .eq('id', digestId)
      .eq('user_id', userId)
      .single()

    if (digestError || !digest) {
      return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
    }

    // Fetch user email + name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    await sendDigestEmail(profile.email, profile.name ?? 'there', digest.content)

    return NextResponse.json({ ok: true, sentTo: profile.email })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
