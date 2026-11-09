/**
 * Business wiki: articles (policies, FAQs, procedures, product info) that the
 * reply agent draws on. Every business must have a wiki before messages can
 * be analyzed for it. Articles can be typed in or imported from files.
 *
 * Article shape: { id, title, content, keywords: string[], categoryIds: string[], url, source }
 */

import { findMatches, normalize, scoreMessage } from './classifier'
import { getAllCategories, newId, parseKeywordList } from './categories'

export const SUPPORTED_WIKI_FILES = '.md,.markdown,.txt,.text,.csv,.json,.html,.htm'
const MAX_ARTICLE_CHARS = 2000

const STOP_WORDS = new Set(
  ('a about after all also am an and any are as at be been before being but by can could did do does doing for from had has have having he her here his how i if in into is it its just me more most my no not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who why will with would you your yours hi hello thanks thank please').split(' ')
)

/** Very small stemmer so "refund", "refunds", and "refunded" compare equal. */
const stem = (w) => w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, (m) => (w.length - m.length >= 3 ? '' : m))

const significantWords = (text) =>
  [...new Set(normalize(text).trim().split(' ').filter((w) => w.length > 2 && !STOP_WORDS.has(w)).map(stem))]

/**
 * Categories an article is about, found by running its own text through the
 * keyword classifier. Lets typed and imported articles match messages without
 * being tagged by hand. Cached per article content.
 */
const autoCategoryCache = new Map()
function autoCategories(article, categories) {
  const key = `${article.id}|${article.title.length}|${article.content.length}|${categories.length}`
  if (!autoCategoryCache.has(key)) {
    const { ranked } = scoreMessage(`${article.title}\n${article.title}\n${article.content}`, categories)
    const top = ranked[0]?.score || 0
    autoCategoryCache.set(key, ranked.filter((r) => r.score >= Math.max(1.5, top * 0.5)).slice(0, 2).map((r) => r.category.id))
  }
  return autoCategoryCache.get(key)
}

/** True when a business has at least one wiki article with content. */
export const hasWiki = (business) => (business?.wiki || []).some((a) => (a.content || '').trim())

/**
 * Find the wiki articles most relevant to a message.
 * Points for being linked to the message's categories, for the article's own
 * keywords, for words shared with the title, and for words shared with the body.
 */
export function findRelevantArticles(message, business, categoryIds = [], limit = 3) {
  const text = normalize(message)
  const messageWords = significantWords(message)
  const categories = business ? getAllCategories(business.id) : []

  return (business?.wiki || [])
    .filter((a) => (a.content || '').trim())
    .map((article) => {
      let score = 0
      const reasons = []
      const linked = (article.categoryIds || []).filter((id) => categoryIds.includes(id))
      if (linked.length) {
        score += linked.includes(categoryIds[0]) ? 3 : 1.5
        reasons.push('linked category')
      } else if (categoryIds.length) {
        const auto = autoCategories(article, categories)
        if (auto.includes(categoryIds[0])) {
          score += 2
          reasons.push('same category')
        } else if (auto.some((id) => categoryIds.includes(id))) {
          score += 1
          reasons.push('related category')
        }
      }
      const kw = findMatches(text, article.keywords || [])
      if (kw.length) {
        score += kw.length * 2
        reasons.push(`keywords: ${kw.join(', ')}`)
      }
      const titleHits = significantWords(article.title).filter((w) => messageWords.includes(w))
      if (titleHits.length) {
        score += titleHits.length * 1.5
        reasons.push(`title: ${titleHits.join(', ')}`)
      }
      const bodyWords = new Set(significantWords(article.content))
      const bodyHits = messageWords.filter((w) => bodyWords.has(w) && !titleHits.includes(w))
      if (bodyHits.length) {
        score += Math.min(bodyHits.length * 0.35, 2.5)
        reasons.push(`content: ${bodyHits.slice(0, 6).join(', ')}`)
      }
      return { article, score: +score.toFixed(2), reasons }
    })
    .filter((r) => r.score >= 0.7)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/* ----------------------------------------------------------------------------
 * File import
 * ------------------------------------------------------------------------- */

const baseName = (fileName) => fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Imported article'

const makeArticle = ({ title, content, keywords = [], categoryIds = [], url = '' }, source) => ({
  id: newId('wiki'),
  title: String(title || '').trim() || 'Untitled',
  content: String(content || '').trim(),
  keywords: Array.isArray(keywords) ? keywords.map((k) => String(k).toLowerCase().trim()).filter(Boolean) : parseKeywordList(keywords),
  categoryIds: Array.isArray(categoryIds) ? categoryIds : parseKeywordList(categoryIds),
  url: String(url || '').trim(),
  source,
})

/** Split long text into parts on paragraph boundaries. */
function chunk(title, content) {
  if (content.length <= MAX_ARTICLE_CHARS) return [{ title, content }]
  const paragraphs = content.split(/\n\s*\n/)
  const parts = []
  let current = ''
  for (const p of paragraphs) {
    if (current && (current + '\n\n' + p).length > MAX_ARTICLE_CHARS) {
      parts.push(current)
      current = p
    } else {
      current = current ? `${current}\n\n${p}` : p
    }
  }
  if (current) parts.push(current)
  // a single huge paragraph: hard split
  const final = parts.flatMap((p) =>
    p.length > MAX_ARTICLE_CHARS * 1.5 ? p.match(new RegExp(`[\\s\\S]{1,${MAX_ARTICLE_CHARS}}`, 'g')) : [p]
  )
  return final.length === 1 ? [{ title, content: final[0] }] : final.map((c, i) => ({ title: `${title} (part ${i + 1})`, content: c }))
}

/** Markdown or plain text: each heading starts an article. */
function splitByHeadings(text, fallbackTitle) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const sections = []
  let title = null
  let buf = []
  const flush = () => {
    const content = buf.join('\n').trim()
    if (content) sections.push({ title: title || fallbackTitle, content })
    buf = []
  }
  for (const line of lines) {
    const md = line.match(/^\s{0,3}#{1,3}\s+(.+?)\s*#*\s*$/)
    if (md) {
      flush()
      title = md[1]
    } else {
      buf.push(line)
    }
  }
  flush()
  // a heading with nothing under it gives no article; if nothing found, the whole file is one article
  return sections.length ? sections : [{ title: fallbackTitle, content: text.trim() }]
}

/** Minimal CSV parser (handles quoted fields). */
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += ch
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim()))
}

function fromCSV(text) {
  const rows = parseCSV(text)
  if (!rows.length) return []
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (names) => header.findIndex((h) => names.includes(h))
  const t = col(['title', 'question', 'topic', 'name', 'heading'])
  const c = col(['content', 'answer', 'body', 'text', 'description'])
  const k = col(['keywords', 'tags', 'keyword'])
  const u = col(['url', 'link'])
  const cat = col(['categories', 'category', 'categoryids'])
  if (t === -1 || c === -1) throw new Error('CSV files need a header row with "title" (or "question") and "content" (or "answer") columns.')
  return rows.slice(1).map((r) => ({
    title: r[t], content: r[c], keywords: k >= 0 ? r[k] : [], url: u >= 0 ? r[u] : '', categoryIds: cat >= 0 ? r[cat] : [],
  }))
}

function fromJSON(text) {
  const data = JSON.parse(text)
  const list = Array.isArray(data) ? data : data.articles || data.wiki || data.faq || [data]
  return list.map((a) => ({
    title: a.title || a.question || a.name || a.topic,
    content: a.content || a.answer || a.body || a.text,
    keywords: a.keywords || a.tags || [],
    categoryIds: a.categoryIds || a.categories || [],
    url: a.url || a.link || '',
  }))
}

function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, nav, footer').forEach((el) => el.remove())
  // turn h1-h3 into markdown headings so sections split naturally
  doc.querySelectorAll('h1, h2, h3').forEach((h) => { h.textContent = `\n# ${h.textContent.trim()}\n` })
  doc.querySelectorAll('p, li, br, div, tr').forEach((el) => el.append('\n'))
  return (doc.body?.textContent || '').replace(/\n{3,}/g, '\n\n')
}

/**
 * Turn an uploaded file's text into wiki articles.
 * - .md / .txt: one article per heading (#, ##, ###); no headings -> one article
 * - .csv: header row with title/question and content/answer (optional keywords, url, categories)
 * - .json: array of { title, content, keywords, categoryIds, url } (or question/answer)
 * - .html: headings split into articles
 * Long sections are split into parts.
 */
export function parseWikiFile(fileName, text) {
  const ext = (fileName.split('.').pop() || '').toLowerCase()
  const fallback = baseName(fileName)
  let raw
  if (ext === 'csv') raw = fromCSV(text)
  else if (ext === 'json') raw = fromJSON(text)
  else if (ext === 'html' || ext === 'htm') raw = splitByHeadings(htmlToText(text), fallback)
  else if (['md', 'markdown', 'txt', 'text'].includes(ext)) raw = splitByHeadings(text, fallback)
  else throw new Error(`Unsupported file type ".${ext}". Use ${SUPPORTED_WIKI_FILES.replaceAll(',', ', ')}. For PDF or Word files, save them as .txt or .md first.`)

  const articles = raw
    .filter((a) => String(a.content || '').trim())
    .flatMap((a) =>
      chunk(String(a.title || fallback).trim() || fallback, String(a.content).trim()).map((part) =>
        makeArticle({ ...a, ...part }, fileName)
      )
    )
  if (!articles.length) throw new Error('No article content was found in that file.')
  return articles
}

export const newArticle = (fields) => makeArticle(fields, 'typed')
