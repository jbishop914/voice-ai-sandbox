export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.elevenlabsApiKey
  const phoneNumberId = getRouterParam(event, 'id')

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ELEVENLABS_API_KEY not configured',
      data: { error: 'missing_api_key', message: 'Configure ELEVENLABS_API_KEY in your environment variables.' }
    })
  }

  if (!phoneNumberId) {
    throw createError({ statusCode: 400, statusMessage: 'Phone number ID is required' })
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/phone-numbers/${phoneNumberId}`, {
      method: 'DELETE',
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

    // DELETE may return 204 with no body
    if (response.status === 204) return { success: true }
    return await response.json().catch(() => ({ success: true }))
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: { error: 'server_error', message: e.message || 'Failed to delete phone number' }
    })
  }
})
