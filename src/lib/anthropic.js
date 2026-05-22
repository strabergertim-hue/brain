import Anthropic from '@anthropic-ai/sdk'

const STORAGE_KEY = 'anthropic_api_key'
const MODEL = 'claude-sonnet-4-6'
const PROMPT =
  'This is a handwritten journal page. Please transcribe all handwritten text exactly as written, preserving paragraph breaks. Return only the transcribed text, nothing else.'

export const ERR_NO_KEY = 'NO_API_KEY'
export const ERR_NO_TEXT = 'NO_TEXT'

export function getApiKey() {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

export function maskApiKey(key) {
  if (!key) return ''
  if (key.length <= 12) return '••••••••'
  return `${key.slice(0, 7)}…${key.slice(-4)}`
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

export async function transcribeHandwriting(dataUrl, mediaType) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error(ERR_NO_KEY)

  const commaIdx = dataUrl.indexOf(',')
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: PROMPT },
      ],
    }],
  })

  const block = response.content?.find(b => b.type === 'text')
  const text = block?.text?.trim()
  if (!text) throw new Error(ERR_NO_TEXT)
  return text
}
