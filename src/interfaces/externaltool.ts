import { CanvasID } from '.'

export interface ExternalTool {
  id: CanvasID
  domain: string
  url: string
  consumer_key: string
  name: string
  description: string
  created_at: Date
  updated_at: Date
  allow_membership_service_access: boolean
  privacy_level: 'anonymous'|'public'|'name_only'
  custom_fields: ExternalToolCustomField[]
  workflow_state: string
  vendor_help_link: string|null
  account_navigation: ExternalToolNavigation|null
  course_navigation: ExternalToolNavigation|null
  course_home_sub_navigation: ExternalToolNavigation|null
  course_settings_sub_navigation: ExternalToolNavigation|null
  global_navigation: ExternalToolNavigation|null
  user_navigation: ExternalToolNavigation|null
  version: string
}

export interface ExternalToolNavigation {
  canvas_icon_class?: string|null
  icon_url?: string|null
  text?: string
  url?: string
  label?: string
  selection_width?: number
  selection_height?: number
  visibility?: string
  default?: string
  enabled?: boolean
  windowTarget?: string
  message_type?: string
}

export class ExternalToolCustomField {
  public key: string
  public value: string

  constructor (key: string, value: string) {
    this.key = key
    this.value = value
  }
}

export class ExternalToolPayload {
  url?: string
  name?: string
  privacy_level?: 'anonymous'|'public'|'name_only'
  consumer_key?: string
  shared_secret?: string
  description?: string
  domain?: string
  icon_url?: string|null
  test?: string
  custom_fields?: ExternalToolCustomField[]|null
  course_navigation?: ExternalToolNavigation|null
  account_navigation?: ExternalToolNavigation|null
  user_navigation?: ExternalToolNavigation|null
  course_home_sub_navigation?: ExternalToolNavigation|null
  editor_button?: ExternalToolNavigation|null
  homework_submission?: ExternalToolNavigation|null
  link_selection?: ExternalToolNavigation|null
  migration_selection?: ExternalToolNavigation|null
  config_type?: 'by_url'|'by_xml'|null
  config_xml?: string|null
  config_url?: string|null
}
