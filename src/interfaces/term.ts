import { CanvasEnrollmentType, CanvasID } from '.'

export enum CanvasEnrollmentTermsState {
  Active = 'active',
  Deleted = 'deleted'
}

export interface CanvasEnrollmentTermOverride {
  start_at: Date | null
  end_at: Date | null
}

export interface CanvasEnrollmentTermNew {
  name: string
  start_at: Date
  end_at: Date
  sis_term_id?: string
  overrides?: { [keys in CanvasEnrollmentType]: CanvasEnrollmentTermOverride }
}

export interface CanvasEnrollmentTermPayload {
  enrollment_term: CanvasEnrollmentTermNew
}

export interface ICanvasEnrollmentTerm {
  id: CanvasID
  name: string
  created_at: string|Date
  start_at: string|Date
  end_at: string|Date
  sis_term_id?: string
  overrides?: { [keys in CanvasEnrollmentType]: CanvasEnrollmentTermOverride }
  workflow_state: CanvasEnrollmentTermsState
  grading_period_group_id: number
}

export interface CanvasEnrollmentTerm extends ICanvasEnrollmentTerm {
  created_at: Date
  start_at: Date
  end_at: Date
}

export class CanvasEnrollmentTerm {
  constructor (enrollmentTerm: ICanvasEnrollmentTerm) {
    Object.assign(this, enrollmentTerm)
    this.created_at = new Date(enrollmentTerm.created_at)
    this.start_at = new Date(enrollmentTerm.start_at)
    this.end_at = new Date(enrollmentTerm.end_at)
  }
}

export interface CanvasEnrollmentTermParams {
  workflow_state?: ('active'|'deleted'|'all')[]
  include?: 'overrides'[]
}
