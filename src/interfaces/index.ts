export * from './account'
export * from './assignment'
export * from './course'
export * from './enrollment'
export * from './gradingstandard'
export * from './section'
export * from './term'
export * from './user'
export * from './externaltool'
export * from './progress'

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
