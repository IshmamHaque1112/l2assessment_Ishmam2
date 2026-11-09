import { useState } from 'react'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_EMERGENCY_CONTACTS,
  PRIORITY_ORDER,
  getCategoryLink,
  getCustomCategories,
  getKeywordAdditions,
  getLinkOverrides,
  getSettings,
  parseKeywordList,
  saveCustomCategories,
  saveKeywordAdditions,
  saveLinkOverrides,
  saveSettings,
  slugify,
} from '../utils/categories'
import { urgencyBadgeClass } from '../utils/ui'

const CONTACT_WHEN = {
  critical: 'Any critical message',
  medical: 'Critical health / allergy / poisoning',
  crisis: 'Self-harm language',
  product: 'Product safety hazards',
  food: 'Food-related illness or contamination',
  sanitation: 'Sanitation & hygiene reports',
}

const emptyCategory = { name: '', priority: 'Medium', keywords: '', action: '', replyLine: '', link: '', description: '' }

const inputClass =
  'w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-600 text-sm mb-4">{subtitle}</p>}
      {children}
    </div>
  )
}

function SettingsPage() {
  const [settings, setSettings] = useState(getSettings)
  const [customCategories, setCustomCategories] = useState(getCustomCategories)
  const [additions, setAdditions] = useState(getKeywordAdditions)
  const [linkOverrides, setLinkOverrides] = useState(getLinkOverrides)
  const [draft, setDraft] = useState(emptyCategory)
  const [editingId, setEditingId] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [additionDrafts, setAdditionDrafts] = useState({})
  const [notice, setNotice] = useState('')

  const flash = (text) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 2500)
  }

  /* ---------- business settings ---------- */
  const updateSettings = (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  const updateContact = (index, patch) => {
    const contacts = settings.emergencyContacts.map((c, i) => (i === index ? { ...c, ...patch } : c))
    updateSettings({ emergencyContacts: contacts })
  }

  /* ---------- custom categories ---------- */
  const saveDraft = () => {
    const name = draft.name.trim()
    if (!name) return flash('Please give the category a name.')
    const keywords = parseKeywordList(draft.keywords)
    if (!keywords.length) return flash('Please add at least one keyword.')

    const category = {
      id: editingId || `custom_${slugify(name)}_${Date.now().toString(36)}`,
      name,
      priority: draft.priority,
      description: draft.description.trim(),
      keywords,
      action: draft.action.trim() || 'Review the message and follow up with the customer.',
      replyLine: draft.replyLine.trim() || `Our team has received your message about ${name} and will follow up shortly.`,
      link: draft.link.trim(),
      linkSlug: slugify(name),
    }
    const next = editingId
      ? customCategories.map((c) => (c.id === editingId ? category : c))
      : [...customCategories, category]
    setCustomCategories(next)
    saveCustomCategories(next)
    setDraft(emptyCategory)
    setEditingId(null)
    flash(editingId ? 'Category updated.' : 'Category added.')
  }

  const editCategory = (c) => {
    setEditingId(c.id)
    setDraft({
      name: c.name,
      priority: c.priority,
      keywords: c.keywords.join(', '),
      action: c.action || '',
      replyLine: c.replyLine || '',
      link: c.link || '',
      description: c.description || '',
    })
    window.scrollTo({ top: document.getElementById('custom-form')?.offsetTop - 80 || 0, behavior: 'smooth' })
  }

  const deleteCategory = (id) => {
    if (!window.confirm('Delete this category?')) return
    const next = customCategories.filter((c) => c.id !== id)
    setCustomCategories(next)
    saveCustomCategories(next)
  }

  /* ---------- keywords for default categories ---------- */
  const addKeywords = (id) => {
    const words = parseKeywordList(additionDrafts[id])
    if (!words.length) return
    const next = { ...additions, [id]: [...new Set([...(additions[id] || []), ...words])] }
    setAdditions(next)
    saveKeywordAdditions(next)
    setAdditionDrafts({ ...additionDrafts, [id]: '' })
  }

  const removeKeyword = (id, word) => {
    const next = { ...additions, [id]: (additions[id] || []).filter((w) => w !== word) }
    setAdditions(next)
    saveKeywordAdditions(next)
  }

  const setLinkOverride = (id, value) => {
    const next = { ...linkOverrides, [id]: value }
    if (!value) delete next[id]
    setLinkOverrides(next)
    saveLinkOverrides(next)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Set up your business details, emergency contacts, and the categories and keywords used to sort messages.
            Changes save automatically in this browser.
          </p>
        </div>

        {notice && (
          <div className="fixed top-20 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">{notice}</div>
        )}

        {/* Business */}
        <Section title="Business Details" subtitle="Used in suggested replies and to build placeholder help links.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
              <input className={inputClass} value={settings.companyName} onChange={(e) => updateSettings({ companyName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Website (for help links)</label>
              <input className={inputClass} value={settings.websiteUrl} onChange={(e) => updateSettings({ websiteUrl: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">FAQ Link</label>
              <input className={inputClass} value={settings.faqLink} onChange={(e) => updateSettings({ faqLink: e.target.value })} />
            </div>
          </div>
        </Section>

        {/* Contacts */}
        <Section
          title="Emergency & Safety Contacts"
          subtitle="Shown on the results and in the reply when a message is critical or involves health, sanitation, or product safety. Defaults are US numbers; edit them for your region."
        >
          <div className="space-y-2">
            {settings.emergencyContacts.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input className={`${inputClass} col-span-4`} value={c.name} onChange={(e) => updateContact(i, { name: e.target.value })} placeholder="Name" />
                <input className={`${inputClass} col-span-4`} value={c.contact} onChange={(e) => updateContact(i, { contact: e.target.value })} placeholder="Phone / website" />
                <select className={`${inputClass} col-span-3`} value={c.when} onChange={(e) => updateContact(i, { when: e.target.value })}>
                  {Object.entries(CONTACT_WHEN).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
                <button
                  className="col-span-1 text-red-600 hover:text-red-800 text-sm"
                  onClick={() => updateSettings({ emergencyContacts: settings.emergencyContacts.filter((_, j) => j !== i) })}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold"
              onClick={() => updateSettings({ emergencyContacts: [...settings.emergencyContacts, { name: '', contact: '', when: 'critical' }] })}
            >
              + Add Contact
            </button>
            <button
              className="text-sm text-gray-600 hover:underline"
              onClick={() => updateSettings({ emergencyContacts: DEFAULT_EMERGENCY_CONTACTS })}
            >
              Reset to defaults
            </button>
          </div>
        </Section>

        {/* Custom categories */}
        <Section
          title="Custom Categories"
          subtitle="Create categories that fit your business (e.g., Reservations, Prescriptions, Vehicle Service) and give each its own keywords, priority, and help link."
        >
          {customCategories.length > 0 && (
            <div className="space-y-2 mb-6">
              {customCategories.map((c) => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{c.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${urgencyBadgeClass(c.priority)}`}>{c.priority}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {c.keywords.length} keywords: {c.keywords.slice(0, 12).join(', ')}{c.keywords.length > 12 ? ', …' : ''}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Link: {getCategoryLink(c, settings, linkOverrides)}</div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button className="text-blue-600 hover:underline" onClick={() => editCategory(c)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => deleteCategory(c.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div id="custom-form" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="font-semibold text-gray-800 mb-3">{editingId ? 'Edit Category' : 'New Category'}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                <input className={inputClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g., Reservations" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Minimum Priority</label>
                <select className={inputClass} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>
                  {PRIORITY_ORDER.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Keywords * <span className="font-normal text-gray-500">(comma or one per line; phrases allowed; plurals and -ed/-ing forms match automatically)</span>
                </label>
                <textarea className={`${inputClass} h-28`} value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} placeholder="reservation, book a table, party of, cancel my reservation, waitlist" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description <span className="font-normal text-gray-500">(helps the AI)</span></label>
                <input className={inputClass} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Booking, changing, or cancelling table reservations" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Recommended Action (internal)</label>
                <textarea className={`${inputClass} h-20`} value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} placeholder="Check the reservation system and confirm the booking." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reply Sentence (to customer)</label>
                <textarea className={`${inputClass} h-20`} value={draft.replyLine} onChange={(e) => setDraft({ ...draft, replyLine: e.target.value })} placeholder="We'd be happy to help with your reservation." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Help Link <span className="font-normal text-gray-500">(leave blank for a placeholder)</span></label>
                <input
                  className={inputClass}
                  value={draft.link}
                  onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                  placeholder={`${settings.websiteUrl.replace(/\/+$/, '')}/help/${slugify(draft.name || 'category-name')}`}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold" onClick={saveDraft}>
                {editingId ? 'Save Changes' : '+ Add Category'}
              </button>
              {editingId && (
                <button className="text-sm text-gray-600 hover:underline" onClick={() => { setEditingId(null); setDraft(emptyCategory) }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* Default categories */}
        <Section
          title="Default Categories"
          subtitle="Built-in categories with their keyword collections. Add your own keywords or set a real help link for any of them."
        >
          <div className="space-y-2">
            {DEFAULT_CATEGORIES.map((c) => {
              const added = additions[c.id] || []
              const open = expanded === c.id
              return (
                <div key={c.id} className="border border-gray-200 rounded-lg">
                  <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50" onClick={() => setExpanded(open ? null : c.id)}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{c.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${urgencyBadgeClass(c.priority)}`}>{c.priority}</span>
                      <span className="text-xs text-gray-500">
                        {c.keywords.length} built-in{added.length ? ` + ${added.length} yours` : ''} keywords
                      </span>
                    </div>
                    <span className="text-gray-400">{open ? '▲' : '▼'}</span>
                  </button>
                  {open && (
                    <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                      <p className="text-sm text-gray-700">{c.description}</p>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Your keywords</div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {added.length === 0 && <span className="text-xs text-gray-500">None yet</span>}
                          {added.map((w) => (
                            <span key={w} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                              {w}
                              <button className="text-blue-500 hover:text-red-600" onClick={() => removeKeyword(c.id, w)} aria-label={`Remove ${w}`}>×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            className={inputClass}
                            value={additionDrafts[c.id] || ''}
                            onChange={(e) => setAdditionDrafts({ ...additionDrafts, [c.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && addKeywords(c.id)}
                            placeholder="Add keywords, separated by commas"
                          />
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-semibold" onClick={() => addKeywords(c.id)}>
                            Add
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Help link</div>
                        <input
                          className={inputClass}
                          value={linkOverrides[c.id] || ''}
                          onChange={(e) => setLinkOverride(c.id, e.target.value)}
                          placeholder={getCategoryLink(c, settings, {})}
                        />
                      </div>
                      <details>
                        <summary className="text-xs font-semibold text-gray-600 cursor-pointer">Built-in keywords ({c.keywords.length})</summary>
                        <div className="text-xs text-gray-600 mt-2 leading-relaxed">{c.keywords.join(', ')}</div>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      </div>
    </div>
  )
}

export default SettingsPage
