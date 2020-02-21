import { CanvasEnrollmentType, CanvasID } from '.'

export enum CanvasEnrollmentTermsState {
  Active = 'active',
  Deleted = 'deleted'
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
