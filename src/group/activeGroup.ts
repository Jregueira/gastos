const STORAGE_KEY = 'gastos:activeGroupId'

export function getStoredActiveGroupId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredActiveGroupId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // ignore (private browsing, storage disabled, etc.)
  }
}
