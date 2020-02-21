import { CanvasID, SISUserID } from '.'

interface ICanvasUser {
  id: CanvasID
  name: string
  sortable_name: string
  short_name: string
  sis_user_id?: SISUserID
  sis_import_id?: string | null
  integration_id?: string | null
  login_id: string
  avatar_url: string
  email: string
  locale: string
  effective_locale: string
  last_login: Date
  time_zone: string
  bio: string | null
}
export interface CanvasUser extends ICanvasUser {}
export class CanvasUser {
  constructor (apiresponse: ICanvasUser) {
    Object.assign(this, apiresponse)
    this.locale = this.locale || this.effective_locale
  }
}

export interface UserDisplay {
  id: number
  short_name: string
  avatar_image_url: string
  html_url: string
}
