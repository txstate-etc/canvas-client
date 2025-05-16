import { isBlank, isNotBlank, keyby } from 'txstate-utils'

interface CanvasLinkHeaderLink {
  rel: 'next' | 'prev' | 'last' | 'first'
  url: string
  per_page?: string
  page?: string
}

interface CanvasLinkHeader {
  next: CanvasLinkHeaderLink
  prev?: CanvasLinkHeaderLink
  first?: CanvasLinkHeaderLink
  last?: CanvasLinkHeaderLink
}

function createObjects (acc: any, p: string) {
  const m = p.match(/\s*(.+)\s*=\s*"?([^"]+)"?/)
  if (m) acc[m[1]] = m[2]
  return acc
}

function parseLink (link: string) {
  try {
    const m = link.match(/<?([^>]*)>(.*)/)!
    const linkUrl = m[1]
    const parts = m[2].split(';').slice(1)
    const parsed = new URL(linkUrl)
    const params: Record<string, string | (string[])> = {}
    for (const [key, value] of parsed.searchParams.entries()) {
      if (params[key] == null) params[key] = value
      else if (Array.isArray(params[key])) (params[key] as string[]).push(value)
      else params[key] = [params[key] as string, value]
    }

    return parts.reduce(createObjects, { ...params, url: linkUrl })
  } catch (e: any) {
    return undefined
  }
}

export function parseLinkHeader (linkHeader?: string | null) {
  if (isBlank(linkHeader)) return undefined

  return keyby(linkHeader.split(/,\s*</)
    .map(parseLink)
    .filter(r => isNotBlank(r?.rel)), 'rel') as CanvasLinkHeader
}
