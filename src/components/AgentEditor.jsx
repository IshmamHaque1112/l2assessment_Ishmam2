import { TONE_OPTIONS, updateBusiness } from '../utils/categories'

const inputClass =
  'w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

const EXAMPLES = [
  'Always apologize first, then explain the next step in one sentence.',
  'For product defects, offer a free replacement or a full refund, whichever the customer prefers.',
  'For health or allergy reports, offer a full refund and say our quality manager will call within 24 hours.',
  'Never promise delivery dates; say the team will confirm the date by email.',
  'Keep replies under 120 words and avoid technical jargon.',
  'Invite the customer to reply directly to this email if they need anything else.',
]

/** How the reply agent writes for one business. */
function AgentEditor({ business, onChange }) {
  const agent = business.agent
  const save = (patch) => onChange(updateBusiness(business.id, { agent: { ...agent, ...patch } }))

  const addExample = (text) => {
    const current = agent.instructions.trim()
    if (current.includes(text)) return
    save({ instructions: current ? `${current}\n- ${text}` : `- ${text}` })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tone</label>
          <select className={inputClass} value={agent.tone} onChange={(e) => save({ tone: e.target.value })}>
            {[...new Set([agent.tone, ...TONE_OPTIONS])].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Sign-off</label>
          <input
            className={inputClass}
            value={agent.signature}
            onChange={(e) => save({ signature: e.target.value })}
            placeholder={`The ${business.companyName} Support Team`}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Instructions for the reply agent</label>
        <textarea
          className={`${inputClass} h-40 font-mono`}
          value={agent.instructions}
          onChange={(e) => save({ instructions: e.target.value })}
          placeholder={`Tell the agent how ${business.companyName} handles complaints, e.g.:\n- Offer a 15% discount code (SORRY15) for late deliveries.\n- Mention our 30-day no-questions-asked return policy.\n- Never discuss competitors.`}
        />
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Add an example instruction:</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => addExample(ex)} className="text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 px-2 py-1 rounded text-left">
                + {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={agent.useAiReplies} onChange={(e) => save({ useAiReplies: e.target.checked })} />
        Let the AI write replies using these instructions and the wiki (needs a Groq API key; otherwise the template reply is used)
      </label>

      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-3">
        Safety rules always apply on top of these instructions: emergency guidance and safety contacts, the category help link, the FAQ link,
        and the company name are checked and added to every reply if missing, and the agent is told to use only facts from the wiki.
      </div>
    </div>
  )
}

export default AgentEditor
