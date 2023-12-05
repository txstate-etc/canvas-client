import { pLimit, omit, isNotEmpty } from 'txstate-utils'
import { type CanvasAccount, CanvasCourse, type CanvasSection, type CanvasEnrollment, type CanvasEnrollmentPayload, type CanvasCoursePayload, CanvasSectionPayload, type CanvasGradingStandard, type CanvasID, type SpecialUserID, type SpecialSectionID, type SISSectionID, type SISUserID, type SpecialCourseID, type SISTermID, type SpecialTermID, CanvasEnrollmentTerm, type CanvasCourseParams, type CanvasEnrollmentParams, type CanvasCourseSettings, type CanvasCourseSettingsUpdate, type CanvasUserUpdatePayload, type CanvasCourseListFilters, type ICanvasEnrollmentTerm, type CanvasEnrollmentTermPayload, type CanvasEnrollmentTermParams, CanvasCourseIncludes, type CanvasCourseUsersParams, CanvasUser, CanvasAssignment, type CanvasAssignmentNew, type CanvasAssignmentSubmission, type CanvasAssignmentSubmissionNew, type UserDisplay } from './interfaces'
import { throwUnlessValidId, throwUnlessValidUserId } from './utils/utils'
import { type ExternalTool, type ExternalToolPayload } from './interfaces/externaltool'
import { GraphQLError } from './utils/errors'
import { parseLinkHeader } from './utils/parselink'
export class CanvasConnector {
  private rateLimit = pLimit(10)
  private restUrl: URL | undefined

  constructor (protected canvasUrl?: string, protected token?: string, options: CanvasAPIOptions = {}) {
    const maxConnections = options.maxConnections ?? 10
    this.rateLimit = pLimit(maxConnections)
    try {
      this.restUrl = new URL('/api/v1', canvasUrl)
    } catch {
      // let it go until later
    }
  }

  async send (method: 'get' | 'post' | 'put' | 'delete' | 'head', url: string, payload: any = {}) {
    if (this.restUrl == null) throw new Error('Tried to contact Canvas API but no URL was set for canvas.')
    let finalUrl: URL
    try {
      finalUrl = new URL(url) // URL was complete, use it
    } catch {
      finalUrl = new URL('/api/v1/' + url.replace(/^\//, ''), this.restUrl)
    }
    const isPostOrPut = ['post', 'put'].includes(method)
    if (!isPostOrPut && isNotEmpty(payload)) finalUrl.search = new URLSearchParams(payload).toString()
    const resp = await fetch(finalUrl, {
      method,
      headers: {
        ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}),
        'Content-Type': 'application/json'
      },
      body: isPostOrPut && payload ? JSON.stringify(payload) : undefined
    })
    if (!resp.ok) throw new Error(await resp.text() || resp.statusText)
    if (method !== 'head') (resp as any).data = await resp.json()
    return resp as Response & { data?: any }
  }

  tasks () {
    return this.rateLimit.pendingCount + this.rateLimit.activeCount
  }

  async get (url: string, params: any = {}): Promise<any> {
    const res = await this.rateLimit(async () => await this.send('get', url, params))
    return res.data
  }

  async getall (url: string, params: any = {}, returnObjKey?: string): Promise<any[]> {
    const res = await this.rateLimit(async () => await this.send('get', url, { ...params, page: 1, per_page: 1000 }))
    const ret = (returnObjKey ? res.data?.[returnObjKey] : res.data)
    let links = parseLinkHeader(res.headers.get('link'))
    const page = Number(links?.last?.page ?? 0)
    if (page > 0) {
      if (page > 1) {
        const alldata = await Promise.all(Array.from({ length: page - 1 }, (_, i) => i + 2).map(async p => {
          const res = await this.rateLimit(async () => await this.send('get', url, { ...omit(links!.last!, 'page', 'rel', 'url'), page: p }))
          return (returnObjKey ? res.data?.[returnObjKey] : res.data) || []
        }))
        ret.push(...alldata.flat())
      }
    } else if (links?.next?.url) {
      while (links!.next?.url) {
        const res = await this.rateLimit(async () => await this.send('get', links!.next.url))
        ret.push(...res.data)
        links = parseLinkHeader(res.headers.get('link'))
      }
    }
    return ret
  }

  async delete (url: string, params: any = {}): Promise<any> {
    const res = await this.rateLimit(async () => await this.send('delete', url, params))
    return res.data
  }

  async put (url: string, payload: any): Promise<any> {
    const res = await this.rateLimit(async () => await this.send('put', url, payload))
    return res.data
  }

  async post (url: string, payload: any): Promise<any> {
    const res = await this.rateLimit(async () => await this.send('post', url, payload))
    return res.data
  }

  async head (url: string): Promise<boolean> {
    return await this.rateLimit(async () => {
      try {
        const res = await this.send('head', url)
        return res.ok
      } catch (e) {
        return false
      }
    })
  }

  async graphql (query: string, variables: any) {
    const res = await this.post(this.canvasUrl + '/api/graphql', { query, variables })
    if (res.errors?.length) throw new GraphQLError(res.errors[0].message, res.errors)
    return res.data
  }
}

interface CanvasAPIOptions {
  maxConnections?: number
}

export class CanvasAPI {
  private connectors: CanvasConnector[]
  private root?: CanvasAccount

  constructor (canvasUrl: string | undefined, tokens?: string[], options?: CanvasAPIOptions) {
    if (!tokens?.length) this.connectors = [new CanvasConnector(canvasUrl, undefined, options)]
    else this.connectors = tokens.map(token => new CanvasConnector(canvasUrl, token, options))
  }

  getConnector () {
    return this.connectors.reduce((leastBusyConnector, connector) => connector.tasks() < leastBusyConnector.tasks() ? connector : leastBusyConnector, this.connectors[0])
  }

  async get (url: string, params: any = {}): Promise<any> {
    return await this.getConnector().get(url, params)
  }

  async getall (url: string, params: any = {}, returnObjKey?: string): Promise<any[]> {
    return await this.getConnector().getall(url, params, returnObjKey)
  }

  async delete (url: string, params: any = {}): Promise<any> {
    return await this.getConnector().delete(url, params)
  }

  async put (url: string, payload: any): Promise<any> {
    return await this.getConnector().put(url, payload)
  }

  async post (url: string, payload: any): Promise<any> {
    return await this.getConnector().post(url, payload)
  }

  async head (url: string): Promise<boolean> {
    return await this.getConnector().head(url)
  }

  async graphql <ResponseType = any> (query: string, variables: any) {
    return await this.getConnector().graphql(query, variables) as ResponseType
  }

  // DEFAULTS
  public defaultCourseTimeZone = 'America/Chicago'

  // ACCOUNTS
  public async getRootAccounts (): Promise<CanvasAccount[]> {
    return await this.getall('/accounts')
  }

  public async getRootAccount (): Promise<CanvasAccount> {
    if (!this.root) this.root = (await this.getRootAccounts())[0]
    return this.root
  }

  public async getSubAccounts (id: CanvasID): Promise<CanvasAccount[]> {
    return await this.getall(`/accounts/${id}/sub_accounts`, { recursive: true })
  }

  // COURSES
  public async getUserCourses (userId?: CanvasID | SpecialUserID, params: CanvasCourseParams = {}): Promise<CanvasCourse[]> {
    userId && throwUnlessValidUserId(userId)
    const courses = (await this.getall(`/users/${userId ?? 'self'}/courses`, params)).map(c => new CanvasCourse(c))
    return params?.roles?.length ? courses.filter(course => course.enrollments?.some(enrollment => params.roles?.includes(enrollment.type))) : courses
  }

  public async getUserCoursesBySIS (userId: SISUserID, params?: CanvasCourseParams) {
    return await this.getUserCourses(`sis_user_id:${userId}`, params)
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
    return await this.post(`/accounts/${accountId}/courses`, coursePayload)
  }

  public async updateCourse (courseId: CanvasID, coursePayload: CanvasCoursePayload): Promise<CanvasCourse> {
    return await this.put(`/courses/${courseId}`, coursePayload)
  }

  public async updateCourseSettings (courseId: CanvasID, params: CanvasCourseSettingsUpdate): Promise<CanvasCourseSettings> {
    return await this.put(`/courses/${courseId}/settings`, params)
  }

  public async deleteCourse (courseId: CanvasID) {
    const courseSectionIds = await this.getCourse(courseId, { include: [CanvasCourseIncludes.Sections] }).then(course => course.sections?.map(section => section.id))
    courseSectionIds && await Promise.all(courseSectionIds.map(id => this.removeSISFromSection(id)))
    return await this.delete(`/courses/${courseId}`)
  }

  public async concludeCourse (courseId: CanvasID) {
    return await this.delete(`/courses/${courseId}`, { event: 'conclude' })
  }

  public async getCourseUsers (courseId: CanvasID, params?: CanvasCourseUsersParams) {
    const users = await this.getall(`/courses/${courseId}/users`, params)
    return users.map(u => new CanvasUser(u))
  }

  // ASSIGNMENTS
  public async createCourseAssignment (courseId: CanvasID, assignment: CanvasAssignmentNew): Promise<CanvasAssignment> {
    const assn = await this.post(`/courses/${courseId}/assignments`, { assignment })
    return new CanvasAssignment(assn)
  }

  public async getCourseAssignment (courseId: CanvasID, assignmentId: CanvasID): Promise<CanvasAssignment> {
    const assn = await this.get(`/courses/${courseId}/assignments/${assignmentId}`)
    return new CanvasAssignment(assn)
  }

  public async getCourseAssignments (courseId: CanvasID): Promise<CanvasAssignment[]> {
    return (await this.getall(`/courses/${courseId}/assignments`)).map(assn => new CanvasAssignment(assn))
  }

  public async deleteCourseAssignment (courseId: CanvasID, assignmentId: CanvasID): Promise<CanvasAssignment> {
    const assn = await this.delete(`/courses/${courseId}/assignments/${assignmentId}`)
    return new CanvasAssignment(assn)
  }

  public async getGradeableStudents (courseId: CanvasID, assignmentId: CanvasID): Promise<UserDisplay[]> {
    return await this.getall(`/courses/${courseId}/assignments/${assignmentId}/gradeable_students`)
  }

  // ASSIGNMENT SUBMISSIONS (GRADES)
  public async getAssignmentSubmissions (courseId: CanvasID, assignmentId: CanvasID): Promise<CanvasAssignmentSubmission[]> {
    return await this.getall(`/courses/${courseId}/assignments/${assignmentId}/submissions`)
  }

  public async getAssignmentSubmission (courseId: CanvasID, assignmentId: CanvasID, userId: CanvasID): Promise<CanvasAssignmentSubmission> {
    return await this.get(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`)
  }

  public async updateAssignmentSubmission (submission: CanvasAssignmentSubmissionNew): Promise<CanvasAssignmentSubmission> {
    return await this.put(
      `/courses/${submission.course_id}/assignments/${submission.assignment_id}/submissions/${submission.user_id}`,
      { submission })
  }

  // GRADING STANDARDS
  public async getGradingStandards (accountId?: CanvasID): Promise<CanvasGradingStandard[]> {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) return []
    return await this.getall(`/accounts/${accountId}/grading_standards`)
  }

  // SECTIONS
  public async courseSections (courseId?: CanvasID): Promise<CanvasSection[]> {
    if (!courseId) return []
    return await this.getall(`/courses/${courseId}/sections`)
  }

  public async getSection (id: CanvasID | SpecialSectionID): Promise<CanvasSection> {
    throwUnlessValidId(id, 'sis_section_id')
    return await this.get(`/sections/${id}`)
  }

  public async getSectionBySIS (sisId: SISSectionID) {
    return await this.getSection(`sis_section_id:${sisId}`)
  }

  public async courseSectionsBatched (courseIds: CanvasID[]): Promise<CanvasSection[]> {
    return await Promise.all(courseIds.map(id => this.courseSections(id)))
      .then(c => c.flat())
  }

  public async createSection (courseId: CanvasID, sectionPayload: CanvasSectionPayload): Promise<CanvasSection> {
    return await this.post(`/courses/${courseId}/sections`, sectionPayload)
  }

  public async createSections (courseId: CanvasID, sectionPayloads: CanvasSectionPayload[]): Promise<CanvasSection[]> {
    return await Promise.all(sectionPayloads.map((payload: CanvasSectionPayload) => this.createSection(courseId, payload)))
  }

  public async deleteSection (id: CanvasID | SpecialSectionID) {
    throwUnlessValidId(id, 'sis_section_id')
    const enrollments = await this.getSectionEnrollments(id)
    await Promise.all(enrollments.map(enrollment => this.deleteEnrollmentFromSection(enrollment)))
    const canvasSectionId = await this.removeSISFromSection(id).then(res => res.id)
    return await this.delete(`/sections/${canvasSectionId}`)
  }

  public async deleteSectionBySIS (sisId: SISSectionID) {
    return await this.deleteSection(`sis_section_id:${sisId}`)
  }

  public async removeSISFromSection (id: CanvasID | SpecialSectionID): Promise<CanvasSection> {
    throwUnlessValidId(id, 'sis_section_id')
    return await this.put(`/sections/${id}`, CanvasSectionPayload.asVoidSISSectionId())
  }

  public async removeSISFromSectionBySIS (sisId: SISSectionID) {
    return await this.removeSISFromSection(`sis_section_id:${sisId}`)
  }

  public async removeSISFromSectionsBySIS (sisIds: SISSectionID[]) {
    return await Promise.all(sisIds.map(sisId => this.removeSISFromSectionBySIS(sisId)))
  }

  public async sectionExists (id: CanvasID | SpecialSectionID) {
    throwUnlessValidId(id, 'sis_section_id')
    return await this.head(`/sections/${id}`)
  }

  public async sectionsExist (ids: (CanvasID | SpecialSectionID)[]) {
    return await Promise.all(ids.map(id => this.sectionExists(id)))
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

  public async getCourseEnrollments (id: CanvasID | SpecialCourseID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    throwUnlessValidId(id, 'sis_course_id')
    return await this.getall(`/courses/${id}/enrollments`, this.enrollmentParams(params))
  }

  public async getSectionEnrollments (id: CanvasID | SpecialSectionID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    throwUnlessValidId(id, 'sis_section_id')
    return await this.getall(`/sections/${id}/enrollments`, this.enrollmentParams(params))
  }

  public async getSectionEnrollmentsBySIS (sisId: SISSectionID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    return await this.getSectionEnrollments(`sis_section_id:${sisId}`, params)
  }

  public async getUserEnrollments (userId?: CanvasID | SpecialUserID, params?: Omit<CanvasEnrollmentParams, 'user_id'>): Promise<CanvasEnrollment[]> {
    userId && throwUnlessValidUserId(userId)
    return await this.getall(`/users/${userId ?? 'self'}/enrollments`, this.enrollmentParams(params))
  }

  public async createEnrollment (courseId: CanvasID, enrollmentPayload: CanvasEnrollmentPayload) {
    return await this.post(`/courses/${courseId}/enrollments`, enrollmentPayload)
  }

  public async deactivateEnrollmentFromSection (enrollment: CanvasEnrollment): Promise<CanvasEnrollment> {
    return await this.delete(`/courses/${enrollment.course_id}/enrollments/${enrollment.id}`, { task: 'deactivate' })
  }

  public async deactivateAllEnrollmentsFromSectionsBySis (sisIds: SISSectionID[]) {
    const enrollments = await Promise.all(sisIds.map(async (sisId) => {
      return await this.getSectionEnrollmentsBySIS(sisId)
    }))

    return await Promise.all(enrollments.flat().map(async (enrollment: CanvasEnrollment) => await this.deactivateEnrollmentFromSection(enrollment)))
  }

  public async deleteEnrollmentFromSection (enrollment: CanvasEnrollment): Promise<CanvasEnrollment> {
    return await this.delete(`/courses/${enrollment.course_id}/enrollments/${enrollment.id}`, { task: 'delete' })
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
    return await this.getEnrollmentTerm(accountId, `sis_term_id:${sisTermId}`)
  }

  public async createEnrollmentTerm (accountId: CanvasID | undefined, enrollmentTermPayload: CanvasEnrollmentTermPayload) {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) throw new Error('Tried to create an enrollment term with no account ID and root account could not be determined.')
    return new CanvasEnrollmentTerm(await this.post(`/accounts/${accountId}/terms`, enrollmentTermPayload))
  }

  // User
  public async getUser (id?: CanvasID | SpecialUserID) {
    id && throwUnlessValidUserId(id)
    return await this.get(`/users/${id ?? 'self'}`) as CanvasUser
  }

  public async updateUser (id: CanvasID | SpecialUserID | 'self', payload: CanvasUserUpdatePayload) {
    throwUnlessValidUserId(id)
    return await this.put(`/users/${id}`, payload)
  }

  // External Tools
  public async getExternalTools (accountId?: CanvasID): Promise<ExternalTool[]> {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) return []
    return await this.getall(`/accounts/${accountId}/external_tools`)
  }

  public async createExternalTool (accountId: CanvasID | undefined, externalToolPayload: ExternalToolPayload): Promise<ExternalTool> {
    if (!accountId) accountId = (await this.getRootAccount()).id
    if (!accountId) throw new Error('Tried to create an external tool with no account ID and root account could not be determined.')
    return await this.post(`/accounts/${accountId}/external_tools`, externalToolPayload)
  }

  public async editExternalTool (accountId: CanvasID, toolId: CanvasID, externalToolPayload: Partial<ExternalToolPayload>): Promise<ExternalTool> {
    return await this.put(`/accounts/${accountId}/external_tools/${toolId}`, externalToolPayload)
  }
}
