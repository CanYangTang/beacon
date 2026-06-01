import { generateId } from './utils'

const SESSION_KEY = '__analytics_session_id'

export function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') {
    return generateId()
  }

  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = generateId()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}
