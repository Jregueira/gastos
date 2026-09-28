// Phase 3 seam: this app is local-only (Dexie/IndexedDB) for now. A Supabase-backed
// implementation of this interface will later push/pull expenses, settlements, categories
// and settings between the two household members' devices in real time. Nothing else in
// the app should talk to a backend directly — everything should go through this shape.

export interface SyncAdapter {
  isEnabled(): boolean
  push(): Promise<void>
  pull(): Promise<void>
  subscribe(onRemoteChange: () => void): () => void
}

export const noopSyncAdapter: SyncAdapter = {
  isEnabled: () => false,
  push: async () => {},
  pull: async () => {},
  subscribe: () => () => {},
}
