export * from './account.js'
export * from './assignment.js'
export * from './course.js'
export * from './enrollment.js'
export * from './gradingstandard.js'
export * from './section.js'
export * from './term.js'
export * from './user.js'
export * from './externaltool.js'
export * from './progress.js'

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
