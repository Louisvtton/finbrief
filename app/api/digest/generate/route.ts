import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { generateDigest } from '@/lib/digest-builder'

// Allow up to 60s — generation calls Finnhub + NewsAPI + Claude
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { userId, digestType = 'pre' } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (!['pre', 'eod', 'weekly'].includes(digestType)) {
      return NextResponse.json({ error: 'Invalid digestType' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const content = await generateDigest(userId, digestType as 'pre' | 'eod' | 'weekly')

    const { data, error } = await supabase
      .from('digests')
      .insert({ user_id: userId, digest_type: digestType, content })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ digestId: data.id, content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
