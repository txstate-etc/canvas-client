import { CanvasID } from '.'

export enum CanvasAssignmentSubmissionWorkflowState {
  submitted = 'submitted',
  unsubmitted = 'unsubmitted',
  graded = 'graded',
  pending_review = 'pending_review'
}
export enum CanvasLatePolicyType {
  late = 'late',
  missing = 'missing',
  none = 'none'
}
export interface CanvasAssignmentSubmissionNew {
  course_id: CanvasID
  assignment_id: CanvasID
  user_id: CanvasID
  posted_grade?: string
  excused?: boolean
  late_policy_status?: CanvasLatePolicyType
  seconds_late_override?: number
}
export interface CanvasAssignmentSubmission extends CanvasAssignmentSubmissionNew {
  id: CanvasID
  grade_matches_current_submission: boolean
  workflow_state: CanvasAssignmentSubmissionWorkflowState
  posted_at: Date
  grader_id: CanvasID
  preview_url: string
  score: number
  graded_at: Date
  entered_score: number
  entered_grade: string
  grade: string
}
