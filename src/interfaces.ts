/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/camelcase */

export type CanvasID = number
export type SISUserID = string
export type SISSectionID = string
export type SISTermID = string
export type SpecialUserID = string // looks like "sis_user_id:A00123456"
export type SpecialSectionID = string // looks like "sis_section_id:202010.12345"
export type SpecialTermID = string // looks like "sis_term_id:202010"

export interface CanvasCourse extends CanvasCourseNew {
  id: CanvasID
  sections: CanvasSection[]
}

export class CanvasCourseNew {
  name: string
  course_code: string
  license: string
  term_id?: CanvasID|SpecialTermID
  sis_course_id?: string | null
  integration_id: string | null
  start_at?: Date
  end_at?: Date
  is_public: boolean
  is_public_to_auth_users: boolean
  public_syllabus: boolean
  public_syllabus_to_auth: boolean
  public_description: string
  allow_student_wiki_edits: boolean
  allow_wiki_comments: boolean
  allow_student_forum_attachments: boolean
  open_enrollment: boolean
  self_enrollment: boolean
  restrict_enrollments_to_course_dates: boolean
  hide_final_grades: boolean
  apply_assignment_group_weights: boolean
  time_zone: string
  default_view: string
  syllabus_body: string
  grading_standard_id: any
  offer: boolean
  enroll_me: boolean
  locale: string

  constructor (name: string, description?: string, language?: string, gradingStandardId?: number, termId?: CanvasID|SpecialTermID) {
    this.name = name
    this.course_code = ''
    this.term_id = termId
    this.sis_course_id = null
    this.integration_id = null
    this.license = 'private'
    this.is_public = false
    this.is_public_to_auth_users = false
    this.public_syllabus = false
    this.public_syllabus_to_auth = false
    this.public_description = description || ''
    this.allow_student_wiki_edits = false
    this.allow_wiki_comments = false
    this.allow_student_forum_attachments = false
    this.open_enrollment = false
    this.self_enrollment = false
    this.restrict_enrollments_to_course_dates = false
    this.hide_final_grades = false
    this.apply_assignment_group_weights = false
    this.time_zone = 'America/Chicago'
    this.default_view = 'syllabus'
    this.syllabus_body = ''
    this.grading_standard_id = gradingStandardId || null
    this.offer = false
    this.enroll_me = false
    this.locale = language || 'en'
  }
}

export class CanvasCoursePayload {
  course: CanvasCourseNew
  enable_sis_reactivation: boolean

  constructor ({ name, description, language, gradingStandardId }: {name: string, description?: string, language?: string, gradingStandardId?: number}) {
    this.course = new CanvasCourseNew(name, description, language, gradingStandardId)
    this.enable_sis_reactivation = false
  }
}

export interface CanvasSection extends CanvasSectionNew {
  id: CanvasID
  course_id: CanvasID
  created_at: string
  nonxlist_course_id: any
  integration_id: any
  sis_import_id: any
}

export class CanvasSectionNew {
  name: string
  sis_section_id: SISSectionID
  integration_id?: string
  start_at?: Date
  end_at?: Date
  restrict_enrollments_to_section_dates: boolean

  constructor (id: string, name: string) {
    this.sis_section_id = id
    this.name = name
    this.restrict_enrollments_to_section_dates = false
  }
}

export class CanvasSectionPayload {
  course_section: CanvasSectionNew
  enable_sis_reactivation: boolean

  constructor (sisSectionId: string, sectionName: string) {
    this.course_section = new CanvasSectionNew(sisSectionId, sectionName)
    this.enable_sis_reactivation = true
  }

  static asVoidSISSectionId () {
    return { course_section: { sis_section_id: '' } }
  }

  withStartAt (startAt: Date) {
    this.course_section.start_at = startAt
    return this
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

export class CanvasEnrollmentNew {
  user_id: CanvasID|SpecialUserID
  type: CanvasEnrollmentType
  role: null
  role_id: number | null
  enrollment_state: CanvasEnrollmentState
  course_section_id: CanvasID | null
  limit_privileges_to_course_section: boolean
  notify: boolean
  self_enrollment_code: string | null
  self_enrolled: boolean
  associated_user_id: CanvasID | null

  constructor (userId: CanvasID|SpecialUserID, type?: CanvasEnrollmentType, state?: CanvasEnrollmentState) {
    this.user_id = userId
    this.type = type || CanvasEnrollmentType.Student
    this.role = null
    this.role_id = null
    this.enrollment_state = state || CanvasEnrollmentState.Active
    this.course_section_id = null
    this.limit_privileges_to_course_section = type !== CanvasEnrollmentType.Teacher
    this.notify = false
    this.self_enrollment_code = null
    this.self_enrolled = false
    this.associated_user_id = null
  }
}

export interface CanvasEnrollment extends CanvasEnrollmentNew {
  id: CanvasID
  user_id: CanvasID
  course_id: CanvasID
}

export class CanvasEnrollmentPayload {
  enrollment: CanvasEnrollmentNew

  constructor (sisUserId: SISUserID, type?: CanvasEnrollmentType, state?: CanvasEnrollmentState) {
    this.enrollment = new CanvasEnrollmentNew(sisUserId, type, state)
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
