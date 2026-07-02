import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase = createServiceClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (!profile?.email) return NextResponse.json({ error: 'No email found' }, { status: 404 })

    await sendWelcomeEmail(profile.email, profile.name ?? 'there')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
