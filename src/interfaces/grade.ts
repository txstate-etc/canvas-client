import { CanvasID } from '.'

export enum CanvasMediaCommentType {
  audio = 'audio',
  video = 'video'
}
export interface CanvasUpdateGradeRecord {
  posted_grade?: string
  excuse?: boolean
  text_comment?: string
  group_comment?: boolean
  media_comment_id?: string
  media_comment_type?: CanvasMediaCommentType
  file_ids?: CanvasID[]
  assignment_id?: CanvasID
}
export interface CanvasUpdateGradesData {
  [keys: string]: CanvasUpdateGradeRecord
}
