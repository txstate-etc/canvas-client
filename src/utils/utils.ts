import { type CanvasID } from '../interfaces'

export function throwUnlessValidId (id: CanvasID | string, prefix: string) {
  if (typeof id === 'string' && isNaN(parseInt(id)) && !id.startsWith(prefix)) throw new Error(`ID must either be a number, or a string that begins with ${prefix}`)
}

export function throwUnlessValidUserId (id: CanvasID | string) {
  if (id === 'self') return
  throwUnlessValidId(id, 'sis_user_id:')
}
