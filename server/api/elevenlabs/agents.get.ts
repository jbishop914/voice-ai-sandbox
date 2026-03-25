export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const apiKey = config.elevenlabsApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ELEVENLABS_API_KEY not configured',
      data: {
        error: 'missing_api_key',
        message: 'Configure ELEVENLABS_API_KEY in your environment variables to enable ElevenLabs Studio.'
      }
    })
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      headers: {
        'xi-api-key': apiKey
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createError({
        statusCode: response.status,
        statusMessage: 'ElevenLabs API error',
        data: {
          error: 'elevenlabs_error',
          message: errorData?.detail?.message || `ElevenLabs API returned ${response.status}`
        }
      })
    }

    const data = await response.json()
    return data.agents || []
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: {
        error: 'server_error',
        message: e.message || 'Failed to fetch agents'
      }
    })
  }
})
