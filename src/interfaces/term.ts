import type { CanvasEnrollmentType, CanvasID } from './index.js'
import { toDate } from '../utils/utils.js'

export enum CanvasEnrollmentTermsState {
  Active = 'active',
  Deleted = 'deleted'
}

export interface CanvasEnrollmentTermOverrideNew {
  start_at?: Date | string | null
  end_at?: Date | string | null
}

export interface CanvasEnrollmentTermOverride {
  start_at: Date | undefined
  end_at: Date | undefined
}

export interface CanvasEnrollmentTermNew {
  name: string
  start_at: Date | string
  end_at: Date | string
  sis_term_id?: string
  overrides?: Partial<Record<CanvasEnrollmentType, CanvasEnrollmentTermOverrideNew>>
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
  overrides?: Partial<Record<CanvasEnrollmentType, CanvasEnrollmentTermOverrideNew>>
  workflow_state: CanvasEnrollmentTermsState
  grading_period_group_id: CanvasID
}

export interface CanvasEnrollmentTerm extends ICanvasEnrollmentTerm {
  created_at: Date
  // undefined for open-ended terms, like the Default Term
  start_at: Date | undefined
  end_at: Date | undefined
  overrides?: Partial<Record<CanvasEnrollmentType, CanvasEnrollmentTermOverride>>
}

export class CanvasEnrollmentTerm {
  constructor (enrollmentTerm: ICanvasEnrollmentTerm) {
    Object.assign(this, enrollmentTerm)
    this.created_at = new Date(enrollmentTerm.created_at)
    this.start_at = toDate(enrollmentTerm.start_at)
    this.end_at = toDate(enrollmentTerm.end_at)
    if (enrollmentTerm.overrides) {
      this.overrides = {}
      for (const [type, o] of Object.entries(enrollmentTerm.overrides) as [CanvasEnrollmentType, CanvasEnrollmentTermOverrideNew][]) {
        this.overrides[type] = { start_at: toDate(o.start_at), end_at: toDate(o.end_at) }
      }
    }
  }
}

export interface CanvasEnrollmentTermParams {
  workflow_state?: ('active' | 'deleted' | 'all')[]
  include?: 'overrides'[]
}
