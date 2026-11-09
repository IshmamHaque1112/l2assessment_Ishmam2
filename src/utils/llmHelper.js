import Groq from 'groq-sdk'
import { UNCATEGORIZED, PRIORITY_ORDER, getAllCategories, maxPriority, priorityRank } from './categories'
import { classifyByKeywords, computeUrgency, scoreMessage } from './classifier'

/**
 * Message analysis: keyword classifier + Groq AI.
 *
 * The keyword classifier always runs. If a Groq API key is configured, the AI
 * picks from the same category list (it cannot invent categories), and the two
 * are combined so that safety categories and severity terms are never
 * downgraded by the AI. Without a key, or if the API call fails, the keyword
 * result is used on its own.
 */

let groqClient = null
function getClient() {
  const apiKey = import.meta.env?.VITE_GROQ_API_KEY
  if (!apiKey || apiKey.includes('your-actual-key') || apiKey.includes('your_')) return null
  if (!groqClient) {
    groqClient = new Groq({
      apiKey,
      dangerouslyAllowBrowser: true, // Browser-based calls: local development only!
    })
  }
  return groqClient
}

function buildPrompt(message, categories, keywordResult) {
  const list = categories
    .map(
      (c) =>
        `- "${c.name}" (minimum priority: ${c.priority})${c.description ? `: ${c.description}` : ''}` +
        `\n  example keywords: ${c.keywords.slice(0, 25).join(', ')}`
    )
    .join('\n')

  const hints = keywordResult.allMatches.length
    ? keywordResult.allMatches.map((m) => `${m.category}: ${m.keywords.join(', ')}`).join('\n')
    : 'none'

  return `You are a customer support triage assistant. Classify the customer message into ONE primary category from this list (use the exact name), plus any secondary categories that also apply.

Categories:
${list}

Rules:
- Health, injury, allergy, illness, or breathing problems -> "Health & Safety".
- Pests, dirt, mold, or unsanitary conditions -> "Sanitation & Hygiene".
- Dangerous products (battery swelling/leaking/exploding, overheating, fire, smoke, sparks, shock) -> "Product Safety Hazard".
- When a safety category applies alongside another (e.g., billing), the safety category is primary.
- Choose the closest fitting category whenever reasonably possible. Use "${UNCATEGORIZED}" only if the message truly fits none of them.
- Severity: "Critical" if someone may be in danger now or was seriously harmed (trouble breathing, hospital, fire/explosion, poisoning, self-harm); "High" for safety/health/sanitation issues, outages, fraud, or security problems; otherwise "Medium" or "Low".

Keyword matches found by the rule-based system (hints, may be incomplete):
${hints}

Respond with JSON only, in this exact shape:
{"category": "<exact category name>", "secondary_categories": ["<exact name>"], "severity": "Low|Medium|High|Critical", "reasoning": "<2-3 sentences explaining the category and severity>"}

Customer message:
"""${message}"""`
}

const describeKeywordResult = (kw) => {
  if (!kw.categoryId) {
    return 'No category keywords were found in this message, so it could not be categorized automatically. It has been routed to manual review with the FAQ link. Consider adding keywords or a custom category on the Settings page.'
  }
  const parts = [
    `Categorized as **${kw.category}** based on these keywords: ${kw.matchedKeywords.map((k) => `"${k}"`).join(', ')}.`,
  ]
  if (kw.secondaryCategories.length) parts.push(`Also related to: ${kw.secondaryCategories.join(', ')}.`)
  if (kw.criticalMatches.length) {
    parts.push(`Marked **Critical** because the message mentions: ${kw.criticalMatches.map((k) => `"${k}"`).join(', ')}.`)
  } else if (kw.highMatches.length) {
    parts.push(`Raised to at least **High** because the message mentions: ${kw.highMatches.map((k) => `"${k}"`).join(', ')}.`)
  }
  return parts.join(' ')
}

/**
 * Analyze a message.
 * @returns {Promise<{category, categoryId, secondaryCategories, matchedKeywords, criticalMatches, highMatches, urgency, reasoning, source}>}
 */
export async function analyzeMessage(message) {
  const categories = getAllCategories()
  const kw = classifyByKeywords(message, categories)
  const keywordOnly = { ...kw, reasoning: describeKeywordResult(kw), source: 'keywords' }

  const client = getClient()
  if (!client) return keywordOnly

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildPrompt(message, categories, kw) }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(response.choices[0].message.content)
    const byName = (name) =>
      categories.find((c) => c.name.toLowerCase() === String(name || '').trim().toLowerCase()) || null

    let primary = byName(parsed.category)
    const kwPrimary = categories.find((c) => c.id === kw.categoryId) || null

    // The AI cannot leave a message uncategorized when keywords clearly match,
    // and cannot outrank a safety category the keywords found.
    if (!primary && kwPrimary) primary = kwPrimary
    if (primary && kwPrimary && kwPrimary.safety && priorityRank(kwPrimary.priority) > priorityRank(primary.priority)) {
      primary = kwPrimary
    }

    const { ranked } = scoreMessage(message, categories)
    const secondaryObjs = [
      ...(parsed.secondary_categories || []).map(byName),
      ...ranked.map((r) => r.category),
    ].filter((c) => c && (!primary || c.id !== primary.id))
    const secondary = [...new Map(secondaryObjs.map((c) => [c.id, c])).values()]

    const aiSeverity = PRIORITY_ORDER.includes(parsed.severity) ? parsed.severity : 'Low'
    const urgency = maxPriority(
      computeUrgency({ primary, secondary, criticalMatches: kw.criticalMatches, highMatches: kw.highMatches }),
      aiSeverity
    )

    const reasoning = [parsed.reasoning, kw.matchedKeywords.length || kw.criticalMatches.length ? `\n\n_Keyword check:_ ${describeKeywordResult(kw)}` : '']
      .filter(Boolean)
      .join('')

    return {
      ...kw,
      category: primary ? primary.name : UNCATEGORIZED,
      categoryId: primary ? primary.id : null,
      secondaryCategories: secondary.slice(0, 3).map((c) => c.name),
      urgency,
      reasoning: reasoning || describeKeywordResult(kw),
      source: 'ai',
    }
  } catch (error) {
    console.warn('Groq API failed, using keyword classification:', error.message)
    return { ...keywordOnly, reasoning: `${keywordOnly.reasoning}\n\n_(AI unavailable: ${error.message})_` }
  }
}

/** Backwards-compatible helper. */
export async function categorizeMessage(message) {
  const { category, reasoning } = await analyzeMessage(message)
  return { category, reasoning }
}

/**
 * Write a customer reply with the AI, following the business's instructions
 * and drawing on its wiki. Returns null when the AI is unavailable, so the
 * caller can fall back to the template reply. Required content (company name,
 * links, safety contacts) is enforced afterwards by enforceReplyRequirements.
 */
export async function generateAiReply({ message, business, analysis, customerName, contacts = [], categoryLink, faqLink, articles = [] }) {
  const client = getClient()
  if (!client || business?.agent?.useAiReplies === false) return null

  const agent = business.agent || {}
  const wiki = articles.length
    ? articles
        .map((a, i) => `[Article ${i + 1}] ${a.title}${a.url ? ` (${a.url})` : ''}\n${a.content.slice(0, 1800)}`)
        .join('\n\n')
    : '(No wiki articles matched this message. Do not invent policies, prices, timelines, or promises.)'

  const required = [
    `Greet the customer as "${(customerName || '').trim() || 'there'}".`,
    `Write as ${business.companyName}'s support team and mention ${business.companyName} by name.`,
    categoryLink ? `Include this help link exactly: ${categoryLink}` : 'The message was not categorized: do not invent a help link.',
    `Include this FAQ link exactly: ${faqLink}`,
    analysis.urgency === 'Critical'
      ? 'This may be an emergency. Near the top, tell the customer to call 911 (or their local emergency number) if anyone is in danger or has severe symptoms.'
      : null,
    contacts.length ? `Include these contacts exactly as written:\n${contacts.map((c) => `- ${c.name}: ${c.contact}`).join('\n')}` : null,
    `Sign off with: ${agent.signature?.trim() || `The ${business.companyName} Support Team`}`,
  ].filter(Boolean)

  const prompt = `You are the customer support agent for ${business.companyName}. Write a reply to the customer message below.

Message details (from triage):
- Category: ${analysis.category}${analysis.secondaryCategories?.length ? ` (also: ${analysis.secondaryCategories.join(', ')})` : ''}
- Urgency: ${analysis.urgency}

Tone: ${agent.tone || 'Warm and professional'}

${business.companyName}'s instructions for replies:
${agent.instructions?.trim() || '(none provided)'}

${business.companyName}'s wiki (use these facts and policies; quote them accurately; never contradict them):
${wiki}

Required in every reply (these override the business instructions if they conflict):
${required.map((r) => `- ${r}`).join('\n')}
- Use only facts from the wiki or the message. If the wiki does not cover something, say the team will follow up rather than guessing.
- Never blame the customer, never discourage seeking medical help, and never ask the customer to keep a safety issue quiet.
- Plain text only (no markdown headings or bold). Keep it under 220 words unless the instructions ask otherwise.

Customer message:
"""${message}"""

Reply:`

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    })
    const text = response.choices[0].message.content?.trim()
    return text || null
  } catch (error) {
    console.warn('Groq reply generation failed, using template reply:', error.message)
    return null
  }
}
