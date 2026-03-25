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

  // Accept fields from either nested twilio object (UI sends this) or flat
  const phoneNumber = body.twilio?.phone_number || body.phone_number
  const label = body.twilio?.label || body.label || ''
  // Use provided Twilio credentials or fall back to env vars
  const sid = body.twilio?.twilio_account_sid || body.twilio?.sid || body.sid || config.twilioAccountSid
  const token = body.twilio?.twilio_auth_token || body.twilio?.token || body.token || config.twilioAuthToken

  if (!phoneNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Phone number is required'
    })
  }

  if (!sid || !token) {
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
    // ElevenLabs API expects FLAT body: { phone_number, label, sid, token, provider }
    // NOT nested under a "twilio" key (confirmed via OpenAPI spec)
    const response = await fetch('https://api.elevenlabs.io/v1/convai/phone-numbers', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'twilio',
        phone_number: phoneNumber,
        label,
        sid,
        token
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      let errorMessage = `ElevenLabs API returned ${response.status}`
      if (Array.isArray(errorData?.detail)) {
        errorMessage = errorData.detail
          .filter((e: any) => e.loc?.[1] === 'CreateTwilioPhoneNumberRequest')
          .map((e: any) => `${e.loc?.slice(2).join('.')}: ${e.msg}`)
          .join('; ') || errorData.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join('; ')
      } else if (typeof errorData?.detail === 'string') {
        errorMessage = errorData.detail
      } else if (errorData?.detail?.message) {
        errorMessage = errorData.detail.message
      }
      throw createError({
        statusCode: response.status,
        statusMessage: 'ElevenLabs API error',
        data: { error: 'elevenlabs_error', message: errorMessage }
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
