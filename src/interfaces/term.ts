import type { CanvasEnrollmentType, CanvasID } from './index.js'
import { toDate } from '../utils/utils.js'

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
  created_at: string | Date
  start_at?: string | Date | null
  end_at?: string | Date | null
  sis_term_id?: string
  overrides?: { [keys in CanvasEnrollmentType]: CanvasEnrollmentTermOverride }
  workflow_state: CanvasEnrollmentTermsState
  grading_period_group_id: CanvasID
}

export interface CanvasEnrollmentTerm extends ICanvasEnrollmentTerm {
  created_at: Date
  // undefined for open-ended terms, like the Default Term
  start_at: Date | undefined
  end_at: Date | undefined
}

export class CanvasEnrollmentTerm {
  constructor (enrollmentTerm: ICanvasEnrollmentTerm) {
    Object.assign(this, enrollmentTerm)
    this.created_at = new Date(enrollmentTerm.created_at)
    this.start_at = toDate(enrollmentTerm.start_at)
    this.end_at = toDate(enrollmentTerm.end_at)
  }
}

export interface CanvasEnrollmentTermParams {
  workflow_state?: ('active' | 'deleted' | 'all')[]
  include?: 'overrides'[]
}
