import { type CanvasIDInput } from '../interfaces/index.js'

export function throwUnlessValidId (id: CanvasIDInput, prefix: string) {
  if (typeof id === 'string' && isNaN(parseInt(id)) && !id.startsWith(prefix + ':')) throw new Error(`ID must either be numeric, or a string that begins with ${prefix}:`)
}

export function throwUnlessValidUserId (id: CanvasIDInput) {
  if (id === 'self') return
  throwUnlessValidId(id, 'sis_user_id')
}

/**
 * Canvas sends dates as ISO strings, and sends null for dates that aren't set. Turns
 * them into Date objects, or undefined when missing.
 */
export function toDate (val: string | Date | null | undefined) {
  return val == null ? undefined : new Date(val)
}

function stringifyValue (val: any) {
  return val instanceof Date ? val.toISOString() : String(val)
}

export function stringifyParams (params: Record<string, any>) {
  const flattened: string[][] = []
  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val)) {
      const arrKey = key.endsWith('[]') ? key : key + '[]'
      flattened.push(...val.map(v => [arrKey, stringifyValue(v)]))
    } else if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
      for (const [subKey, subVal] of Object.entries(val)) {
        if (Array.isArray(subVal)) {
          flattened.push(...subVal.map(v => [`${key}[${subKey}][]`, stringifyValue(v)]))
        } else if (typeof subVal === 'object' && subVal !== null && !(subVal instanceof Date)) {
          for (const [deepKey, deepVal] of Object.entries(subVal)) {
            flattened.push([`${key}[${subKey}][${deepKey}]`, stringifyValue(deepVal)])
          }
        } else {
          flattened.push([`${key}[${subKey}]`, stringifyValue(subVal)])
        }
      }
    } else {
      flattened.push([key, stringifyValue(val)])
    }
  }
  return '?' + flattened.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
}
