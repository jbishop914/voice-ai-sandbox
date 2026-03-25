export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.elevenlabsApiKey
  const conversationId = getRouterParam(event, 'id')

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ELEVENLABS_API_KEY not configured',
      data: { error: 'missing_api_key', message: 'Configure ELEVENLABS_API_KEY in your environment variables.' }
    })
  }

  if (!conversationId) {
    throw createError({ statusCode: 400, statusMessage: 'Conversation ID is required' })
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
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

    // Stream the audio response back
    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    setResponseHeader(event, 'content-type', contentType)

    const arrayBuffer = await response.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: { error: 'server_error', message: e.message || 'Failed to fetch conversation audio' }
    })
  }
})
