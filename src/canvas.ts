import { HttpsAgent } from 'agentkeepalive'
import Axios, { AxiosInstance } from 'axios'
import flatten from 'lodash/flatten'
import range from 'lodash/range'
import pLimit from 'p-limit'
import parselinkheader from 'parse-link-header'
import qs from 'qs'
import { CanvasAccount, CanvasCourse, CanvasSection, CanvasEnrollment, CanvasEnrollmentPayload, CanvasCoursePayload, CanvasSectionPayload, CanvasGradingStandard, CanvasID, SpecialUserID, SpecialSectionID, SISSectionID, SISUserID, SpecialCourseID, SISTermID, SpecialTermID, CanvasEnrollmentTerm, CanvasCourseParams, CanvasEnrollmentParams, CanvasCourseSettings, CanvasCourseSettingsUpdate, CanvasUserUpdatePayload, CanvasCourseListFilters, ICanvasEnrollmentTerm, CanvasEnrollmentTermPayload, CanvasEnrollmentTermParams, CanvasCourseIncludes } from './interfaces'
import { throwUnlessValidId, throwUnlessValidUserId } from './utils/utils'
import { ExternalTool, ExternalToolPayload } from './interfaces/externaltool'

export class CanvasConnector {
  private service: AxiosInstance
  private rateLimit = pLimit(10)

  constructor (canvasUrl: string, token?: string, options: CanvasAPIOptions = {}) {
    const maxConnections = options.maxConnections ?? 10
    this.rateLimit = pLimit(maxConnections)
    this.service = Axios.create({
      baseURL: canvasUrl + '/api/v1',
      timeout: 20000,
      httpsAgent: new HttpsAgent({ maxSockets: maxConnections }),
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        'Content-Type': 'application/json'
      }
    })
  }

  tasks () {
    return this.rateLimit.pendingCount + this.rateLimit.activeCount
  }

  async get (url: string, params: any = {}): Promise<any> {
    const res = await this.rateLimit(async () => this.service.get(url, { params }))
    return res.data
  }

  async getall (url: string, params: any = {}, returnObjKey?: string): Promise<any[]> {
    const res = await this.rateLimit(async () => this.service.get(url, { params: { ...params, page: 1, per_page: 1000 } }))
    const ret = (returnObjKey ? res.data?.[returnObjKey] : res.data)
    const links = parselinkheader(res.headers.link)
    const lasturl = links?.last?.url
    if (lasturl) {
      const lastparams = qs.parse(lasturl.slice(lasturl.lastIndexOf('?') + 1))
      const page = parseInt(lastparams?.page as string)
      if (page > 1) {
        const alldata = await Promise.all(range(2, page + 1).map(async p => {
          const res = await this.rateLimit(async () => this.service.get(url, { params: { ...lastparams, page: p } }))
          return (returnObjKey ? res.data?.[returnObjKey] : res.data) || []
        }))
        ret.push(...flatten(alldata))
      }
    }
    return ret
  }

  async delete (url: string, params: any = {}): Promise<any> {
    const res = await this.rateLimit(async () => this.service.delete(url, { params }))
    return res.data
  }

  async put (url: string, payload: any): Promise<any> {
    const res = await this.rateLimit(async () => this.service.put(url, payload))
    return res.data
  }

  async post (url: string, payload: any): Promise<any> {
    const res = await this.rateLimit(async () => this.service.post(url, payload))
    return res.data
  }

  async head (url: string): Promise<boolean> {
    return this.rateLimit(async () => {
      try {
        const res = await this.service.head(url)
        return res.status >= 200 && res.status < 400
      } catch (e) {
        return false
      }
    })
  }
}

interface CanvasAPIOptions {
  maxConnections?: number
}

export class CanvasAPI {
  private connectors: CanvasConnector[]
  private root?: CanvasAccount

  constructor (canvasUrl: string|undefined, tokens?: string[], options?: CanvasAPIOptions) {
    if (!canvasUrl || !canvasUrl.length) throw new Error('Instantiated a canvas client with no URL.')
    if (tokens && !tokens.length) throw new Error('Instantiated a canvas client with an empty token array. If creating the client in the browser and depending on cookies, do not include tokens parameter at all.')
    if (!tokens) this.connectors = [new CanvasConnector(canvasUrl, undefined, options)]
    else this.connectors = tokens.map(token => new CanvasConnector(canvasUrl, token, options))
  }

  getConnector () {
    return this.connectors.reduce((leastBusyConnector, connector) => connector.tasks() < leastBusyConnector.tasks() ? connector : leastBusyConnector, this.connectors[0])
  }

  async get (url: string, params: any = {}): Promise<any> {
    return this.getConnector().get(url, params)
  }

  async getall (url: string, params: any = {}, returnObjKey?: string): Promise<any[]> {
    return this.getConnector().getall(url, params, returnObjKey)
  }

  async delete (url: string, params: any = {}): Promise<any> {
    return this.getConnector().delete(url, params)
  }

  async put (url: string, payload: any): Promise<any> {
    return this.getConnector().put(url, payload)
  }

  async post (url: string, payload: any): Promise<any> {
    return this.getConnector().post(url, payload)
  }

  async head (url: string): Promise<boolean> {
    return this.getConnector().head(url)
  }

  // DEFAULTS
  public defaultCourseTimeZone = 'America/Chicago'

  // ACCOUNTS
  public async getRootAccounts (): Promise<CanvasAccount[]> {
    return this.getall('/accounts')
  }

  public async getRootAccount (): Promise<CanvasAccount> {
    if (!this.root) this.root = (await this.getRootAccounts())[0]
    return this.root
  }

  public async getSubAccounts (id: CanvasID): Promise<CanvasAccount[]> {
    return this.getall(`/accounts/${id}/sub_accounts`, { recursive: true })
  }

  // COURSES
  public async getUserCourses (userId?: CanvasID|SpecialUserID, params: CanvasCourseParams = {}): Promise<CanvasCourse[]> {
    userId && throwUnlessValidUserId(userId)
    const courses = (await this.getall(`/users/${userId ?? 'self'}/courses`, params)).map(c => new CanvasCourse(c))
    return params?.roles?.length ? courses.filter(course => course.enrollments?.some(enrollment => params.roles?.includes(enrollment.type))) : courses
  }

  public async getUserCoursesBySIS (userId: SISUserID, params?: CanvasCourseParams) {
    return this.getUserCourses(`sis_user_id:${userId}`, params)
  }

  public async getCourse (courseId: CanvasID, params?: CanvasCourseParams): Promise<CanvasCourse> {
    return new CanvasCourse(await this.get(`/courses/${courseId}`, params))
  }

  public async getCourses (accountId?: CanvasID, params?: CanvasCourseListFilters): Promise<CanvasCourse[]> {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) return []
    return (await this.getall(`/accounts/${accountId}/courses`, params)).map(c => new CanvasCourse(c))
  }

  public async createCourse (accountId: CanvasID, coursePayload: CanvasCoursePayload): Promise<CanvasCourse> {
    if (!coursePayload.course.time_zone) coursePayload.course.time_zone = this.defaultCourseTimeZone
    return this.post(`/accounts/${accountId}/courses`, coursePayload)
  }

  public async updateCourse (courseId: CanvasID, coursePayload: CanvasCoursePayload): Promise<CanvasCourse> {
    return this.put(`/courses/${courseId}`, coursePayload)
  }

  public async updateCourseSettings (courseId: CanvasID, params: CanvasCourseSettingsUpdate): Promise<CanvasCourseSettings> {
    return this.put(`/courses/${courseId}/settings`, params)
  }

  public async deleteCourse (courseId: CanvasID) {
    const courseSectionIds = await this.getCourse(courseId, { include: [CanvasCourseIncludes.Sections] }).then(course => course.sections?.map(section => section.id))
    courseSectionIds && await Promise.all(courseSectionIds.map(id => this.removeSISFromSection(id)))
    return this.delete(`/courses/${courseId}`)
  }

  // GRADING STANDARDS
  public async getGradingStandards (accountId?: CanvasID): Promise<CanvasGradingStandard[]> {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) return []
    return this.getall(`/accounts/${accountId}/grading_standards`)
  }

  // SECTIONS
  public async courseSections (courseId?: CanvasID): Promise<CanvasSection[]> {
    if (!courseId) return []
    return this.getall(`/courses/${courseId}/sections`)
  }

  public async getSection (id: CanvasID|SpecialSectionID): Promise<CanvasSection> {
    throwUnlessValidId(id, 'sis_section_id')
    return this.get(`/sections/${id}`)
  }

  public async getSectionBySIS (sisId: SISSectionID) {
    return this.getSection(`sis_section_id:${sisId}`)
  }

  public async courseSectionsBatched (courseIds: CanvasID[]): Promise<CanvasSection[]> {
    return Promise.all(courseIds.map(id => this.courseSections(id)))
      .then(flatten)
  }

  public async createSection (courseId: CanvasID, sectionPayload: CanvasSectionPayload): Promise<CanvasSection> {
    return this.post(`/courses/${courseId}/sections`, sectionPayload)
  }

  public async createSections (courseId: CanvasID, sectionPayloads: CanvasSectionPayload[]): Promise<CanvasSection[]> {
    return Promise.all(sectionPayloads.map((payload: CanvasSectionPayload) => this.createSection(courseId, payload)))
  }

  public async deleteSection (id: CanvasID|SpecialSectionID) {
    throwUnlessValidId(id, 'sis_section_id')
    await this.getSectionEnrollments(id).then(async (enrollments) => {
      await Promise.all(enrollments.map(enrollment => this.deleteEnrollmentFromSection(enrollment)))
      const canvasSectionId = await this.removeSISFromSection(id).then(res => res.id)
      return this.delete(`/sections/${canvasSectionId}`)
    })
  }

  public async deleteSectionBySIS (sisId: SISSectionID) {
    return this.deleteSection(`sis_section_id:${sisId}`)
  }

  public async removeSISFromSection (id: CanvasID|SpecialSectionID): Promise<CanvasSection> {
    throwUnlessValidId(id, 'sis_section_id')
    return this.put(`/sections/${id}`, CanvasSectionPayload.asVoidSISSectionId())
  }

  public async removeSISFromSectionBySIS (sisId: SISSectionID) {
    return this.removeSISFromSection(`sis_section_id:${sisId}`)
  }

  public async removeSISFromSectionsBySIS (sisIds: SISSectionID[]) {
    return Promise.all(sisIds.map(sisId => this.removeSISFromSectionBySIS(sisId)))
  }

  public async sectionExists (id: CanvasID|SpecialSectionID) {
    throwUnlessValidId(id, 'sis_section_id')
    return this.head(`/sections/${id}`)
  }

  public async sectionsExist (ids: (CanvasID|SpecialSectionID)[]) {
    return Promise.all(ids.map(id => this.sectionExists(id)))
  }

  public sectionExistsBySIS (sisId: SISSectionID) {
    return this.sectionExists(`sis_section_id:${sisId}`)
  }

  public sectionsExistBySIS (sisIds: SISSectionID[]) {
    return Promise.all(sisIds.map(sisId => this.sectionExists(`sis_section_id:${sisId}`)))
  }

  // ENROLLMENTS
  private enrollmentParams (filters?: CanvasEnrollmentParams) {
    const params: any = filters
    if (filters?.roles?.length) {
      params.role = filters.roles
    }
    if (filters?.user_id) params.user_id = filters.user_id
    return params
  }

  public async getCourseEnrollments (id: CanvasID|SpecialCourseID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    throwUnlessValidId(id, 'sis_course_id')
    return this.getall(`/courses/${id}/enrollments`, this.enrollmentParams(params))
  }

  public async getSectionEnrollments (id: CanvasID|SpecialSectionID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    throwUnlessValidId(id, 'sis_section_id')
    return this.getall(`/sections/${id}/enrollments`, this.enrollmentParams(params))
  }

  public async getSectionEnrollmentsBySIS (sisId: SISSectionID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    return this.getSectionEnrollments(`sis_section_id:${sisId}`, params)
  }

  public async getUserEnrollments (userId?: CanvasID|SpecialUserID, params?: Omit<CanvasEnrollmentParams, 'user_id'>): Promise<CanvasEnrollment[]> {
    userId && throwUnlessValidUserId(userId)
    return this.getall(`/users/${userId ?? 'self'}/enrollments`, this.enrollmentParams(params))
  }

  public async createEnrollment (courseId: CanvasID, enrollmentPayload: CanvasEnrollmentPayload) {
    return this.post(`/courses/${courseId}/enrollments`, enrollmentPayload)
  }

  public async deactivateEnrollmentFromSection (enrollment: CanvasEnrollment): Promise<CanvasEnrollment> {
    return this.delete(`/courses/${enrollment.course_id}/enrollments/${enrollment.id}`, { task: 'deactivate' })
  }

  public async deactivateAllEnrollmentsFromSectionsBySis (sisIds: SISSectionID[]) {
    const enrollments = await Promise.all(sisIds.map(async (sisId) => {
      return this.getSectionEnrollmentsBySIS(sisId)
    }))

    return Promise.all(flatten(enrollments).map(async (enrollment: CanvasEnrollment) => this.deactivateEnrollmentFromSection(enrollment)))
  }

  public async deleteEnrollmentFromSection (enrollment: CanvasEnrollment): Promise<CanvasEnrollment> {
    return this.delete(`/courses/${enrollment.course_id}/enrollments/${enrollment.id}`, { task: 'delete' })
  }

  // TERM
  public async getEnrollmentTerms (accountId?: CanvasID, params?: CanvasEnrollmentTermParams): Promise<CanvasEnrollmentTerm[]> {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) return []
    return (await this.getall(`/accounts/${accountId}/terms`, params, 'enrollment_terms')).map((t: ICanvasEnrollmentTerm) => new CanvasEnrollmentTerm(t))
  }

  public async getEnrollmentTermCurrent (forDate = new Date()) {
    const terms = await this.getEnrollmentTerms()
    for (const term of terms) {
      if (term.start_at < forDate && term.end_at > forDate) return term
    }
    return undefined
  }

  public async getEnrollmentTerm (accountId: CanvasID, termId: CanvasID | SpecialTermID): Promise<CanvasEnrollmentTerm> {
    throwUnlessValidId(termId, 'sis_term_id')
    return new CanvasEnrollmentTerm(await this.get(`/accounts/${accountId}/terms/${termId}`))
  }

  public async getEnrollmentTermBySis (accountId: CanvasID, sisTermId: SISTermID): Promise<CanvasEnrollmentTerm> {
    return this.getEnrollmentTerm(accountId, `sis_term_id:${sisTermId}`)
  }

  public async createEnrollmentTerm (accountId: CanvasID|undefined, enrollmentTermPayload: CanvasEnrollmentTermPayload) {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) throw new Error('Tried to create an enrollment term with no account ID and root account could not be determined.')
    return new CanvasEnrollmentTerm(await this.post(`/accounts/${accountId}/terms`, enrollmentTermPayload))
  }

  // User
  public async getUser (id?: CanvasID|SpecialUserID) {
    id && throwUnlessValidUserId(id)
    return this.get(`/users/${id ?? 'self'}`)
  }

  public async updateUser (id: CanvasID|SpecialUserID|'self', payload: CanvasUserUpdatePayload) {
    throwUnlessValidUserId(id)
    return this.put(`/users/${id}`, payload)
  }

  // External Tools
  public async getExternalTools (accountId?: CanvasID): Promise<ExternalTool[]> {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) return []
    return this.getall(`/accounts/${accountId}/external_tools`)
  }

  public async createExternalTool (accountId: CanvasID|undefined, externalToolPayload: ExternalToolPayload): Promise<ExternalTool> {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) throw new Error('Tried to create an external tool with no account ID and root account could not be determined.')
    return this.post(`/accounts/${accountId}/external_tools`, externalToolPayload)
  }

  public async editExternalTool (accountId: CanvasID, toolId: CanvasID, externalToolPayload: Partial<ExternalToolPayload>): Promise<ExternalTool> {
    return this.put(`/accounts/${accountId}/external_tools/${toolId}`, externalToolPayload)
  }
}
