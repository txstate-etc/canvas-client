import { CanvasAPI } from './canvas.js'
export * from './browser.js'
export const canvasAPI = /* #__PURE__ */ new CanvasAPI(process.env.CANVAS_BASE_URL, (process.env.CANVAS_TOKENS ?? '').split(','), {
  maxConnections: parseInt(process.env.CANVAS_CONN_PER_TOKEN ?? '10', 10),
  requestTimeout: process.env.CANVAS_REQUEST_TIMEOUT ? parseInt(process.env.CANVAS_REQUEST_TIMEOUT, 10) : undefined
})
