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
          sid: twilioAccountSid,
          token: twilioAuthToken
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // ElevenLabs 422 returns detail as an array of validation errors
      let errorMessage = `ElevenLabs API returned ${response.status}`
      if (Array.isArray(errorData?.detail)) {
        errorMessage = errorData.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join('; ')
      } else if (typeof errorData?.detail === 'string') {
        errorMessage = errorData.detail
      } else if (errorData?.detail?.message) {
        errorMessage = errorData.detail.message
      }
      throw createError({
        statusCode: response.status,
        statusMessage: 'ElevenLabs API error',
        data: {
          error: 'elevenlabs_error',
          message: errorMessage
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
