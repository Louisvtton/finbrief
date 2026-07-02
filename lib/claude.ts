import Anthropic from '@anthropic-ai/sdk'
import type { DigestContent } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateDigestWithClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<DigestContent> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: systemPrompt,
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  let jsonStr = text.trim()
  const fenceMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/m)
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim()
  } else {
    // Fallback: extract the outermost JSON object
    const start = jsonStr.indexOf('{')
    const end = jsonStr.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      jsonStr = jsonStr.slice(start, end + 1)
    }
  }

  return JSON.parse(jsonStr) as DigestContent
}

// Batch API version — 50% cheaper, used for scheduled sends
export async function createDigestBatch(
  requests: Array<{ customId: string; systemPrompt: string; userPrompt: string }>
) {
  const batch = await client.beta.messages.batches.create({
    requests: requests.map(({ customId, systemPrompt, userPrompt }) => ({
      custom_id: customId,
      params: {
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user' as const, content: userPrompt }],
      },
    })),
  })
  return batch
}

export async function getBatchResults(batchId: string) {
  return client.beta.messages.batches.retrieve(batchId)
}
