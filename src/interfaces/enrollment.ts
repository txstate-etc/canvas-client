import type { CanvasID, CanvasIDInput, SpecialUserID, SpecialSectionID, SISCourseID } from './index.js'
import { toDate } from '../utils/utils.js'

export enum CanvasEnrollmentState {
  Active = 'active',
  Invited = 'invited',
  Inactive = 'inactive'
}
// Canvas reports these in responses, but only CanvasEnrollmentState values can be set when creating an enrollment
export type CanvasEnrollmentResponseState = CanvasEnrollmentState | 'completed' | 'deleted' | 'rejected' | 'creation_pending'
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
  user_id: CanvasIDInput | SpecialUserID
  type: CanvasEnrollmentType
  role?: string
  role_id?: CanvasIDInput
  enrollment_state?: CanvasEnrollmentState
  course_section_id?: CanvasIDInput | SpecialSectionID
  limit_privileges_to_course_section?: boolean
  notify?: boolean
  self_enrollment_code?: string
  self_enrolled?: boolean
  associated_user_id?: CanvasIDInput | SpecialUserID
}
export interface CanvasEnrollmentNew extends ICanvasEnrollmentNew {}
export class CanvasEnrollmentNew {
  constructor (enrollment: ICanvasEnrollmentNew) {
    this.user_id = enrollment.user_id
    this.type = enrollment.type || CanvasEnrollmentType.Student
    this.role = enrollment.role
    this.role_id = enrollment.role_id
    this.enrollment_state = enrollment.enrollment_state ?? CanvasEnrollmentState.Active
    this.course_section_id = enrollment.course_section_id
    this.limit_privileges_to_course_section = enrollment.limit_privileges_to_course_section
    this.notify = enrollment.notify
    this.self_enrollment_code = enrollment.self_enrollment_code
    this.self_enrolled = enrollment.self_enrolled
    this.associated_user_id = enrollment.associated_user_id
  }
}

interface ICanvasEnrollment extends Omit<ICanvasEnrollmentNew, 'enrollment_state'> {
  enrollment_state: CanvasEnrollmentResponseState
  id: CanvasID
  user_id: CanvasID
  associated_user_id?: CanvasID
  role_id?: CanvasID
  course_id: CanvasID
  sis_course_id: SISCourseID | null
  course_integration_id: string | null
  course_section_id: CanvasID
  section_integration_id: string | null
  created_at: Date
  updated_at: Date
  // only set when the enrollment has its own dates, which is rare
  start_at?: Date
  end_at?: Date
  last_activity_at?: Date
  last_attended_at?: Date
  // in seconds
  total_activity_time?: number
}
export interface CanvasEnrollment extends ICanvasEnrollment {}
export class CanvasEnrollment {
  constructor (apiresponse: ICanvasEnrollment) {
    Object.assign(this, apiresponse)
    this.created_at = new Date(apiresponse.created_at)
    this.updated_at = new Date(apiresponse.updated_at)
    this.start_at = toDate(apiresponse.start_at)
    this.end_at = toDate(apiresponse.end_at)
    this.last_activity_at = toDate(apiresponse.last_activity_at)
    this.last_attended_at = toDate(apiresponse.last_attended_at)
  }
}

export interface CanvasEnrollmentDisplay {
  type: CanvasEnrollmentShortType
  role: string
  role_id: CanvasID
  user_id: CanvasID
  enrollment_state: CanvasEnrollmentResponseState
}

export class CanvasEnrollmentPayload {
  enrollment: CanvasEnrollmentNew

  constructor (enrollment: ICanvasEnrollmentNew) {
    this.enrollment = new CanvasEnrollmentNew(enrollment)
  }
}

export interface CanvasEnrollmentParams {
  roles?: CanvasEnrollmentType[]
  user_id?: CanvasIDInput
}
