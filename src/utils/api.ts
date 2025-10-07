export async function apiFetch(endpoint: string, options?: RequestInit) {
  const useMock = import.meta.env.VITE_USE_MOCK === "true"

  // remove /api/ prefix if using mock
  const mockPath = endpoint.replace(/^\/api\//, "/mockdata/") + ".json"

  const url = useMock ? mockPath : endpoint

  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Failed to load ${url}`)
  return res.json()
}


