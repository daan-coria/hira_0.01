console.log("💡 Mock mode: true")

export async function apiFetch(endpoint: string) {
  const clean = endpoint.replace(/^\/+/, "")
  const url = `${window.location.origin}/mockdata/${clean}`

  console.log("🌐 Fetching absolute URL:", url)

  const res = await fetch(url, { cache: "no-cache" })

  if (!res.ok) {
    throw new Error(`❌ Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }

  const text = await res.text()

  try {
    return JSON.parse(text)
  } catch (e) {
    console.error(`❌ Invalid JSON in ${url}:`, text.slice(0, 120))
    throw e
  }
}
