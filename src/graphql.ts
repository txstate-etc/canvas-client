import { type CanvasAPI } from './canvas.js'
import { createClient, type Client, type FieldsSelection, type Query, type QueryGenqlSelection } from './typed-client/index.js'
import { linkTypeMap } from './typed-client/runtime/index.js'
import type { LinkedField, LinkedType } from './typed-client/runtime/types.js'
import types from './typed-client/types.js'
export * from './typed-client/index.js'

/** Canvas refuses to return more than this many items per page, no matter what you ask for in `first`. */
const MAX_PAGE_SIZE = 100

const typeMap = linkTypeMap(types as any) as unknown as Record<string, LinkedType>
const nodeTypes = new Set(Object.keys(typeMap.Node.fields ?? {}).filter(k => k.startsWith('on_')).map(k => k.slice(3)))

type Selection = Record<string, any>

function isConnection (field: LinkedField | undefined): field is LinkedField {
  return field?.type.fields?.pageInfo != null && field.args?.after != null
}

function fieldType (type: LinkedType, key: string) {
  const field = type.fields?.[key]
  if (!field) throw new Error(`type \`${type.name}\` does not have a field \`${key}\``)
  return field.type
}

/**
 * Copies a genql request, adding what queryAll needs to finish each connection: `first` defaulted to
 * the max page size, `pageInfo { hasNextPage endCursor }` on the connection, and `id` and `__typename`
 * on the object that holds it, so we can come back to it later through `node(id)`.
 */
function augment (sel: Selection, type: LinkedType): Selection {
  const ret: Selection = { ...sel }
  let holdsConnection = false
  for (const [key, val] of Object.entries(sel)) {
    if (key.startsWith('__') || val == null || typeof val !== 'object') continue
    if (key.startsWith('on_')) {
      ret[key] = augment(val, fieldType(type, key))
      continue
    }
    const field = type.fields?.[key]
    if (!field) throw new Error(`type \`${type.name}\` does not have a field \`${key}\``)
    const sub = augment(val, field.type)
    if (isConnection(field)) {
      holdsConnection = true
      sub.__args = { first: MAX_PAGE_SIZE, ...sub.__args }
      sub.pageInfo = { ...(typeof sub.pageInfo === 'object' ? sub.pageInfo : {}), hasNextPage: true, endCursor: true }
    }
    ret[key] = sub
  }
  if (holdsConnection) {
    ret.__typename = true
    if (type.fields?.id != null) ret.id = true
  }
  return ret
}

/** Whether a fragment `on_<fragmentType>` applies to an object whose `__typename` is `typename`. */
function fragmentApplies (fragmentType: LinkedType, typename: string | undefined) {
  return typename == null || fragmentType.name === typename || fragmentType.fields?.[`on_${typename}`] != null
}

/**
 * Removes everything from a response that the caller didn't ask for, which is to say the fields that
 * `augment` added. A key can be selected more than once (directly and inside fragments), so we gather
 * every selection that applies to an object before deciding.
 */
function prune (obj: any, sels: { sel: Selection, type: LinkedType }[]) {
  if (Array.isArray(obj)) {
    for (const item of obj) prune(item, sels)
    return
  }
  if (obj == null || typeof obj !== 'object') return
  const allowed = new Map<string, { sel: Selection, type: LinkedType }[]>()
  const visit = (sel: Selection, type: LinkedType) => {
    for (const [key, val] of Object.entries(sel)) {
      if (key === '__args' || key === '__name' || !val) continue
      if (key === '__scalar') {
        for (const s of type.scalar ?? []) if (sel[s] !== false && !allowed.has(s)) allowed.set(s, [])
      } else if (key.startsWith('on_')) {
        const ftype = fieldType(type, key)
        if (fragmentApplies(ftype, obj.__typename)) visit(val, ftype)
      } else {
        const list = allowed.get(key) ?? []
        if (typeof val === 'object') list.push({ sel: val, type: fieldType(type, key) })
        allowed.set(key, list)
      }
    }
  }
  for (const { sel, type } of sels) visit(sel, type)
  for (const key of Object.keys(obj)) {
    const list = allowed.get(key)
    if (!list) delete obj[key]
    else if (list.length) prune(obj[key], list)
  }
}

/**
 * Walks a response alongside the augmented request that produced it, and for every connection that
 * has more pages, fetches the rest and appends them in place. New pages get the same treatment, so
 * connections nested inside them get finished too.
 */
async function complete (client: Client, obj: any, sel: Selection, type: LinkedType): Promise<void> {
  if (Array.isArray(obj)) {
    await Promise.all(obj.map(async item => { await complete(client, item, sel, type) }))
    return
  }
  if (obj == null || typeof obj !== 'object') return
  const promises: Promise<void>[] = []
  for (const [key, val] of Object.entries(sel)) {
    if (key.startsWith('__') || val == null || typeof val !== 'object') continue
    if (key.startsWith('on_')) {
      const ftype = fieldType(type, key)
      if (fragmentApplies(ftype, obj.__typename)) promises.push(complete(client, obj, val, ftype))
      continue
    }
    const field = type.fields![key]!
    if (isConnection(field) && obj[key] != null) promises.push(completeConnection(client, obj, key, val, field.type, type))
    else promises.push(complete(client, obj[key], val, field.type))
  }
  await Promise.all(promises)
}

async function completeConnection (client: Client, parent: any, key: string, sel: Selection, connType: LinkedType, parentType: LinkedType) {
  const conn = parent[key]
  await complete(client, conn, sel, connType)
  let pageInfo = conn.pageInfo
  while (pageInfo?.hasNextPage) {
    const connSel = { ...sel, __args: { ...sel.__args, after: pageInfo.endCursor } }
    let page: any
    if (parentType.name === 'Query') {
      page = (await client.query({ [key]: connSel } as any) as any)[key]
    } else {
      const typename: string = parent.__typename
      if (!nodeTypes.has(typename)) throw new Error(`queryAll can't fetch more pages of ${typename}.${key} because ${typename} doesn't implement Node, so there's no way to query it again by id. Use paginate() with a query that reaches it another way.`)
      const res = await client.query({ node: { __args: { id: parent.id }, [`on_${typename}`]: { [key]: connSel } } } as any) as any
      page = res.node?.[key]
    }
    if (page == null) throw new Error(`queryAll got an empty response fetching the next page of ${parentType.name}.${key}.`)
    await complete(client, page, sel, connType)
    if (page.nodes) conn.nodes?.push(...page.nodes)
    if (page.edges) conn.edges?.push(...page.edges)
    conn.pageInfo = { ...conn.pageInfo, ...page.pageInfo }
    pageInfo = page.pageInfo
  }
}

export interface CanvasGraphQLClient extends Client {
  /**
   * Works like `query`, except that every connection in the request comes back complete, however many
   * pages that takes, including connections nested inside other connections.
   *
   * Connections fetch 100 items per page (the most Canvas allows) unless you pass `first` yourself, in
   * which case it's used as the page size. To continue a connection, we query its parent again by id
   * through `node`, so the parent has to implement Node. Nearly everything does, and you'll get an error
   * if it doesn't. Each extra page is its own request, so a connection nested inside a long connection
   * can add up to a lot of requests. They all go through the CanvasAPI's rate limiting.
   */
  queryAll: <R extends QueryGenqlSelection>(request: R & { __name?: string }) => Promise<FieldsSelection<Query, R>>
  /**
   * Fetches every page of a single connection and returns all of its nodes. `buildRequest` receives the
   * cursor for the page to fetch (undefined for the first page) and should pass it as `after`, and
   * `getConnection` picks the connection out of the response. The connection must select
   * `pageInfo { hasNextPage endCursor }`.
   *
   * queryAll is usually more convenient, but this works on connections whose parent doesn't implement
   * Node, and it leaves any connections nested inside the nodes alone.
   */
  paginate: <R extends QueryGenqlSelection, T>(
    buildRequest: (after: string | undefined) => R & { __name?: string },
    getConnection: (response: FieldsSelection<Query, R>) => { nodes?: (T | null)[] | null, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } | null | undefined
  ) => Promise<T[]>
}

/**
 * Create a typed GraphQL client for Canvas. Requests go through the given CanvasAPI's graphql
 * method, so they share its tokens and rate limits with RESTful requests.
 */
export function createCanvasGraphQLClient (api: CanvasAPI): CanvasGraphQLClient {
  const client = createClient({
    fetcher: async operation => {
      if (Array.isArray(operation)) throw new Error('Batching not supported')
      return { data: await api.graphql(operation.query, operation.variables) }
    }
  })
  return {
    ...client,
    queryAll: async request => {
      const augmented = augment(request, typeMap.Query)
      const res = await client.query(augmented as any)
      await complete(client, res, augmented, typeMap.Query)
      prune(res, [{ sel: request, type: typeMap.Query }])
      return res as any
    },
    paginate: async (buildRequest, getConnection) => {
      const ret: any[] = []
      let after: string | undefined
      do {
        const conn = getConnection(await client.query(buildRequest(after)))
        if (conn == null) break
        ret.push(...(conn.nodes ?? []).filter(n => n != null))
        after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor ?? undefined : undefined
      } while (after != null)
      return ret
    }
  }
}
