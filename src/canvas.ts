import { pLimit, omit, isNotEmpty } from 'txstate-utils'
import { type CanvasAccount, CanvasCourse, CanvasSection, CanvasEnrollment, type CanvasEnrollmentPayload, type CanvasCoursePayload, CanvasSectionPayload, type CanvasGradingStandard, type CanvasIDInput, type SpecialUserID, type SpecialSectionID, type SISSectionID, type SISUserID, type SpecialCourseID, type SISTermID, type SpecialTermID, CanvasEnrollmentTerm, type CanvasCourseParams, type CanvasEnrollmentParams, CanvasCourseSettings, type CanvasCourseSettingsUpdate, type CanvasUserUpdatePayload, type CanvasCourseListFilters, type ICanvasEnrollmentTerm, type CanvasEnrollmentTermPayload, type CanvasEnrollmentTermParams, CanvasCourseIncludes, type CanvasCourseUsersParams, CanvasUser, CanvasAssignment, type CanvasAssignmentNew, CanvasAssignmentSubmission, type CanvasAssignmentSubmissionNew, type UserDisplay } from './interfaces/index.js'
import { stringifyParams, throwUnlessValidId, throwUnlessValidUserId } from './utils/utils.js'
import { ExternalTool, type ExternalToolPayload } from './interfaces/externaltool.js'
import { CanvasAPIError, GraphQLError } from './utils/errors.js'
import { parseLinkHeader } from './utils/parselink.js'
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

  private requireRestUrl () {
    if (this.restUrl == null) throw new Error('Tried to contact Canvas API but no URL was set for canvas.')
    return this.restUrl
  }

  async send (method: 'get' | 'post' | 'put' | 'delete' | 'head', url: string, payload: any = {}) {
    const restUrl = this.requireRestUrl()
    let finalUrl: URL
    try {
      finalUrl = new URL(url) // URL was complete, use it
    } catch {
      finalUrl = new URL('/api/v1/' + url.replace(/^\//, ''), restUrl)
    }
    const isPostOrPut = ['post', 'put'].includes(method)
    if (!isPostOrPut && isNotEmpty(payload)) finalUrl.search = stringifyParams(payload)
    const resp = await fetch(finalUrl, {
      method,
      headers: {
        ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}),
        Accept: 'application/json+canvas-string-ids',
        'Content-Type': 'application/json'
      },
      body: isPostOrPut && payload ? JSON.stringify(payload) : undefined
    })
    if (!resp.ok) {
      const text = await resp.text()
      let body: any = text
      try { body = JSON.parse(text) } catch { /* not JSON, keep the text */ }
      throw new CanvasAPIError(text || resp.statusText, resp.status, method, finalUrl.toString(), body)
    }
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
    const pageData = (res: { data?: any }): any[] => (returnObjKey ? res.data?.[returnObjKey] : res.data) ?? []
    // Canvas caps most endpoints at 100 per page
    const res = await this.rateLimit(async () => await this.send('get', url, { ...params, page: 1, per_page: 100 }))
    const ret = pageData(res)
    let links = parseLinkHeader(res.headers.get('link'))
    const lastpage = Number(links?.last?.page ?? 0)
    if (lastpage > 0) {
      if (lastpage > 1) {
        const alldata = await Promise.all(Array.from({ length: lastpage - 1 }, (_, i) => i + 2).map(async p => {
          const res = await this.rateLimit(async () => await this.send('get', url, { ...omit(links!.last!, 'page', 'rel', 'url'), page: p }))
          return pageData(res)
        }))
        ret.push(...alldata.flat())
      }
    } else {
      while (links?.next?.url) {
        const res = await this.rateLimit(async () => await this.send('get', links!.next.url))
        ret.push(...pageData(res))
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
        if (e instanceof CanvasAPIError && e.status === 404) return false
        throw e
      }
    })
  }

  async graphql (query: string, variables?: any) {
    const res = await this.post(new URL('/api/graphql', this.requireRestUrl()).toString(), { query, variables })
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

  async graphql <ResponseType = any> (query: string, variables?: any) {
    return await this.getConnector().graphql(query, variables) as ResponseType
  }

  // DEFAULTS
  public defaultCourseTimeZone = 'America/Chicago'

  // ACCOUNTS
  public async getRootAccounts (): Promise<CanvasAccount[]> {
    return await this.getall('/accounts')
  }

  public async getRootAccount (): Promise<CanvasAccount> {
    this.root ??= (await this.getRootAccounts())[0]
    return this.root
  }

  public async getSubAccounts (id: CanvasIDInput): Promise<CanvasAccount[]> {
    return await this.getall(`/accounts/${id}/sub_accounts`, { recursive: true })
  }

  // COURSES
  public async getUserCourses (userId?: CanvasIDInput | SpecialUserID, params: CanvasCourseParams = {}): Promise<CanvasCourse[]> {
    userId && throwUnlessValidUserId(userId)
    const courses = (await this.getall(`/users/${userId ?? 'self'}/courses`, params)).map(c => new CanvasCourse(c))
    return params?.roles?.length ? courses.filter(course => course.enrollments?.some(enrollment => params.roles?.includes(enrollment.type))) : courses
  }

  public async getUserCoursesBySIS (userId: SISUserID, params?: CanvasCourseParams) {
    return await this.getUserCourses(`sis_user_id:${userId}`, params)
  }

  public async getCourse (courseId: CanvasIDInput, params?: CanvasCourseParams): Promise<CanvasCourse> {
    return new CanvasCourse(await this.get(`/courses/${courseId}`, params))
  }

  public async getCourses (accountId?: CanvasIDInput, params?: CanvasCourseListFilters): Promise<CanvasCourse[]> {
    accountId ??= (await this.getRootAccount()).id
    if (!accountId) return []
    return (await this.getall(`/accounts/${accountId}/courses`, params)).map(c => new CanvasCourse(c))
  }

  public async createCourse (accountId: CanvasIDInput, coursePayload: CanvasCoursePayload): Promise<CanvasCourse> {
    if (!coursePayload.course.time_zone) coursePayload.course.time_zone = this.defaultCourseTimeZone
    return new CanvasCourse(await this.post(`/accounts/${accountId}/courses`, coursePayload))
  }

  public async updateCourse (courseId: CanvasIDInput, coursePayload: CanvasCoursePayload): Promise<CanvasCourse> {
    return new CanvasCourse(await this.put(`/courses/${courseId}`, coursePayload))
  }

  public async updateCourseSettings (courseId: CanvasIDInput, params: CanvasCourseSettingsUpdate): Promise<CanvasCourseSettings> {
    return new CanvasCourseSettings(await this.put(`/courses/${courseId}/settings`, params))
  }

  public async deleteCourse (courseId: CanvasIDInput) {
    const courseSectionIds = await this.getCourse(courseId, { include: [CanvasCourseIncludes.Sections] }).then(course => course.sections?.map(section => section.id))
    courseSectionIds && await Promise.all(courseSectionIds.map(id => this.removeSISFromSection(id)))
    return await this.delete(`/courses/${courseId}`)
  }

  public async concludeCourse (courseId: CanvasIDInput) {
    return await this.delete(`/courses/${courseId}`, { event: 'conclude' })
  }

  public async getCourseUsers (courseId: CanvasIDInput, params?: CanvasCourseUsersParams) {
    const users = await this.getall(`/courses/${courseId}/users`, params)
    return users.map(u => new CanvasUser(u))
  }

  // ASSIGNMENTS
  public async createCourseAssignment (courseId: CanvasIDInput, assignment: CanvasAssignmentNew): Promise<CanvasAssignment> {
    const assn = await this.post(`/courses/${courseId}/assignments`, { assignment })
    return new CanvasAssignment(assn)
  }

  public async getCourseAssignment (courseId: CanvasIDInput, assignmentId: CanvasIDInput): Promise<CanvasAssignment> {
    const assn = await this.get(`/courses/${courseId}/assignments/${assignmentId}`)
    return new CanvasAssignment(assn)
  }

  public async getCourseAssignments (courseId: CanvasIDInput): Promise<CanvasAssignment[]> {
    return (await this.getall(`/courses/${courseId}/assignments`)).map(assn => new CanvasAssignment(assn))
  }

  public async deleteCourseAssignment (courseId: CanvasIDInput, assignmentId: CanvasIDInput): Promise<CanvasAssignment> {
    const assn = await this.delete(`/courses/${courseId}/assignments/${assignmentId}`)
    return new CanvasAssignment(assn)
  }

  public async getGradeableStudents (courseId: CanvasIDInput, assignmentId: CanvasIDInput): Promise<UserDisplay[]> {
    return await this.getall(`/courses/${courseId}/assignments/gradeable_students`, { assignment_ids: assignmentId })
  }

  // ASSIGNMENT SUBMISSIONS (GRADES)
  public async getAssignmentSubmissions (courseId: CanvasIDInput, assignmentId: CanvasIDInput): Promise<CanvasAssignmentSubmission[]> {
    return (await this.getall(`/courses/${courseId}/assignments/${assignmentId}/submissions`)).map(s => new CanvasAssignmentSubmission(s))
  }

  public async getAssignmentSubmission (courseId: CanvasIDInput, assignmentId: CanvasIDInput, userId: CanvasIDInput): Promise<CanvasAssignmentSubmission> {
    return new CanvasAssignmentSubmission(await this.get(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`))
  }

  public async updateAssignmentSubmission (submission: CanvasAssignmentSubmissionNew): Promise<CanvasAssignmentSubmission> {
    return new CanvasAssignmentSubmission(await this.put(
      `/courses/${submission.course_id}/assignments/${submission.assignment_id}/submissions/${submission.user_id}`,
      { submission }))
  }

  // GRADING STANDARDS
  public async getGradingStandards (accountId?: CanvasIDInput): Promise<CanvasGradingStandard[]> {
    accountId ??= (await this.getRootAccount()).id
    if (!accountId) return []
    return await this.getall(`/accounts/${accountId}/grading_standards`)
  }

  // SECTIONS
  public async courseSections (courseId?: CanvasIDInput): Promise<CanvasSection[]> {
    if (!courseId) return []
    return (await this.getall(`/courses/${courseId}/sections`)).map(s => new CanvasSection(s))
  }

  public async getSection (id: CanvasIDInput | SpecialSectionID): Promise<CanvasSection> {
    throwUnlessValidId(id, 'sis_section_id')
    return new CanvasSection(await this.get(`/sections/${id}`))
  }

  public async getSectionBySIS (sisId: SISSectionID) {
    return await this.getSection(`sis_section_id:${sisId}`)
  }

  public async courseSectionsBatched (courseIds: CanvasIDInput[]): Promise<CanvasSection[]> {
    return await Promise.all(courseIds.map(id => this.courseSections(id)))
      .then(c => c.flat())
  }

  public async createSection (courseId: CanvasIDInput, sectionPayload: CanvasSectionPayload): Promise<CanvasSection> {
    return new CanvasSection(await this.post(`/courses/${courseId}/sections`, sectionPayload))
  }

  public async createSections (courseId: CanvasIDInput, sectionPayloads: CanvasSectionPayload[]): Promise<CanvasSection[]> {
    return await Promise.all(sectionPayloads.map((payload: CanvasSectionPayload) => this.createSection(courseId, payload)))
  }

  public async deleteSection (id: CanvasIDInput | SpecialSectionID) {
    throwUnlessValidId(id, 'sis_section_id')
    const enrollments = await this.getSectionEnrollments(id)
    await Promise.all(enrollments.map(enrollment => this.deleteEnrollmentFromSection(enrollment)))
    const canvasSectionId = await this.removeSISFromSection(id).then(res => res.id)
    return new CanvasSection(await this.delete(`/sections/${canvasSectionId}`))
  }

  public async deleteSectionBySIS (sisId: SISSectionID) {
    return await this.deleteSection(`sis_section_id:${sisId}`)
  }

  public async removeSISFromSection (id: CanvasIDInput | SpecialSectionID): Promise<CanvasSection> {
    throwUnlessValidId(id, 'sis_section_id')
    return new CanvasSection(await this.put(`/sections/${id}`, CanvasSectionPayload.asVoidSISSectionId()))
  }

  public async removeSISFromSectionBySIS (sisId: SISSectionID) {
    return await this.removeSISFromSection(`sis_section_id:${sisId}`)
  }

  public async removeSISFromSectionsBySIS (sisIds: SISSectionID[]) {
    return await Promise.all(sisIds.map(sisId => this.removeSISFromSectionBySIS(sisId)))
  }

  public async sectionExists (id: CanvasIDInput | SpecialSectionID) {
    throwUnlessValidId(id, 'sis_section_id')
    return await this.head(`/sections/${id}`)
  }

  public async sectionsExist (ids: (CanvasIDInput | SpecialSectionID)[]) {
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
    const { roles, ...params }: Record<string, any> = filters ?? {}
    if (roles?.length) params.role = roles
    return params
  }

  public async getCourseEnrollments (id: CanvasIDInput | SpecialCourseID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    throwUnlessValidId(id, 'sis_course_id')
    return (await this.getall(`/courses/${id}/enrollments`, this.enrollmentParams(params))).map(e => new CanvasEnrollment(e))
  }

  public async getSectionEnrollments (id: CanvasIDInput | SpecialSectionID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    throwUnlessValidId(id, 'sis_section_id')
    return (await this.getall(`/sections/${id}/enrollments`, this.enrollmentParams(params))).map(e => new CanvasEnrollment(e))
  }

  public async getSectionEnrollmentsBySIS (sisId: SISSectionID, params?: CanvasEnrollmentParams): Promise<CanvasEnrollment[]> {
    return await this.getSectionEnrollments(`sis_section_id:${sisId}`, params)
  }

  public async getUserEnrollments (userId?: CanvasIDInput | SpecialUserID, params?: Omit<CanvasEnrollmentParams, 'user_id'>): Promise<CanvasEnrollment[]> {
    userId && throwUnlessValidUserId(userId)
    return (await this.getall(`/users/${userId ?? 'self'}/enrollments`, this.enrollmentParams(params))).map(e => new CanvasEnrollment(e))
  }

  public async createEnrollment (courseId: CanvasIDInput, enrollmentPayload: CanvasEnrollmentPayload): Promise<CanvasEnrollment> {
    return new CanvasEnrollment(await this.post(`/courses/${courseId}/enrollments`, enrollmentPayload))
  }

  public async deactivateEnrollmentFromSection (enrollment: Pick<CanvasEnrollment, 'id' | 'course_id'>): Promise<CanvasEnrollment> {
    return new CanvasEnrollment(await this.delete(`/courses/${enrollment.course_id}/enrollments/${enrollment.id}`, { task: 'deactivate' }))
  }

  public async deactivateAllEnrollmentsFromSectionsBySis (sisIds: SISSectionID[]) {
    const enrollments = await Promise.all(sisIds.map(async sisId => {
      return await this.getSectionEnrollmentsBySIS(sisId)
    }))

    return await Promise.all(enrollments.flat().map(async (enrollment: CanvasEnrollment) => await this.deactivateEnrollmentFromSection(enrollment)))
  }

  public async deleteEnrollmentFromSection (enrollment: Pick<CanvasEnrollment, 'id' | 'course_id'>): Promise<CanvasEnrollment> {
    return new CanvasEnrollment(await this.delete(`/courses/${enrollment.course_id}/enrollments/${enrollment.id}`, { task: 'delete' }))
  }

  // TERM
  public async getEnrollmentTerms (accountId?: CanvasIDInput, params?: CanvasEnrollmentTermParams): Promise<CanvasEnrollmentTerm[]> {
    accountId ??= (await this.getRootAccount()).id
    if (!accountId) return []
    return (await this.getall(`/accounts/${accountId}/terms`, params, 'enrollment_terms')).map((t: ICanvasEnrollmentTerm) => new CanvasEnrollmentTerm(t))
  }

  public async getEnrollmentTermCurrent (forDate = new Date()) {
    const terms = await this.getEnrollmentTerms()
    for (const term of terms) {
      if (term.start_at && term.end_at && term.start_at < forDate && term.end_at > forDate) return term
    }
    return undefined
  }

  public async getEnrollmentTerm (accountId: CanvasIDInput, termId: CanvasIDInput | SpecialTermID): Promise<CanvasEnrollmentTerm> {
    throwUnlessValidId(termId, 'sis_term_id')
    return new CanvasEnrollmentTerm(await this.get(`/accounts/${accountId}/terms/${termId}`))
  }

  public async getEnrollmentTermBySis (accountId: CanvasIDInput, sisTermId: SISTermID): Promise<CanvasEnrollmentTerm> {
    return await this.getEnrollmentTerm(accountId, `sis_term_id:${sisTermId}`)
  }

  public async createEnrollmentTerm (accountId: CanvasIDInput | undefined, enrollmentTermPayload: CanvasEnrollmentTermPayload) {
    accountId ??= (await this.getRootAccount()).id
    if (!accountId) throw new Error('Tried to create an enrollment term with no account ID and root account could not be determined.')
    return new CanvasEnrollmentTerm(await this.post(`/accounts/${accountId}/terms`, enrollmentTermPayload))
  }

  // User
  public async getUser (id?: CanvasIDInput | SpecialUserID) {
    id && throwUnlessValidUserId(id)
    return new CanvasUser(await this.get(`/users/${id ?? 'self'}`))
  }

  public async updateUser (id: CanvasIDInput | SpecialUserID | 'self', payload: CanvasUserUpdatePayload) {
    throwUnlessValidUserId(id)
    return new CanvasUser(await this.put(`/users/${id}`, payload))
  }

  // External Tools
  public async getExternalTools (accountId?: CanvasIDInput): Promise<ExternalTool[]> {
    accountId ??= (await this.getRootAccount()).id
    if (!accountId) return []
    return (await this.getall(`/accounts/${accountId}/external_tools`)).map(t => new ExternalTool(t))
  }

  public async createExternalTool (accountId: CanvasIDInput | undefined, externalToolPayload: ExternalToolPayload): Promise<ExternalTool> {
    accountId ??= (await this.getRootAccount()).id
    if (!accountId) throw new Error('Tried to create an external tool with no account ID and root account could not be determined.')
    return new ExternalTool(await this.post(`/accounts/${accountId}/external_tools`, externalToolPayload))
  }

  public async editExternalTool (accountId: CanvasIDInput, toolId: CanvasIDInput, externalToolPayload: Partial<ExternalToolPayload>): Promise<ExternalTool> {
    return new ExternalTool(await this.put(`/accounts/${accountId}/external_tools/${toolId}`, externalToolPayload))
  }
}
