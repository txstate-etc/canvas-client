import { CanvasEnrollmentShortType, SpecialTermID, CanvasID, SISCourseID, UserDisplay, CanvasEnrollmentDisplay } from '.'
import { CanvasSection } from './section'
import { CanvasEnrollmentTerm } from './term'

export interface ICanvasCourseNew {
  name?: string
  course_code?: string
  start_at?: Date
  end_at?: Date
  license?: string
  is_public?: boolean
  is_public_to_auth_users?: boolean
  public_syllabus?: boolean
  public_syllabus_to_auth?: boolean
  public_description?: string
  allow_student_wiki_edits?: boolean
  allow_wiki_comments?: boolean
  allow_student_forum_attachments?: boolean
  open_enrollment?: boolean
  self_enrollment?: boolean
  restrict_enrollments_to_course_dates?: boolean
  term_id?: CanvasID|SpecialTermID
  locale?: string
  enrollment_term_id?: CanvasID|SpecialTermID
  sis_course_id?: SISCourseID | null
  integration_id?: string | null
  hide_final_grades?: boolean
  apply_assignment_group_weights?: boolean
  time_zone?: string
  default_view?: string
  syllabus_body?: string
  grading_standard_id?: CanvasID
  grade_passback_setting?: string|null
}

export interface CanvasCourseNew extends ICanvasCourseNew {}
export class CanvasCourseNew {
  constructor (course: ICanvasCourseNew) {
    this.name = course.name
    this.course_code = course.course_code
    this.term_id = course.term_id ?? course.enrollment_term_id
    this.locale = course.locale
    this.sis_course_id = course.sis_course_id
    this.integration_id = course.integration_id
    this.license = course.license ?? 'private'
    this.is_public = course.is_public
    this.is_public_to_auth_users = course.is_public_to_auth_users
    this.public_syllabus = course.public_syllabus
    this.public_syllabus_to_auth = course.public_syllabus_to_auth
    this.public_description = course.public_description
    this.allow_student_wiki_edits = course.allow_student_wiki_edits
    this.allow_wiki_comments = course.allow_wiki_comments
    this.allow_student_forum_attachments = course.allow_student_forum_attachments
    this.open_enrollment = course.open_enrollment
    this.self_enrollment = course.self_enrollment
    this.restrict_enrollments_to_course_dates = course.restrict_enrollments_to_course_dates
    this.hide_final_grades = course.hide_final_grades
    this.apply_assignment_group_weights = course.apply_assignment_group_weights
    this.time_zone = course.time_zone ?? 'America/Chicago'
    this.default_view = course.default_view ?? 'syllabus'
    this.syllabus_body = course.syllabus_body
    this.grading_standard_id = course.grading_standard_id
    this.grade_passback_setting = course.grade_passback_setting
  }
}

export enum CanvasWorkflowState {
  Available = 'available',
  Unpublished = 'unpublished',
  Completed = 'completed',
  Deleted = 'deleted'
}

export class CanvasCourse extends CanvasCourseNew {
  id: CanvasID
  uuid: string
  account_id: CanvasID
  root_account_id: CanvasID
  created_at: Date
  sis_import_id: CanvasID|null
  workflow_state: CanvasWorkflowState
  term_id?: CanvasID
  enrollment_term_id: CanvasID
  storage_quota_mb: number
  storage_quota_used_mb: number
  teachers?: UserDisplay[]
  needs_grading_count?: number
  enrollments?: CanvasEnrollmentDisplay[]
  sections?: CanvasSection[]
  syllabus_body?: string
  public_description?: string
  term?: CanvasEnrollmentTerm
  concluded?: boolean
  constructor (apiresponse: any) {
    super(apiresponse)
    this.id = apiresponse.id
    this.uuid = apiresponse.uuid
    this.account_id = apiresponse.account_id
    this.root_account_id = apiresponse.root_account_id
    this.created_at = apiresponse.created_at
    this.locale = apiresponse.locale
    this.sis_import_id = apiresponse.sis_import_id
    this.workflow_state = apiresponse.workflow_state
    this.term_id = apiresponse.term_id || apiresponse.enrollment_term_id
    this.enrollment_term_id = apiresponse.enrollment_term_id || apiresponse.term_id
    this.storage_quota_mb = apiresponse.storage_quota_mb
    this.storage_quota_used_mb = apiresponse.storage_quota_used_mb || 0
    this.teachers = apiresponse.teachers || null
    this.needs_grading_count = apiresponse.needs_grading_count
    this.enrollments = apiresponse.enrollments
    this.sections = apiresponse.sections
    this.syllabus_body = apiresponse.syllabus_body
    this.public_description = apiresponse.public_description
    this.term = apiresponse.term
    this.concluded = apiresponse.concluded
  }

  isPublished () {
    return this.workflow_state === CanvasWorkflowState.Available
  }
}

export class CanvasCoursePayload {
  course: CanvasCourseNew
  offer: boolean
  enroll_me: boolean
  enable_sis_reactivation: boolean

  constructor (coursedata: CanvasCourseNew, offer = false, enroll_me = false, enable_sis_reactivation = false) {
    this.course = new CanvasCourseNew(coursedata)
    this.offer = offer
    this.enroll_me = enroll_me
    this.enable_sis_reactivation = enable_sis_reactivation
  }
}

export interface CanvasCourseParams {
  include?: CanvasCourseIncludes[]
  roles?: CanvasEnrollmentShortType[]
  state?: CanvasCourseState[]
}

export enum CanvasCourseIncludes {
  NeedsGradingCount = 'needs_grading_count',
  Teachers = 'teachers',
  Sections = 'sections',
  Term = 'term',
  Concluded = 'concluded'
}

export enum CanvasCourseState {
  Unpublished = 'unpublished',
  Available = 'available',
  Completed = 'completed',
  Deleted = 'deleted'
}

interface ICanvasCourseSettings {
  allow_student_discussion_topics: boolean
  allow_student_forum_attachments: boolean
  allow_student_discussion_editing: boolean
  grading_standard_enabled: boolean
  grading_standard_id?: number
  allow_student_organized_groups: boolean
  hide_final_grades: boolean
  hide_distribution_graphs: boolean
  lock_all_announcements: boolean
  usage_rights_required: boolean
}
export interface CanvasCourseSettings extends ICanvasCourseSettings {}
export class CanvasCourseSettings {
  constructor (apiresponse: ICanvasCourseSettings) {
    Object.assign(this, apiresponse)
  }
}

interface ICanvasCourseSettingsUpdate {
  allow_student_discussion_topics?: boolean
  allow_student_forum_attachments?: boolean
  allow_student_discussion_editing?: boolean
  allow_student_organized_groups?: boolean
  filter_speed_grader_by_student_group?: boolean
  hide_final_grades?: boolean
  hide_distribution_graphs?: boolean
  lock_all_announcements?: boolean
  usage_rights_required?: boolean
  restrict_student_past_view?: boolean
  restrict_student_future_view?: boolean
  show_announcements_on_home_page?: boolean
  home_page_announcement_limit?: number
}

export interface CanvasCourseSettingsUpdate extends ICanvasCourseSettingsUpdate {}

export interface CanvasCourseListFilters {
  with_enrollments?: boolean
  enrollment_type?: CanvasEnrollmentShortType[]
  published?: boolean
  completed?: boolean
  blueprint?: boolean
  blueprint_associated?: boolean
  by_teachers?: CanvasID[]
  by_subaccounts?: CanvasID[]
  state?: ('created'|'claimed'|'available'|'completed'|'deleted'|'all')[]
  enrollment_term_id?: CanvasID|SpecialTermID
  search_term?: string
  include?: ('syllabus_body'|'term'|'course_progress'|'storage_quota_used_mb'|'total_students'|'teachers'|'account_name'|'concluded')[]
  sort?: ('course_name'|'sis_course_id'|'teacher'|'account_name')
  order?: ('asc'|'desc')
  search_by?: 'course'|'teacher'
  starts_before?: Date
  ends_after?: Date
}

export interface CanvasCourseUsersParams {
  search_term?: string
  sort?: 'username'|'last_login'|'email'|'sis_id'
  enrollment_role_id?: number|string
  enrollment_type?: CanvasEnrollmentShortType[]
  include?: ('enrollments'|'locked'|'avatar_url'|'bio'|'test_student'|'custom_links'|'current_grading_period_scores'|'uuid')[]
  user_ids?: (string|number)[]
  enrollment_state?: ('active'|'invited'|'rejected'|'completed'|'inactive')[]
}
