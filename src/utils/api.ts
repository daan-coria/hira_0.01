export async function apiFetch(endpoint: string) {
  const url = `${window.location.origin}/mockdata/${endpoint.replace(/^\/+/, '')}`
  console.log("🌍 Fetching absolute URL:", url)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${url}`)

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch (e) {
    console.error(`❌ Invalid JSON in ${url}:`, text.slice(0, 120))
    throw e
  }
}
