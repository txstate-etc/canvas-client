import { CanvasID } from '.'

export enum CanvasProgressWorkflowState {
  queued = 'queued',
  running = 'running',
  completed = 'completed',
  failed = 'failed'
}
interface ICanvasProgress {

  // the ID of the Progress object
  id: CanvasID

  // the context owning the job.
  context_id: CanvasID
  context_type: string

  // the id of the user who started the job
  user_id: CanvasID | null

  // the type of operation
  tag: string

  // percent completed
  completion: number

  // the state of the job
  workflow_state: CanvasProgressWorkflowState

  // the time the job was created / last updated
  created_at: Date
  updated_at: Date

  // optional details about the job
  message?: string | null

  // optional results of the job. omitted when job is still pending
  results?: string | null

  // url where a progress update can be retrieved
  url: string

}

export interface CanvasProgress extends ICanvasProgress {}
export class CanvasProgress {
  constructor (apiresponse: ICanvasProgress) {
    Object.assign(this, apiresponse)
  }
}
