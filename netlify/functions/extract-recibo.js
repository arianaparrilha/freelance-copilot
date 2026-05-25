export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  const { fileBase64, mimeType } = body
  if (!fileBase64 || !mimeType) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fileBase64 or mimeType' }) }
  }

  const prompt = `Extract the following fields from this Portuguese recibo verde (green receipt/invoice).
Return ONLY a valid JSON object with these fields (use null for any field you cannot find):
{
  "invoice_number": "the invoice or receipt number (e.g. 2025/001)",
  "date": "the invoice date in YYYY-MM-DD format",
  "amount": the net amount as a number (valor líquido or valor a receber, NOT the gross),
  "description": "the service description",
  "client_name": "the client or company name"
}`

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: fileBase64 } },
          ]
        }]
      })
    }
  )

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    console.error('Gemini error status:', geminiRes.status)
    console.error('Gemini error body:', err)
    return { statusCode: 502, body: JSON.stringify({ error: 'Gemini API error', status: geminiRes.status, detail: err }) }
  }

  const geminiData = await geminiRes.json()
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Strip markdown code fences if Gemini wraps the JSON
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let extracted
  try {
    extracted = JSON.parse(cleaned)
  } catch {
    return { statusCode: 200, body: JSON.stringify({ error: 'Could not parse Gemini response', raw }) }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(extracted),
  }
}
