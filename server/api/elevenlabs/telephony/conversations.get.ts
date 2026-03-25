export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.elevenlabsApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ELEVENLABS_API_KEY not configured',
      data: { error: 'missing_api_key', message: 'Configure ELEVENLABS_API_KEY in your environment variables.' }
    })
  }

  const query = getQuery(event)
  const params = new URLSearchParams()

  if (query.agent_id) params.set('agent_id', String(query.agent_id))
  if (query.page_size) params.set('page_size', String(query.page_size))
  else params.set('page_size', '30')
  if (query.cursor) params.set('cursor', String(query.cursor))
  if (query.call_successful) params.set('call_successful', String(query.call_successful))
  if (query.call_start_before_unix) params.set('call_start_before_unix', String(query.call_start_before_unix))
  if (query.call_start_after_unix) params.set('call_start_after_unix', String(query.call_start_after_unix))

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations?${params.toString()}`, {
      headers: { 'xi-api-key': apiKey }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createError({
        statusCode: response.status,
        statusMessage: 'ElevenLabs API error',
        data: { error: 'elevenlabs_error', message: errorData?.detail?.message || errorData?.detail || `API returned ${response.status}` }
      })
    }

    return await response.json()
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: { error: 'server_error', message: e.message || 'Failed to fetch conversations' }
    })
  }
})
