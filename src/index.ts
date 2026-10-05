import { CanvasAPI } from './canvas.js'
export * from './browser.js'
export const canvasAPI = new CanvasAPI(process.env.CANVAS_BASE_URL, (process.env.CANVAS_TOKENS ?? '').split(','), { maxConnections: parseInt(process.env.CANVAS_CONN_PER_TOKEN ?? '10', 10) })
