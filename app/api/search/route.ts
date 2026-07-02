import { NextRequest, NextResponse } from 'next/server'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'

// Popular crypto — Yahoo Finance format
const POPULAR_CRYPTO = [
  { ticker: 'BTC-USD',  name: 'Bitcoin',   assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'ETH-USD',  name: 'Ethereum',  assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'SOL-USD',  name: 'Solana',    assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'BNB-USD',  name: 'BNB',       assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'XRP-USD',  name: 'XRP',       assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'ADA-USD',  name: 'Cardano',   assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'DOGE-USD', name: 'Dogecoin',  assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'AVAX-USD', name: 'Avalanche', assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'LINK-USD', name: 'Chainlink', assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'DOT-USD',  name: 'Polkadot',  assetType: 'crypto', exchange: 'Crypto' },
  { ticker: 'LTC-USD',  name: 'Litecoin',  assetType: 'crypto', exchange: 'Crypto' },
]

// Popular commodities — Yahoo Finance futures symbols
const POPULAR_COMMODITIES = [
  { ticker: 'GC=F', name: 'Gold',            assetType: 'commodity', exchange: 'Commodities' },
  { ticker: 'SI=F', name: 'Silver',          assetType: 'commodity', exchange: 'Commodities' },
  { ticker: 'CL=F', name: 'Crude Oil (WTI)', assetType: 'commodity', exchange: 'Commodities' },
  { ticker: 'BZ=F', name: 'Brent Crude',     assetType: 'commodity', exchange: 'Commodities' },
  { ticker: 'NG=F', name: 'Natural Gas',     assetType: 'commodity', exchange: 'Commodities' },
  { ticker: 'HG=F', name: 'Copper',          assetType: 'commodity', exchange: 'Commodities' },
  { ticker: 'ZC=F', name: 'Corn Futures',    assetType: 'commodity', exchange: 'Commodities' },
  { ticker: 'ZW=F', name: 'Wheat Futures',   assetType: 'commodity', exchange: 'Commodities' },
  { ticker: 'PL=F', name: 'Platinum',        assetType: 'commodity', exchange: 'Commodities' },
]

// Popular ETFs — mix of US and global
const POPULAR_ETFS = [
  // US broad market
  { ticker: 'SPY',  name: 'SPDR S&P 500 ETF',             assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'QQQ',  name: 'Invesco Nasdaq 100 ETF',        assetType: 'etf', exchange: 'NASDAQ' },
  { ticker: 'IWM',  name: 'iShares Russell 2000 ETF',      assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'VOO',  name: 'Vanguard S&P 500 ETF',          assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'VTI',  name: 'Vanguard Total Stock Market',   assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'DIA',  name: 'SPDR Dow Jones Industrial ETF', assetType: 'etf', exchange: 'NYSE' },
  // Sector ETFs
  { ticker: 'XLF',  name: 'Financial Select Sector SPDR',  assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'XLK',  name: 'Technology Select Sector SPDR', assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'XLE',  name: 'Energy Select Sector SPDR',     assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'XLV',  name: 'Health Care Select Sector SPDR',assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'ARKK', name: 'ARK Innovation ETF',            assetType: 'etf', exchange: 'NYSE' },
  // International
  { ticker: 'EWU',  name: 'iShares MSCI United Kingdom',   assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'EWG',  name: 'iShares MSCI Germany',          assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'EWQ',  name: 'iShares MSCI France',           assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'EWI',  name: 'iShares MSCI Italy',            assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'VGK',  name: 'Vanguard FTSE Europe ETF',      assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'FEZ',  name: 'SPDR Euro Stoxx 50 ETF',        assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'EEM',  name: 'iShares MSCI Emerging Markets', assetType: 'etf', exchange: 'NYSE' },
  // Fixed income
  { ticker: 'TLT',  name: 'iShares 20+ Year Treasury Bond',assetType: 'etf', exchange: 'NASDAQ' },
  { ticker: 'HYG',  name: 'iShares High Yield Corporate Bond',assetType:'etf',exchange: 'NYSE' },
  // Commodity ETFs
  { ticker: 'GLD',  name: 'SPDR Gold Shares',              assetType: 'etf', exchange: 'NYSE' },
  { ticker: 'SLV',  name: 'iShares Silver Trust',          assetType: 'etf', exchange: 'NYSE' },
  // European-listed ETFs (LSE)
  { ticker: 'VUSA.L', name: 'Vanguard S&P 500 UCITS ETF (LSE)', assetType: 'etf', exchange: 'LSE' },
  { ticker: 'CSPX.L', name: 'iShares Core S&P 500 UCITS ETF',   assetType: 'etf', exchange: 'LSE' },
  { ticker: 'SWRD.L', name: 'SPDR MSCI World UCITS ETF',         assetType: 'etf', exchange: 'LSE' },
  { ticker: 'VWRL.L', name: 'Vanguard FTSE All-World UCITS ETF', assetType: 'etf', exchange: 'LSE' },
  { ticker: 'ISF.L',  name: 'iShares Core FTSE 100 UCITS ETF',  assetType: 'etf', exchange: 'LSE' },
]

// Popular European stocks by exchange
const POPULAR_EU_STOCKS = [
  // UK — London Stock Exchange (.L)
  { ticker: 'SHEL.L', name: 'Shell',               assetType: 'stock', exchange: 'LSE' },
  { ticker: 'AZN.L',  name: 'AstraZeneca',         assetType: 'stock', exchange: 'LSE' },
  { ticker: 'HSBA.L', name: 'HSBC',                assetType: 'stock', exchange: 'LSE' },
  { ticker: 'BP.L',   name: 'BP',                  assetType: 'stock', exchange: 'LSE' },
  { ticker: 'ULVR.L', name: 'Unilever',            assetType: 'stock', exchange: 'LSE' },
  { ticker: 'GSK.L',  name: 'GSK',                 assetType: 'stock', exchange: 'LSE' },
  { ticker: 'RIO.L',  name: 'Rio Tinto',           assetType: 'stock', exchange: 'LSE' },
  { ticker: 'BARC.L', name: 'Barclays',            assetType: 'stock', exchange: 'LSE' },
  { ticker: 'LLOY.L', name: 'Lloyds Banking Group',assetType: 'stock', exchange: 'LSE' },
  { ticker: 'VOD.L',  name: 'Vodafone',            assetType: 'stock', exchange: 'LSE' },
  { ticker: 'BA.L',   name: 'BAE Systems',         assetType: 'stock', exchange: 'LSE' },
  { ticker: 'REL.L',  name: 'RELX',                assetType: 'stock', exchange: 'LSE' },
  { ticker: 'RR.L',   name: 'Rolls-Royce',         assetType: 'stock', exchange: 'LSE' },
  { ticker: 'STAN.L', name: 'Standard Chartered',  assetType: 'stock', exchange: 'LSE' },
  // France — Euronext Paris (.PA)
  { ticker: 'MC.PA',  name: 'LVMH',                assetType: 'stock', exchange: 'Paris' },
  { ticker: 'TTE.PA', name: 'TotalEnergies',       assetType: 'stock', exchange: 'Paris' },
  { ticker: 'SAN.PA', name: 'Sanofi',              assetType: 'stock', exchange: 'Paris' },
  { ticker: 'AIR.PA', name: 'Airbus',              assetType: 'stock', exchange: 'Paris' },
  { ticker: 'BNP.PA', name: 'BNP Paribas',         assetType: 'stock', exchange: 'Paris' },
  { ticker: 'OR.PA',  name: "L'Oréal",             assetType: 'stock', exchange: 'Paris' },
  { ticker: 'CS.PA',  name: 'AXA',                 assetType: 'stock', exchange: 'Paris' },
  { ticker: 'KER.PA', name: 'Kering',              assetType: 'stock', exchange: 'Paris' },
  { ticker: 'RI.PA',  name: 'Pernod Ricard',       assetType: 'stock', exchange: 'Paris' },
  // Germany — XETRA (.DE)
  { ticker: 'SAP.DE', name: 'SAP',                 assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'SIE.DE', name: 'Siemens',             assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'ALV.DE', name: 'Allianz',             assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'DTE.DE', name: 'Deutsche Telekom',    assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'BMW.DE', name: 'BMW',                 assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'MBG.DE', name: 'Mercedes-Benz',       assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'VOW3.DE',name: 'Volkswagen',          assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'BAS.DE', name: 'BASF',                assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'DBK.DE', name: 'Deutsche Bank',       assetType: 'stock', exchange: 'XETRA' },
  { ticker: 'ADS.DE', name: 'Adidas',              assetType: 'stock', exchange: 'XETRA' },
  // Netherlands
  { ticker: 'ASML.AS',name: 'ASML',               assetType: 'stock', exchange: 'Amsterdam' },
  { ticker: 'HEIA.AS',name: 'Heineken',            assetType: 'stock', exchange: 'Amsterdam' },
  // Switzerland
  { ticker: 'NESN.SW',name: 'Nestlé',             assetType: 'stock', exchange: 'SIX' },
  { ticker: 'NOVN.SW',name: 'Novartis',            assetType: 'stock', exchange: 'SIX' },
  { ticker: 'ROG.SW', name: 'Roche',               assetType: 'stock', exchange: 'SIX' },
  // Italy
  { ticker: 'ENI.MI', name: 'Eni',                 assetType: 'stock', exchange: 'Milan' },
  { ticker: 'ENEL.MI',name: 'Enel',                assetType: 'stock', exchange: 'Milan' },
  // Spain
  { ticker: 'SAN.MC', name: 'Banco Santander',     assetType: 'stock', exchange: 'Madrid' },
  { ticker: 'IBE.MC', name: 'Iberdrola',           assetType: 'stock', exchange: 'Madrid' },
]

function toAssetType(finnhubType: string): string {
  const t = finnhubType?.toLowerCase()
  if (t === 'crypto') return 'crypto'
  if (t === 'forex') return 'forex'
  if (t === 'etf' || t === 'fund') return 'etf'
  return 'stock'
}

function matches(q: string, name: string, ticker: string): boolean {
  const lq = q.toLowerCase()
  return (
    name.toLowerCase().includes(lq) ||
    ticker.toLowerCase().includes(lq) ||
    ticker.toLowerCase().replace(/\.[a-z]+$/, '').includes(lq) // strip exchange suffix: SHEL.L → shel
  )
}

// Convert Finnhub exchange-prefixed symbols to Yahoo Finance format
// e.g. EURONEXT:RNO → RNO.PA, XETRA:SAP → SAP.DE, LSE:SHEL → SHEL.L
const EXCHANGE_SUFFIX: Record<string, string> = {
  'EURONEXT': '.PA',   // Euronext Paris (also Brussels/Amsterdam but .PA is most common)
  'XETRA':    '.DE',
  'LSE':      '.L',
  'MIL':      '.MI',
  'BME':      '.MC',
  'SIX':      '.SW',
  'AMS':      '.AS',
  'EPA':      '.PA',
  'ETR':      '.DE',
  'ELI':      '.BR',
  'HEL':      '.HE',
  'OSL':      '.OL',
  'STO':      '.ST',
  'CPH':      '.CO',
}

function convertFinnhubSymbol(symbol: string): string | null {
  if (!symbol.includes(':')) return symbol
  const [exchange, base] = symbol.split(':', 2)
  const suffix = EXCHANGE_SUFFIX[exchange.toUpperCase()]
  if (!suffix) return null  // unknown exchange — skip
  return base + suffix
}

function exchangeLabel(symbol: string): string {
  if (!symbol.includes(':')) return symbol
  const exchange = symbol.split(':')[0].toUpperCase()
  const labels: Record<string, string> = {
    'EURONEXT': 'Paris', 'EPA': 'Paris',
    'XETRA': 'XETRA', 'ETR': 'XETRA',
    'LSE': 'LSE',
    'MIL': 'Milan',
    'BME': 'Madrid',
    'SIX': 'SIX',
    'AMS': 'Amsterdam',
  }
  return labels[exchange] ?? exchange
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 1) return NextResponse.json({ results: [] })

  try {
    const token = process.env.FINNHUB_API_KEY

    const finnhubPromise = fetch(
      `${FINNHUB_BASE}/search?q=${encodeURIComponent(q)}&token=${token}`,
      { next: { revalidate: 60 } }
    ).then(r => r.ok ? r.json() : { result: [] }).catch(() => ({ result: [] }))

    const [finnhubData] = await Promise.all([finnhubPromise])

    // Clean Finnhub results — skip crypto (we have our own cleaner list)
    // Convert exchange-prefixed EU symbols (EURONEXT:RNO → RNO.PA) instead of discarding them
    const finnhubResults = (finnhubData.result ?? [])
      .filter((r: any) => {
        if (!r.symbol || !r.description) return false
        if (r.type?.toLowerCase() === 'crypto') return false
        return true
      })
      .map((r: any) => {
        const convertedTicker = convertFinnhubSymbol(r.symbol)
        if (!convertedTicker) return null  // unknown exchange prefix — skip
        return {
          ticker: convertedTicker,
          name: r.description,
          assetType: toAssetType(r.type),
          exchange: r.symbol.includes(':') ? exchangeLabel(r.symbol) : (r.displaySymbol ?? r.symbol),
        }
      })
      .filter(Boolean)
      .slice(0, 10)

    // Filter all curated lists by query
    const cryptoResults    = POPULAR_CRYPTO.filter(c => matches(q, c.name, c.ticker))
    const commodityResults = POPULAR_COMMODITIES.filter(c => matches(q, c.name, c.ticker))
    const etfResults       = POPULAR_ETFS.filter(c => matches(q, c.name, c.ticker))
    const euResults        = POPULAR_EU_STOCKS.filter(c => matches(q, c.name, c.ticker))

    // Merge: curated first (clean names), Finnhub as fallback for everything else
    const existingTickers = new Set<string>()
    const merged = [
      ...cryptoResults,
      ...commodityResults,
      ...etfResults,
      ...euResults,
      ...finnhubResults,
    ].filter(r => {
      if (existingTickers.has(r.ticker)) return false
      existingTickers.add(r.ticker)
      return true
    }).slice(0, 20)

    return NextResponse.json({ results: merged })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
