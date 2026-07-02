import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('watchlist_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(req: NextRequest) {
  try {
    const { userId, ticker, name, assetType } = await req.json()
    if (!userId || !ticker || !name || !assetType) {
      return NextResponse.json({ error: 'userId, ticker, name, assetType required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('watchlist_items')
      .insert({ user_id: userId, ticker: ticker.toUpperCase(), name, asset_type: assetType })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, userId } = await req.json()
    if (!id || !userId) return NextResponse.json({ error: 'id and userId required' }, { status: 400 })

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
