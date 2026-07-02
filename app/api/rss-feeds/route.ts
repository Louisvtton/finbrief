import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('rss_feeds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feeds: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId, label, url } = await req.json()
  if (!userId || !label || !url) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('rss_feeds')
    .insert({ user_id: userId, label: label.trim(), url: url.trim() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feed: data })
}

export async function DELETE(req: NextRequest) {
  const { id, userId } = await req.json()
  if (!id || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rss_feeds')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
