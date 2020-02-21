import { SISSectionID, CanvasID } from '.'

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
  course_id: CanvasID
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
