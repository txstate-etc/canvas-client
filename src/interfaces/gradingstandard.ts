import { CanvasID } from '.'

export interface CanvasGradeValue {
  name: string
  value: number
}

export interface CanvasGradingStandard {
  id: CanvasID
  title: string
  context_id: number
  context_type: string
  grading_scheme: CanvasGradeValue[]
}
