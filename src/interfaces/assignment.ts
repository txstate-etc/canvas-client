import { CanvasID } from '.'

export enum CanvasAssignmentSubmissionType {
  discussion_topic = 'discussion_topic',
  online_quiz = 'online_quiz',
  on_paper = 'on_paper',
  none = 'none',
  external_tool = 'external_tool',
  online_text_entry = 'online_text_entry',
  online_url = 'online_url',
  online_upload = 'online_upload',
  media_recording = 'media_recording',
  student_annotation = 'student_annotation'
}

export enum CanvasAssignmentGradingType {
  pass_fail = 'pass_fail',
  percent = 'percent',
  letter_grade = 'letter_grade',
  gpa_scale = 'gpa_scale',
  points = 'points'
}

export interface CanvasAssignmentOverride {
  id: CanvasID
  assignment_id: CanvasID
  student_ids: CanvasID[]
  group_id: CanvasID
  course_section_id: CanvasID
  title: string
  due_at: Date|string
  all_day: boolean
  all_day_date: string
  unlock_at: Date|string
  lock_at: Date|string
}
interface CanvasAssignmentNew {
  name: string
  position?: number
  submission_types?: CanvasAssignmentSubmissionType[]
  allowed_extensions?: string[]
  turnitin_enabled?: boolean
  vericite_enabled?: boolean
  turnitin_settings?: string
  integration_data?: { [keys: string]: any }
  integration_id?: string
  peer_reviews?: boolean
  automatic_peer_reviews?: boolean
  notify_of_update?: boolean
  group_category_id?: CanvasID
  grade_group_students_individually?: boolean
  external_tool_tag_attributes?: { [keys: string]: any }
  points_possible?: number
  grading_type?: CanvasAssignmentGradingType
  due_at?: Date
  lock_at?: Date
  unlock_at?: Date
  description?: string
  assignment_group_id?: CanvasID
  assignment_overrides?: CanvasAssignmentOverride[]
  only_visible_to_overrides?: boolean
  published?: boolean
  grading_standard_id?: CanvasID
  omit_from_final_grade?: boolean
  quiz_lti?: boolean
  moderated_grading?: boolean
  grader_count?: number
  final_grader_id?: CanvasID
  grader_comments_visible_to_graders?: boolean
  graders_anonymous_to_graders?: boolean
  graders_names_visible_to_final_grader?: boolean
  anonymous_grading?: boolean
  allowed_attempts?: number
  annotatable_attachment_id?: CanvasID
}
export interface CanvasAssignment extends CanvasAssignmentNew {
  id: CanvasID
  created_at: Date
  updated_at: Date
  has_overrides: boolean
  course_id: CanvasID
  html_url: string
  submissions_download_url: string
  due_date_required: boolean
  max_name_length: number
  peer_review_count: number
  peer_reviews_assign_at: Date
  intra_group_peer_reviews: boolean
  needs_grading_count: number
  has_submitted_submissions: boolean
  unpublishable: boolean
  locked_for_user: boolean
  grader_names_visible_to_final_grader: boolean
  post_manually: boolean

  // this appears to be undocumented, but when deleting an assignment, the API responds
  // with the Assignment object that's being deleted, with workflow_state:deleted
  workflow_state?: string
}

export interface CanvasAssignmentPayload {
  assignment: CanvasAssignmentNew
}
