import type { CanvasID } from './index.js'

export interface CanvasGradeValue {
  name: string
  value: number
}

export interface CanvasGradingStandard {
  id: CanvasID
  title: string
  context_id: CanvasID
  context_type: string
  grading_scheme: CanvasGradeValue[]
}
