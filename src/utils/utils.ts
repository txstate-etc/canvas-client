import { type CanvasID } from '../interfaces'

export function throwUnlessValidId (id: CanvasID | string, prefix: string) {
  if (typeof id === 'string' && isNaN(parseInt(id)) && !id.startsWith(prefix)) throw new Error(`ID must either be a number, or a string that begins with ${prefix}`)
}

export function throwUnlessValidUserId (id: CanvasID | string) {
  if (id === 'self') return
  throwUnlessValidId(id, 'sis_user_id:')
}

export function stringifyParams (params: Record<string, any>) {
  const flattened: string[][] = []
  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val)) {
      const arrKey = key.endsWith('[]') ? key : key + '[]'
      flattened.push(...val.map(v => [arrKey, String(v)]))
    } else if (typeof val === 'object' && val !== null) {
      for (const [subKey, subVal] of Object.entries(val)) {
        if (Array.isArray(subVal)) {
          flattened.push(...subVal.map((v) => [`${key}[${subKey}][]`, v]))
        } else if (typeof subVal === 'object' && subVal !== null) {
          for (const [deepKey, deepVal] of Object.entries(subVal)) {
            flattened.push([`${key}[${subKey}][${deepKey}]`, deepVal])
          }
        } else {
          flattened.push([`${key}[${subKey}]`, String(subVal)])
        }
      }
    } else {
      flattened.push([key, String(val)])
    }
  }
  return '?' + flattened.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}
