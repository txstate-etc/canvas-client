import { CanvasID } from '.'
import { CanvasWorkflowState } from './course'

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
interface ICanvasAssignmentNew {
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
export interface CanvasAssignmentNew extends ICanvasAssignmentNew {}
export class CanvasAssignmentNew {
  constructor (assignment: ICanvasAssignmentNew) {
    this.name = assignment.name
    this.position = assignment.position
    this.submission_types = assignment.submission_types
    this.allowed_extensions = assignment.allowed_extensions
    this.turnitin_enabled = assignment.turnitin_enabled
    this.vericite_enabled = assignment.vericite_enabled
    this.turnitin_settings = assignment.turnitin_settings
    this.integration_data = assignment.integration_data
    this.integration_id = assignment.integration_id
    this.peer_reviews = assignment.peer_reviews
    this.automatic_peer_reviews = assignment.automatic_peer_reviews
    this.notify_of_update = assignment.notify_of_update
    this.group_category_id = assignment.group_category_id
    this.grade_group_students_individually = assignment.grade_group_students_individually
    this.external_tool_tag_attributes = assignment.external_tool_tag_attributes
    this.points_possible = assignment.points_possible
    this.grading_type = assignment.grading_type
    this.due_at = assignment.due_at
    this.lock_at = assignment.lock_at
    this.unlock_at = assignment.unlock_at
    this.description = assignment.description
    this.assignment_group_id = assignment.assignment_group_id
    this.assignment_overrides = assignment.assignment_overrides
    this.only_visible_to_overrides = assignment.only_visible_to_overrides
    this.published = assignment.published
    this.grading_standard_id = assignment.grading_standard_id
    this.omit_from_final_grade = assignment.omit_from_final_grade
    this.quiz_lti = assignment.quiz_lti
    this.moderated_grading = assignment.moderated_grading
    this.grader_count = assignment.grader_count
    this.final_grader_id = assignment.final_grader_id
    this.grader_comments_visible_to_graders = assignment.grader_comments_visible_to_graders
    this.graders_anonymous_to_graders = assignment.graders_anonymous_to_graders
    this.graders_names_visible_to_final_grader = assignment.graders_names_visible_to_final_grader
    this.anonymous_grading = assignment.anonymous_grading
    this.allowed_attempts = assignment.allowed_attempts
    this.annotatable_attachment_id = assignment.annotatable_attachment_id
  }
}
export class CanvasAssignment extends CanvasAssignmentNew {
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
  workflow_state?: CanvasWorkflowState

  constructor (apiresponse: any) {
    super(apiresponse)
    this.id = apiresponse.id
    this.created_at = apiresponse.created_at
    this.updated_at = apiresponse.updated_at
    this.has_overrides = apiresponse.has_overrides
    this.course_id = apiresponse.course_id
    this.html_url = apiresponse.html_url
    this.submissions_download_url = apiresponse.submissions_download_url
    this.due_date_required = apiresponse.due_date_required
    this.max_name_length = apiresponse.max_name_length
    this.peer_review_count = apiresponse.peer_review_count
    this.peer_reviews_assign_at = apiresponse.peer_reviews_assign_at
    this.intra_group_peer_reviews = apiresponse.intra_group_peer_reviews
    this.needs_grading_count = apiresponse.needs_grading_count
    this.has_submitted_submissions = apiresponse.has_submitted_submissions
    this.unpublishable = apiresponse.unpublishable
    this.locked_for_user = apiresponse.locked_for_user
    this.grader_names_visible_to_final_grader = apiresponse.grader_names_visible_to_final_grader
    this.post_manually = apiresponse.post_manually
    this.workflow_state = apiresponse.workflow_state
  }
}

export class CanvasAssignmentPayload {
  assignment: CanvasAssignmentNew

  constructor (assignment: ICanvasAssignmentNew) {
    this.assignment = new CanvasAssignmentNew(assignment)
  }
}
