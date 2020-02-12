export type CanvasID = number
export type SISUserID = string
export type SISCourseID = string
export type SISSectionID = string
export type SISTermID = string
export type SISTermId = string
export type SpecialUserID = string // looks like "sis_user_id:A00123456"
export type SpecialCourseID = string // looks like "sis_course_id:202010.HIST.1301"
export type SpecialSectionID = string // looks like "sis_section_id:202010.12345"
export type SpecialTermID = string // looks like "sis_term_id:202010"

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

export enum CourseIncludes {
  NeedsGradingCount = 'needs_grading_count',
  Teachers = 'teachers',
}

export interface UserDisplay {
  id: number
  short_name: string
  avatar_image_url: string
  html_url: string
}

export interface ICanvasSectionNew {
  name: string
  sis_section_id?: SISSectionID
  integration_id?: string | null
  sis_import_id?: string | null
  start_at?: Date
  end_at?: Date
  restrict_enrollments_to_section_dates?: boolean
}
export interface CanvasSectionNew extends ICanvasSectionNew {}
export class CanvasSectionNew {
  constructor (section: ICanvasSectionNew) {
    this.name = section.name
    this.sis_section_id = section.sis_section_id
    this.integration_id = section.integration_id
    this.sis_import_id = section.sis_import_id
    this.start_at = section.start_at
    this.end_at = section.end_at
    this.restrict_enrollments_to_section_dates = section.restrict_enrollments_to_section_dates
  }
}

export interface CanvasSection extends CanvasSectionNew {
  id: CanvasID
  course_id: CanvasID|SpecialCourseID
  created_at: Date
  nonxlist_course_id: any
  integration_id: string | null
  sis_import_id: string | null
}

export class CanvasSectionPayload {
  course_section: CanvasSectionNew
  enable_sis_reactivation: boolean

  constructor (section: ICanvasSectionNew, enable_sis_reactivation = true) {
    this.course_section = new CanvasSectionNew(section)
    this.enable_sis_reactivation = enable_sis_reactivation
  }

  static asVoidSISSectionId () {
    return { course_section: { sis_section_id: '' } }
  }
}

export enum CanvasEnrollmentState {
  Active = 'active',
  Invited = 'invited',
  Inactive = 'inactive'
}
export enum CanvasEnrollmentType {
  Teacher = 'TeacherEnrollment',
  Student = 'StudentEnrollment',
  Ta = 'TaEnrollment',
  Observer = 'ObserverEnrollment',
  Designer = 'DesignerEnrollment'
}
export enum CanvasEnrollmentShortType {
  teacher = 'teacher',
  student = 'student',
  ta = 'ta',
  observer = 'observer',
  designer = 'designer'
}

export enum CanvasEnrollmentTermsState {
  Active = 'active',
  Deleted = 'deleted'
}

export interface ICanvasEnrollmentNew {
  user_id: CanvasID|SpecialUserID
  type?: CanvasEnrollmentType
  role?: string
  role_id?: number
  enrollment_state?: CanvasEnrollmentState
  course_section_id?: CanvasID|SpecialSectionID
  limit_privileges_to_course_section?: boolean
  notify?: boolean
  self_enrollment_code?: string
  self_enrolled?: boolean
  associated_user_id?: CanvasID|SpecialUserID
}
export interface CanvasEnrollmentNew extends ICanvasEnrollmentNew {}
export class CanvasEnrollmentNew {
  constructor (enrollment: ICanvasEnrollmentNew) {
    this.user_id = enrollment.user_id
    this.type = enrollment.type || CanvasEnrollmentType.Student
    this.role = enrollment.role
    this.role_id = enrollment.role_id
    this.enrollment_state = enrollment.enrollment_state || CanvasEnrollmentState.Active
    this.course_section_id = enrollment.course_section_id
    this.limit_privileges_to_course_section = enrollment.limit_privileges_to_course_section
    this.notify = enrollment.notify
    this.self_enrollment_code = enrollment.self_enrollment_code
    this.self_enrolled = enrollment.self_enrolled
    this.associated_user_id = enrollment.associated_user_id
  }
}

export interface CanvasEnrollment extends CanvasEnrollmentNew {
  id: CanvasID
  user_id: CanvasID
  associated_user_id?: CanvasID
  course_id: CanvasID
  sis_course_id: SISCourseID|null
  course_integration_id: string|null
  course_section_id: CanvasID
  section_integration_id: string|null
}

export class CanvasEnrollmentPayload {
  enrollment: CanvasEnrollmentNew

  constructor (enrollment: ICanvasEnrollmentNew) {
    this.enrollment = new CanvasEnrollmentNew(enrollment)
  }
}

export interface CanvasAccount {
  id: CanvasID
  name: string
  uidd: string
  parent_account_id: CanvasID
  root_account_id: CanvasID
  default_storage_quota_mb: number
  default_user_storage_quota_mb: number
  default_group_storage_quota_mb: number
  default_time_zone: string
  sis_account_id: string
  integration_id: string
  sis_import_id: number
  lti_guid: string
  workflow_state: 'active' | 'deleted'
}

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

export interface CanvasEnrollmentTermOverride {
  start_at: Date | null
  end_at: Date | null
}

export interface ICanvasEnrollmentTermNew {
  name: string
  start_at: Date
  end_at: Date
  sis_term_id?: string
  overrides?: { [keys in CanvasEnrollmentType]: CanvasEnrollmentTermOverride }
}

export interface CanvasEnrollmentTermNew extends ICanvasEnrollmentTermNew {}

export class CanvasEnrollmentTermNew {
  constructor (enrollmentTerm: CanvasEnrollmentTermNew) {
    this.name = enrollmentTerm.name
    this.start_at = enrollmentTerm.start_at
    this.end_at = enrollmentTerm.end_at
    this.sis_term_id = enrollmentTerm.sis_term_id
    this.overrides = enrollmentTerm.overrides
  }
}

export interface CanvasEnrollmentTermPayload extends ICanvasEnrollmentTermNew {}

export class CanvasEnrollmentTermPayload {
  enrollmentTerm: CanvasEnrollmentTermNew

  constructor (enrollmentTerm: ICanvasEnrollmentTermNew) {
    this.enrollmentTerm = new CanvasEnrollmentTermNew(enrollmentTerm)
  }
}

export interface CanvasEnrollmentTerm extends CanvasEnrollmentTermNew {
  id: CanvasID
  created_at: Date
  workflow_state: CanvasEnrollmentTermsState
  grading_period_group_id: number
}
