import { CanvasAPI } from './canvas'
export * from './browser'
export const canvasAPI = new CanvasAPI(process.env.CANVAS_BASE_URL, (process.env.CANVAS_TOKENS ?? '').split(','))
