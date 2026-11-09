import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { analyzeMessage, generateAiReply } from '../utils/llmHelper'
import { findRelevantArticles, hasWiki } from '../utils/wiki'
import { selectContacts } from '../utils/classifier'
import {
  getAllCategories,
  getActiveBusinessId,
  getBusiness,
  getBusinesses,
  getSettings,
  setActiveBusinessId,
  UNCATEGORIZED,
} from '../utils/categories'
import { getRecommendedAction, buildSuggestedReply, enforceReplyRequirements, getReplyLinks, shouldEscalate } from '../utils/templates'
import { urgencyBadgeClass } from '../utils/ui'

/** Render text with clickable URLs */
function Linkified({ text }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function AnalyzePage() {
  const [message, setMessage] = useState('')
  const [businesses] = useState(getBusinesses)
  const [businessId, setBusinessId] = useState(getActiveBusinessId)
  const [customerName, setCustomerName] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    // Check for example message from home page
    const exampleMessage = localStorage.getItem('exampleMessage')
    if (exampleMessage) {
      setMessage(exampleMessage)
      localStorage.removeItem('exampleMessage')
    }
  }, [])

  const business = businesses.find((b) => b.id === businessId) || businesses[0]
  const categoryCount = getAllCategories(business.id).length
  const wikiReady = hasWiki(business)
  const wikiCount = (business.wiki || []).length

  const handleBusinessChange = (id) => {
    setBusinessId(id)
    setActiveBusinessId(id)
    setResults(null)
  }

  const handleAnalyze = async () => {
    if (!wikiReady) {
      setError(`${business.companyName} needs a wiki before messages can be analyzed. Add articles on the Businesses page.`)
      return
    }
    if (message.trim().length < 2) {
      setError('Please enter a customer message to analyze.')
      return
    }
    setError('')
    setIsLoading(true)
    setResults(null)

    try {
      setActiveBusinessId(business.id)
      const settings = getSettings(business.id)
      const companyName = settings.companyName
      const analysis = await analyzeMessage(message)

      const nameToId = Object.fromEntries(getAllCategories(business.id).map((c) => [c.name, c.id]))
      const categoryIds = [analysis.category, ...analysis.secondaryCategories]
        .map((n) => nameToId[n])
        .filter(Boolean)

      const contacts = selectContacts({
        urgency: analysis.urgency,
        categoryIds,
        message,
        contacts: settings.emergencyContacts,
      })

      const { categoryLink, faqLink } = getReplyLinks(analysis.category, settings)
      const fullBusiness = getBusiness(business.id)
      const relevant = findRelevantArticles(message, fullBusiness, categoryIds)
      const articles = relevant.map((r) => r.article)

      const templateReply = buildSuggestedReply({
        categoryName: analysis.category,
        urgency: analysis.urgency,
        customerName,
        companyName,
        contacts,
        articles,
        signature: fullBusiness.agent.signature,
        settings,
      })
      const aiReply = await generateAiReply({
        message,
        business: fullBusiness,
        analysis,
        customerName,
        contacts,
        categoryLink,
        faqLink,
        articles,
      })
      const checked = aiReply
        ? enforceReplyRequirements(aiReply, { companyName, urgency: analysis.urgency, contacts, categoryLink, faqLink, categoryName: analysis.category })
        : null

      const analysisResult = {
        message,
        businessId: business.id,
        companyName,
        customerName,
        category: analysis.category,
        secondaryCategories: analysis.secondaryCategories,
        matchedKeywords: analysis.matchedKeywords,
        criticalMatches: analysis.criticalMatches,
        urgency: analysis.urgency,
        escalate: shouldEscalate(analysis.category, analysis.urgency),
        recommendedAction: getRecommendedAction(analysis.category, analysis.urgency),
        reasoning: analysis.reasoning,
        source: analysis.source,
        contacts,
        categoryLink,
        faqLink,
        suggestedReply: checked ? checked.reply : templateReply,
        replySource: checked ? 'ai' : 'template',
        replyChecksAdded: checked ? checked.added : [],
        wikiArticles: relevant.map((r) => ({ title: r.article.title, content: r.article.content, url: r.article.url, reasons: r.reasons })),
        timestamp: new Date().toISOString(),
      }

      setResults(analysisResult)

      // Save to history
      const history = JSON.parse(localStorage.getItem('triageHistory') || '[]')
      history.push(analysisResult)
      localStorage.setItem('triageHistory', JSON.stringify(history))
    } catch (err) {
      console.error('Error analyzing message:', err)
      setError('Error analyzing message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessage('')
    setCustomerName('')
    setResults(null)
    setError('')
  }

  const copy = (label, text) => {
    navigator.clipboard?.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const isCritical = results?.urgency === 'Critical'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analyze Customer Message</h1>
          <p className="text-gray-600 mb-6">
            Paste a customer message below to categorize it, set its priority, and draft a reply.
          </p>

          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Receiving the Message
              </label>
              <select
                value={business.id}
                onChange={(e) => handleBusinessChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.companyName || 'Untitled business'}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Uses {categoryCount} categories · {wikiCount} wiki article{wikiCount === 1 ? '' : 's'} ·{' '}
                <Link to="/businesses" className="text-blue-600 hover:underline">
                  Add or edit businesses
                </Link>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Jordan Smith"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {!wikiReady && (
            <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-4 text-sm">
              <div className="font-semibold mb-1">{business.companyName} doesn't have a wiki yet</div>
              Every business needs a wiki (policies, FAQs, procedures) so replies are based on its real information.{' '}
              <Link to="/businesses" className="text-blue-700 underline font-semibold">
                Type articles or upload a file
              </Link>{' '}
              to start analyzing messages for {business.companyName}.
            </div>
          )}

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste customer message here..."
              className="w-full border border-gray-300 rounded-lg p-3 h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{message.length} characters</span>
              <Link to="/businesses" className="text-blue-600 hover:underline">
                Manage {business.companyName}'s categories &amp; keywords →
              </Link>
            </div>
            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !wikiReady}
              className={`flex-1 py-3 rounded-lg font-semibold ${
                isLoading || !wikiReady ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Message'}
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Emergency / safety banner */}
            {results.contacts.length > 0 && (
              <div
                className={`rounded-lg p-5 border-2 ${
                  isCritical ? 'bg-red-50 border-red-600' : 'bg-amber-50 border-amber-400'
                }`}
              >
                <div className={`text-lg font-bold mb-1 ${isCritical ? 'text-red-800' : 'text-amber-900'}`}>
                  {isCritical ? '🚨 Possible emergency: share these contacts with the customer now' : '⚠️ Safety resources for this report'}
                </div>
                {isCritical && results.criticalMatches?.length > 0 && (
                  <div className="text-sm text-red-700 mb-3">
                    Flagged because the message mentions: {results.criticalMatches.map((k) => `"${k}"`).join(', ')}
                  </div>
                )}
                <ul className="space-y-1">
                  {results.contacts.map((c) => (
                    <li key={c.name} className="text-gray-900">
                      <span className="font-semibold">{c.name}:</span> {c.contact}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
                <span className="text-xs text-gray-500">
                  {results.source === 'ai' ? 'AI + keyword analysis' : 'Keyword analysis (no AI key detected)'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">Category</div>
                    <div
                      className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                        results.category === UNCATEGORIZED ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {results.category}
                    </div>
                    {results.secondaryCategories?.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        Also related: {results.secondaryCategories.join(', ')}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">Urgency Level</div>
                    <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${urgencyBadgeClass(results.urgency)}`}>
                      {results.urgency}
                    </div>
                    {results.escalate && <div className="mt-2 text-xs font-semibold text-red-700">Escalate</div>}
                  </div>
                </div>

                {results.matchedKeywords?.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">Matched Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {results.matchedKeywords.map((k) => (
                        <span key={k} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Recommended Action</div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-gray-800">{results.recommendedAction}</p>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Links</div>
                  <div className="text-sm space-y-1">
                    {results.categoryLink ? (
                      <div>
                        {results.category} help page: <Linkified text={results.categoryLink} />
                      </div>
                    ) : (
                      <div className="text-gray-600">No category matched, so the reply uses the FAQ link only.</div>
                    )}
                    <div>
                      FAQ: <Linkified text={results.faqLink} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Wiki Articles Used</div>
                  {results.wikiArticles?.length ? (
                    <div className="space-y-2">
                      {results.wikiArticles.map((a) => (
                        <details key={a.title} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <summary className="cursor-pointer text-sm font-semibold text-emerald-900">
                            {a.title} <span className="font-normal text-xs text-emerald-700">({a.reasons.join('; ')})</span>
                          </summary>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{a.content}</div>
                          {a.url && <div className="text-xs mt-2"><Linkified text={a.url} /></div>}
                        </details>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      No wiki article matched this message. Consider adding one for {results.companyName}.
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Reasoning</div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <ReactMarkdown>{results.reasoning}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested reply */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Suggested Reply</h2>
                  <div className="text-xs text-gray-500">
                    {results.replySource === 'ai'
                      ? `Written by AI using ${results.companyName}'s instructions and wiki`
                      : 'Template reply (AI unavailable or turned off for this business)'}
                    {results.replyChecksAdded?.length > 0 && ` · Safety check added: ${results.replyChecksAdded.join(', ')}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copy('reply', results.suggestedReply)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm"
                  >
                    {copied === 'reply' ? 'Copied!' : '📋 Copy Reply'}
                  </button>
                  <button
                    onClick={() =>
                      copy(
                        'results',
                        `Company: ${results.companyName}\nCustomer: ${results.customerName || '-'}\nCategory: ${results.category}\nUrgency: ${results.urgency}\nRecommendation: ${results.recommendedAction}\n\nReasoning: ${results.reasoning}\n\nSuggested reply:\n${results.suggestedReply}`
                      )
                    }
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-semibold text-sm"
                  >
                    {copied === 'results' ? 'Copied!' : 'Copy All Results'}
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 text-sm leading-relaxed">
                <Linkified text={results.suggestedReply} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyzePage
