export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error((body as { error?: string }).error ?? 'Request failed')
    throw err
  }
  return res.json() as Promise<T>
}
