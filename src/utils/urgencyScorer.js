/**
 * Urgency Scorer
 *
 * Urgency is driven by what the message is about, not by punctuation, length,
 * politeness, or the time of day:
 *   1. Every category has a minimum priority (Health & Safety, Sanitation, and
 *      Product Safety start at High).
 *   2. Safety categories detected anywhere in the message raise urgency.
 *   3. Severity terms (outage, fraud, injury...) raise it to at least High.
 *   4. Emergency terms (can't breathe, exploded, hospital...) make it Critical.
 */

import { getAllCategories } from './categories'
import { classifyByKeywords, computeUrgency, scoreMessage } from './classifier'

/**
 * @param {string} message
 * @param {string} [categoryName] - final category (e.g., chosen by the AI)
 * @returns {"Critical"|"High"|"Medium"|"Low"}
 */
export function calculateUrgency(message, categoryName) {
  if (!categoryName) return classifyByKeywords(message).urgency

  const categories = getAllCategories()
  const { ranked, criticalMatches, highMatches } = scoreMessage(message, categories)
  const primary = categories.find((c) => c.name === categoryName) || null
  const secondary = ranked.map((r) => r.category)
  return computeUrgency({ primary, secondary, criticalMatches, highMatches })
}
