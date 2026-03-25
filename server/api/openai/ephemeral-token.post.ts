export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'OPENAI_API_KEY not configured',
      data: {
        error: 'missing_api_key',
        message: 'Configure OPENAI_API_KEY in your environment variables to enable live voice chat.'
      }
    })
  }

  const body = await readBody(event)
  const model = body?.model || 'gpt-4o-realtime-preview'
  const voice = body?.voice || 'alloy'

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        voice
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createError({
        statusCode: response.status,
        statusMessage: 'OpenAI API error',
        data: {
          error: 'openai_error',
          message: errorData?.error?.message || `OpenAI API returned ${response.status}`
        }
      })
    }

    const data = await response.json()
    return data
  } catch (e: any) {
    if (e.statusCode) throw e // Re-throw createError errors

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: {
        error: 'server_error',
        message: e.message || 'Failed to create ephemeral token'
      }
    })
  }
})
