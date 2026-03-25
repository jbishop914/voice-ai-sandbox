export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.elevenlabsApiKey

  if (!apiKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ELEVENLABS_API_KEY not configured',
      data: {
        error: 'missing_api_key',
        message: 'Configure ELEVENLABS_API_KEY in your environment variables to enable Telephony Lab.'
      }
    })
  }

  const body = await readBody(event)

  // Use provided Twilio credentials or fall back to env vars
  const twilioAccountSid = body.twilio?.twilio_account_sid || config.twilioAccountSid
  const twilioAuthToken = body.twilio?.twilio_auth_token || config.twilioAuthToken
  const phoneNumber = body.twilio?.phone_number
  const label = body.twilio?.label || ''

  if (!phoneNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone number is required'
    })
  }

  if (!twilioAccountSid || !twilioAuthToken) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Twilio credentials required',
      data: {
        error: 'missing_credentials',
        message: 'Provide Twilio Account SID and Auth Token to import a phone number.'
      }
    })
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/phone-numbers', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        twilio: {
          phone_number: phoneNumber,
          label,
          twilio_account_sid: twilioAccountSid,
          twilio_auth_token: twilioAuthToken
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw createError({
        statusCode: response.status,
        statusMessage: 'ElevenLabs API error',
        data: {
          error: 'elevenlabs_error',
          message: errorData?.detail?.message || errorData?.detail || `ElevenLabs API returned ${response.status}`
        }
      })
    }

    return await response.json()
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: { error: 'server_error', message: e.message || 'Failed to import phone number' }
    })
  }
})
