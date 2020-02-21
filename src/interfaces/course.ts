import { CanvasEnrollmentShortType, SpecialTermID, CanvasID, SISCourseID, UserDisplay, CanvasEnrollmentDisplay } from '.'

export interface ICanvasCourseNew {
  name: string
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
    this.term_id = course.term_id || course.enrollment_term_id
    this.locale = course.locale
    this.sis_course_id = course.sis_course_id
    this.integration_id = course.integration_id
    this.license = course.license || 'private'
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
    this.time_zone = course.time_zone || 'America/Chicago'
    this.default_view = course.default_view || 'syllabus'
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
  term_id: CanvasID
  enrollment_term_id: CanvasID
  storage_quota_mb: number
  storage_quota_used_mb: number
  teachers?: UserDisplay[]
  needs_grading_count?: number
  enrollments?: CanvasEnrollmentDisplay[]
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
}

export enum CanvasCourseIncludes {
  NeedsGradingCount = 'needs_grading_count',
  Teachers = 'teachers',
}
