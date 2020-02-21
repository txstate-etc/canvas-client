import { CanvasID, SpecialUserID, SpecialSectionID, SISCourseID } from '.'

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

export interface ICanvasEnrollmentNew {
  user_id: CanvasID|SpecialUserID
  type: CanvasEnrollmentType
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

export interface CanvasEnrollmentDisplay {
  type: CanvasEnrollmentShortType
  role: string
  role_id: CanvasID
  user_id: CanvasID
  enrollment_state: CanvasEnrollmentState
}

export class CanvasEnrollmentPayload {
  enrollment: CanvasEnrollmentNew

  constructor (enrollment: ICanvasEnrollmentNew) {
    this.enrollment = new CanvasEnrollmentNew(enrollment)
  }
}

export interface CanvasEnrollmentParams {
  roles?: CanvasEnrollmentType[]
  user_id?: CanvasID
}
