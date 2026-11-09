/**
 * Recommended actions and the suggested customer reply.
 */

import {
  UNCATEGORIZED,
  getAllCategories,
  getBusiness,
  getCategoryLink,
  getSettings,
  priorityRank,
} from './categories'

const findCategory = (name) => getAllCategories().find((c) => c.name === name) || null

/**
 * Internal next step for the support team.
 */
export function getRecommendedAction(categoryName, urgency) {
  const category = findCategory(categoryName)
  let action = category
    ? category.action
    : 'Could not match a category. Review manually, reply with the FAQ link, and consider adding keywords or a custom category for messages like this.'

  if (urgency === 'Critical') {
    action = `CRITICAL: Respond immediately and share the emergency contacts below. ${action}`
  } else if (urgency === 'High') {
    action = `Prioritize: respond within the hour. ${action}`
  }
  return action
}

/**
 * Get all available category names
 */
export function getAvailableCategories() {
  return getAllCategories().map((c) => c.name)
}

/**
 * Escalate safety categories and anything High or Critical.
 */
export function shouldEscalate(categoryName, urgency) {
  const category = findCategory(categoryName)
  return Boolean(category?.safety) || priorityRank(urgency) >= priorityRank('High')
}

/**
 * Links included in the reply: the category's help page (if categorized) and the FAQ.
 */
export function getReplyLinks(categoryName, settings = getSettings()) {
  const category = categoryName && categoryName !== UNCATEGORIZED ? findCategory(categoryName) : null
  return {
    categoryLink: category ? getCategoryLink(category, getBusiness(settings.id)) : null,
    categoryLabel: category ? category.name : null,
    faqLink: settings.faqLink || `${(settings.websiteUrl || '').replace(/\/+$/, '')}/faq`,
  }
}

/**
 * Draft a reply to the customer from the company.
 */
export function buildSuggestedReply({ categoryName, urgency, customerName, companyName, contacts = [], articles = [], signature = '', settings = getSettings() }) {
  const company = (companyName || settings.companyName || 'our company').trim()
  const greetingName = (customerName || '').trim() || 'there'
  const category = categoryName && categoryName !== UNCATEGORIZED ? findCategory(categoryName) : null
  const { categoryLink, faqLink } = getReplyLinks(categoryName, settings)

  const lines = [`Hi ${greetingName},`, '', `Thank you for contacting ${company}.`]

  if (category) {
    lines.push(category.replyLine)
  } else {
    lines.push('A member of our team will review your message and get back to you shortly.')
  }

  if (urgency === 'Critical') {
    lines.push(
      '',
      'If you or anyone else is in immediate danger or experiencing severe symptoms, please call 911 (or your local emergency number) right away.'
    )
  }

  if (contacts.length) {
    lines.push('', urgency === 'Critical' ? 'Emergency and safety contacts:' : 'Helpful safety contacts:')
    contacts.forEach((c) => lines.push(`• ${c.name}: ${c.contact}`))
  }

  lines.push('')
  if (categoryLink) {
    lines.push(`More information about ${category.name.toLowerCase()}: ${categoryLink}`)
    lines.push(`Answers to common questions: ${faqLink}`)
  } else {
    lines.push(`In the meantime, you may find answers in our FAQ: ${faqLink}`)
  }

  const linkedArticles = articles.filter((a) => a.url)
  if (linkedArticles.length) {
    lines.push('', 'Related articles:')
    linkedArticles.forEach((a) => lines.push(`• ${a.title}: ${a.url}`))
  }

  lines.push('', 'Sincerely,', signature.trim() || `The ${company} Support Team`)
  return lines.join('\n')
}

/**
 * Make sure a reply (e.g., written by the AI) contains everything it must:
 * the company name, the category and FAQ links, and every emergency/safety
 * contact. Anything missing is added before the sign-off.
 * @returns {{ reply: string, added: string[] }}
 */
export function enforceReplyRequirements(reply, { companyName, urgency, contacts = [], categoryLink, faqLink, categoryName }) {
  let text = String(reply || '').trim()
  const added = []
  const additions = []
  const lower = text.toLowerCase()

  if (urgency === 'Critical' && !/911|emergency number|emergency services/i.test(text)) {
    additions.push('If you or anyone else is in immediate danger or experiencing severe symptoms, please call 911 (or your local emergency number) right away.')
    added.push('emergency instruction')
  }
  // A contact counts as included if any of its phone numbers or websites appear
  // (or, when it has none, its name).
  const missingContacts = contacts.filter((c) => {
    const tokens = String(c.contact || '').toLowerCase().match(/\d[\d-]{1,}\d|[a-z0-9-]+(?:\.[a-z0-9-]+)+\.?[a-z]*/g) || []
    const keys = tokens.length ? tokens : [String(c.name || '').toLowerCase()]
    return !keys.some((k) => k && lower.includes(k))
  })
  if (missingContacts.length) {
    additions.push([urgency === 'Critical' ? 'Emergency and safety contacts:' : 'Helpful safety contacts:', ...missingContacts.map((c) => `• ${c.name}: ${c.contact}`)].join('\n'))
    added.push('safety contacts')
  }
  if (categoryLink && !text.includes(categoryLink)) {
    additions.push(`More information about ${String(categoryName || 'this topic').toLowerCase()}: ${categoryLink}`)
    added.push('category link')
  }
  if (faqLink && !text.includes(faqLink)) {
    additions.push(`${categoryLink ? 'Answers to common questions' : 'You may find answers in our FAQ'}: ${faqLink}`)
    added.push('FAQ link')
  }

  if (additions.length) {
    // insert before the sign-off if one is found, otherwise append
    // The sign-off is the last paragraph when it starts with a short closing
    // line ending in a comma ("Warmly,", "Best regards,").
    const paras = text.split(/\n\s*\n/)
    const last = paras[paras.length - 1] || ''
    const firstLine = last.split('\n')[0].trim()
    const looksLikeSignOff = paras.length > 1 && firstLine.length <= 30 && /,$/.test(firstLine) && last.split('\n').length <= 4
    const signOff = looksLikeSignOff ? text.lastIndexOf(last) - 1 : -1
    const block = `\n\n${additions.join('\n\n')}\n`
    text = signOff >= 0 ? `${text.slice(0, signOff)}${block}${text.slice(signOff)}` : `${text}${block}`
  }
  text = text.replace(/\n{3,}/g, '\n\n')
  if (companyName && !text.includes(companyName)) {
    text = `${text.trimEnd()}\n\n— ${companyName}`
    added.push('company name')
  }
  return { reply: text.trim(), added }
}
