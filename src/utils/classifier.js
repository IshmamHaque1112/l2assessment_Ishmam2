/**
 * Keyword-based classifier.
 *
 * Scores every category (default + custom) by the keywords found in the
 * message, detects severity terms, and decides which emergency contacts apply.
 * The keyword classifier always runs. When the Groq API is available its
 * judgment is combined with these results (see llmHelper.js), and when it is
 * not, these results are used on their own.
 */

import {
  CRITICAL_TERMS,
  HIGH_TERMS,
  UNCATEGORIZED,
  getAllCategories,
  getSettings,
  maxPriority,
  priorityRank,
} from './categories'

/** Lowercase, drop apostrophes ("can't" -> "cant"), turn punctuation into spaces. */
export function normalize(text) {
  return ` ${String(text || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const regexCache = new Map()

/** Regex for a keyword that also accepts common word endings (s, es, ed, d, ing). */
function keywordRegex(keyword) {
  const norm = normalize(keyword).trim()
  if (!norm) return null
  if (!regexCache.has(norm)) {
    const parts = norm.split(' ').map(escapeRegex)
    // allow endings on the last word of the phrase
    const pattern = ` ${parts.join(' ')}(?:s|es|ed|d|ing)? `
    regexCache.set(norm, new RegExp(pattern))
  }
  return regexCache.get(norm)
}

/** Return the keywords from `keywords` that appear in an already-normalized message. */
export function findMatches(normalizedMessage, keywords) {
  const hits = []
  for (const kw of keywords || []) {
    const re = keywordRegex(kw)
    if (re && re.test(normalizedMessage)) hits.push(kw)
  }
  // Drop a keyword when a longer match already covers it: a phrase containing it
  // ("battery" inside "swollen battery") or the same word with an ending
  // ("explode" when "exploded" matched). "deliver" and "delivery" both count.
  const covers = (other, kw) => {
    const o = normalize(other)
    const k = normalize(kw)
    if (o.includes(k)) return true
    const ow = o.trim()
    const kwd = k.trim()
    return ow.startsWith(kwd) && /^(s|es|ed|d|ing)$/.test(ow.slice(kwd.length))
  }
  return hits.filter((kw) => !hits.some((other) => other !== kw && other.length > kw.length && covers(other, kw)))
}

const keywordWeight = (kw) => 1 + (normalize(kw).trim().split(' ').length - 1) * 0.75

/**
 * Score all categories.
 * @returns {{ ranked: Array<{category, score, matches}>, criticalMatches: string[], highMatches: string[] }}
 */
export function scoreMessage(message, categories = getAllCategories()) {
  const text = normalize(message)

  const ranked = categories
    .map((category) => {
      const matches = findMatches(text, category.keywords)
      const raw = matches.reduce((sum, kw) => sum + keywordWeight(kw), 0)
      // Safety and high-priority categories win close calls, and a business's
      // own categories beat the generic built-in ones.
      // General Inquiry is a catch-all, so question wording ("when does", "how do i")
      // shouldn't outweigh the actual topic of the message.
      const boost =
        (1 + priorityRank(category.priority) * 0.15) * (category.custom ? 1.25 : 1) * (category.id === 'general' ? 0.6 : 1)
      return { category, matches, score: +(raw * boost).toFixed(2) }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || priorityRank(b.category.priority) - priorityRank(a.category.priority))

  return {
    ranked,
    criticalMatches: findMatches(text, CRITICAL_TERMS),
    highMatches: findMatches(text, HIGH_TERMS),
  }
}

/** Urgency from the categories involved plus severity terms. */
export function computeUrgency({ primary, secondary = [], criticalMatches = [], highMatches = [] }) {
  let urgency = primary ? primary.priority : 'Low'

  // Safety categories found anywhere in the message raise urgency too.
  for (const c of secondary) {
    if (c.safety) urgency = maxPriority(urgency, c.priority)
  }
  if (highMatches.length) urgency = maxPriority(urgency, 'High')
  if (criticalMatches.length) urgency = 'Critical'
  return urgency
}

const MEDICAL_HINTS = ['breath', 'asthma', 'allerg', 'anaphyla', 'epipen', 'epi pen', 'throat', 'poison',
  'swallow', 'ingest', 'battery', 'seizure', 'unconscious', 'faint', 'passed out', 'chest', 'bleed',
  'hospital', 'ambulance', 'overdose', 'choking', 'burn', 'fumes', 'carbon monoxide', 'gas leak']
const FOOD_HINTS = ['food', 'ate', 'eat', 'eating', 'meal', 'restaurant', 'menu', 'dish', 'peanut', 'nut',
  'allerg', 'salmonella', 'listeria', 'e coli', 'ecoli', 'botulism', 'poisoning', 'undercooked', 'spoiled',
  'expired', 'contaminat', 'drink', 'snack', 'sandwich', 'burger', 'chicken', 'meat', 'milk', 'store', 'bread',
  'cookie', 'cake', 'fruit', 'produce', 'grocery', 'coffee', 'kitchen', 'granola', 'cereal', 'mold']
const CRISIS_HINTS = ['suicide', 'suicidal', 'kill myself', 'self harm', 'hurt myself', 'end my life']

/**
 * Decide which emergency / safety contacts apply.
 * Critical messages always get emergency services; other contacts depend on
 * what the message is about.
 */
export function selectContacts({ urgency, categoryIds = [], message, contacts = getSettings().emergencyContacts }) {
  const text = normalize(message)
  const has = (hints) => hints.some((h) => text.includes(h))
  const wanted = new Set()

  const isCritical = urgency === 'Critical'
  const health = categoryIds.includes('health_safety')
  const sanitation = categoryIds.includes('sanitation')
  const product = categoryIds.includes('product_safety')

  if (isCritical) wanted.add('critical')
  if (isCritical && (health || product || has(MEDICAL_HINTS))) wanted.add('medical')
  if (has(CRISIS_HINTS)) {
    wanted.add('crisis')
    wanted.add('critical')
  }
  if (product) wanted.add('product')
  if ((health || sanitation) && has(FOOD_HINTS)) wanted.add('food')
  if (sanitation) wanted.add('sanitation')

  return (contacts || []).filter((c) => wanted.has(c.when))
}

/**
 * Full keyword-only classification (used directly when the AI is unavailable,
 * and as the safety net when it is).
 */
export function classifyByKeywords(message, categories = getAllCategories()) {
  const { ranked, criticalMatches, highMatches } = scoreMessage(message, categories)
  const primary = ranked[0]?.category || null
  const secondary = ranked.slice(1).map((r) => r.category)
  const urgency = computeUrgency({ primary, secondary, criticalMatches, highMatches })

  return {
    category: primary ? primary.name : UNCATEGORIZED,
    categoryId: primary ? primary.id : null,
    secondaryCategories: secondary.slice(0, 3).map((c) => c.name),
    matchedKeywords: ranked.length ? ranked[0].matches : [],
    allMatches: ranked.map((r) => ({ category: r.category.name, score: r.score, keywords: r.matches })),
    criticalMatches,
    highMatches,
    urgency,
  }
}
