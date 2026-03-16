const DB_NAME = 'salama-offline'
const DB_VERSION = 1
const STORE = 'beneficiaires_pending'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'local_id', autoIncrement: true })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = () => reject(req.error)
  })
}

export async function savePending(data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add({ ...data, saved_at: new Date().toISOString() })
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getPending() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function deletePending(local_id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(local_id)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function syncPending(apiUrl) {
  const pending = await getPending()
  if (pending.length === 0) return { synced: 0 }
  
  let synced = 0
  for (const item of pending) {
    try {
      const { local_id, saved_at, ...data } = item
      await fetch(`${apiUrl}/beneficiaires`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      await deletePending(local_id)
      synced++
    } catch {}
  }
  return { synced, remaining: pending.length - synced }
}