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
export function buildSuggestedReply({ categoryName, urgency, customerName, companyName, contacts = [], settings = getSettings() }) {
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

  lines.push('', 'Sincerely,', `The ${company} Support Team`)
  return lines.join('\n')
}
