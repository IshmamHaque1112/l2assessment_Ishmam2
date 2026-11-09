import { useState } from 'react'
import {
  DEFAULT_EMERGENCY_CONTACTS,
  PRIORITY_ORDER,
  addBusiness,
  deleteBusiness,
  duplicateBusiness,
  getActiveBusinessId,
  getBusinesses,
  getCategoryLink,
  getDefaultCategoriesFor,
  parseKeywordList,
  setActiveBusinessId,
  slugify,
  updateBusiness,
  updateDefaultOverride,
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

/** Editor for one default category within a business */
function DefaultCategoryEditor({ businessId, category, business, onChange }) {
  const [newWords, setNewWords] = useState('')
  const [filter, setFilter] = useState('')
  const removed = new Set(category.removedKeywords)
  const save = (patch) => onChange(updateDefaultOverride(businessId, category.id, patch))

  const addWords = () => {
    const words = parseKeywordList(newWords)
    if (!words.length) return
    // Re-adding a built-in keyword simply restores it
    const restore = words.filter((w) => removed.has(w))
    const extra = words.filter((w) => !category.builtInKeywords.includes(w))
    save({
      addedKeywords: [...new Set([...category.addedKeywords, ...extra])],
      removedKeywords: category.removedKeywords.filter((w) => !restore.includes(w)),
    })
    setNewWords('')
  }

  const toggleBuiltIn = (word) =>
    save({
      removedKeywords: removed.has(word)
        ? category.removedKeywords.filter((w) => w !== word)
        : [...category.removedKeywords, word],
    })

  const visibleBuiltIns = category.builtInKeywords.filter((w) => !filter || w.includes(filter.toLowerCase()))

  return (
    <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
      <p className="text-sm text-gray-700">{category.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input type="checkbox" checked={category.enabled} onChange={(e) => save({ enabled: e.target.checked ? undefined : false })} />
          Use this category
        </label>
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Minimum priority</div>
          <select className={inputClass} value={category.priority} onChange={(e) => save({ priority: e.target.value })}>
            {PRIORITY_ORDER.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Help link</div>
          <input
            className={inputClass}
            value={category.link}
            onChange={(e) => save({ link: e.target.value })}
            placeholder={getCategoryLink({ ...category, link: '' }, business)}
          />
        </div>
      </div>

      {/* Added keywords */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-1">Keywords added by {business.companyName}</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {category.addedKeywords.length === 0 && <span className="text-xs text-gray-500">None yet</span>}
          {category.addedKeywords.map((w) => (
            <span key={w} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
              {w}
              <button
                className="text-blue-500 hover:text-red-600"
                onClick={() => save({ addedKeywords: category.addedKeywords.filter((x) => x !== w) })}
                aria-label={`Remove ${w}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={newWords}
            onChange={(e) => setNewWords(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addWords()}
            placeholder="Add keywords or phrases, separated by commas"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-semibold" onClick={addWords}>
            Add
          </button>
        </div>
      </div>

      {/* Built-in keywords */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-semibold text-gray-600">
            Built-in keywords ({category.builtInKeywords.length - removed.size} of {category.builtInKeywords.length} on). Click one to turn it off or back on.
          </div>
          <input
            className="border border-gray-300 rounded px-2 py-1 text-xs w-40"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search keywords"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded p-2">
          {visibleBuiltIns.map((w) => (
            <button
              key={w}
              onClick={() => toggleBuiltIn(w)}
              title={removed.has(w) ? 'Turned off: click to turn back on' : 'Click to turn off'}
              className={`text-xs px-2 py-0.5 rounded ${
                removed.has(w) ? 'bg-gray-100 text-gray-400 line-through' : 'bg-gray-200 text-gray-800 hover:bg-red-100'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Recommended action (internal)</div>
          <textarea className={`${inputClass} h-20`} value={business.defaultOverrides[category.id]?.action || ''} onChange={(e) => save({ action: e.target.value })} placeholder={category.action} />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Reply sentence (to customer)</div>
          <textarea className={`${inputClass} h-20`} value={business.defaultOverrides[category.id]?.replyLine || ''} onChange={(e) => save({ replyLine: e.target.value })} placeholder={category.replyLine} />
        </div>
      </div>

      <button
        className="text-xs text-gray-600 hover:underline"
        onClick={() => {
          if (!window.confirm(`Reset ${category.name} to the built-in version for ${business.companyName}?`)) return
          onChange(updateBusiness(businessId, { defaultOverrides: { ...business.defaultOverrides, [category.id]: {} } }))
        }}
      >
        Reset this category to built-in
      </button>
    </div>
  )
}

function BusinessesPage() {
  const [businesses, setBusinesses] = useState(getBusinesses)
  const [activeId, setActiveId] = useState(getActiveBusinessId)
  const [newName, setNewName] = useState('')
  const [draft, setDraft] = useState(emptyCategory)
  const [editingId, setEditingId] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [notice, setNotice] = useState('')

  const business = businesses.find((b) => b.id === activeId) || businesses[0]
  const defaultCategories = getDefaultCategoriesFor(business.id)

  const refresh = () => setBusinesses(getBusinesses())
  const flash = (text) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 2500)
  }

  const select = (id) => {
    setActiveId(id)
    setActiveBusinessId(id)
    setExpanded(null)
    setEditingId(null)
    setDraft(emptyCategory)
  }

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return flash('Enter a business name.')
    const b = addBusiness(name)
    refresh()
    select(b.id)
    setNewName('')
    flash(`${name} added.`)
  }

  const handleDuplicate = () => {
    const b = duplicateBusiness(business.id)
    refresh()
    select(b.id)
    flash('Business duplicated.')
  }

  const handleDelete = () => {
    if (!window.confirm(`Delete ${business.companyName} and all of its categories and keywords?`)) return
    const list = deleteBusiness(business.id)
    setBusinesses(getBusinesses())
    select(list[0].id)
  }

  const update = (patch) => {
    updateBusiness(business.id, patch)
    refresh()
  }

  const updateContact = (index, patch) =>
    update({ emergencyContacts: business.emergencyContacts.map((c, i) => (i === index ? { ...c, ...patch } : c)) })

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
    const list = business.customCategories
    update({
      customCategories: editingId ? list.map((c) => (c.id === editingId ? category : c)) : [...list, category],
    })
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
    document.getElementById('custom-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const deleteCategory = (id) => {
    if (!window.confirm('Delete this category?')) return
    update({ customCategories: business.customCategories.filter((c) => c.id !== id) })
  }

  const enabledDefaults = defaultCategories.filter((c) => c.enabled).length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-600">
            Each business has its own details, emergency contacts, and categories: the default ones (which it can turn
            on or off and whose keywords it can change) plus its own custom ones. Changes save automatically in this browser.
          </p>
        </div>

        {notice && (
          <div className="fixed top-20 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">{notice}</div>
        )}

        {/* Business list */}
        <Section title="Your Businesses" subtitle="Pick a business to edit. The selected business is also used on the Analyze page.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => select(b.id)}
                className={`text-left border-2 rounded-lg p-3 transition ${
                  b.id === business.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{b.companyName || 'Untitled business'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {b.customCategories.length} custom categor{b.customCategories.length === 1 ? 'y' : 'ies'}
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="New business name, e.g., Fresh Foods Market"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-semibold whitespace-nowrap" onClick={handleAdd}>
              + Add Business
            </button>
          </div>
        </Section>

        {/* Business details */}
        <Section title={`${business.companyName || 'Business'}: Details`} subtitle="Used in suggested replies and to build placeholder help links.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
              <input className={inputClass} value={business.companyName} onChange={(e) => update({ companyName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Website (for help links)</label>
              <input className={inputClass} value={business.websiteUrl} onChange={(e) => update({ websiteUrl: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">FAQ Link</label>
              <input className={inputClass} value={business.faqLink} onChange={(e) => update({ faqLink: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <button className="text-blue-600 hover:underline" onClick={handleDuplicate}>Duplicate this business</button>
            <button className="text-red-600 hover:underline" onClick={handleDelete}>Delete this business</button>
          </div>
        </Section>

        {/* Default categories */}
        <Section
          title="Default Categories"
          subtitle={`${enabledDefaults} of ${defaultCategories.length} in use for ${business.companyName}. Turn categories on or off, change their priority, add keywords, or turn off built-in keywords that don't fit this business.`}
        >
          <div className="space-y-2">
            {defaultCategories.map((c) => {
              const open = expanded === c.id
              return (
                <div key={c.id} className={`border rounded-lg ${c.enabled ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-70'}`}>
                  <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50" onClick={() => setExpanded(open ? null : c.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{c.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${urgencyBadgeClass(c.priority)}`}>{c.priority}</span>
                      {!c.enabled && <span className="text-xs text-gray-500 font-semibold">Off</span>}
                      <span className="text-xs text-gray-500">
                        {c.keywords.length} keywords
                        {c.addedKeywords.length ? ` · ${c.addedKeywords.length} added` : ''}
                        {c.removedKeywords.length ? ` · ${c.removedKeywords.length} turned off` : ''}
                      </span>
                    </div>
                    <span className="text-gray-400">{open ? '▲' : '▼'}</span>
                  </button>
                  {open && (
                    <DefaultCategoryEditor
                      key={`${business.id}-${c.id}`}
                      businessId={business.id}
                      business={business}
                      category={c}
                      onChange={refresh}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </Section>

        {/* Custom categories */}
        <Section
          title="Custom Categories"
          subtitle={`Categories only ${business.companyName} uses (e.g., Reservations, Prescriptions, Vehicle Service).`}
        >
          {business.customCategories.length > 0 && (
            <div className="space-y-2 mb-6">
              {business.customCategories.map((c) => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{c.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${urgencyBadgeClass(c.priority)}`}>{c.priority}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {c.keywords.length} keywords: {c.keywords.slice(0, 12).join(', ')}{c.keywords.length > 12 ? ', …' : ''}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Link: {getCategoryLink(c, business)}</div>
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
                  placeholder={`${business.websiteUrl.replace(/\/+$/, '')}/help/${slugify(draft.name || 'category-name')}`}
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

        {/* Contacts */}
        <Section
          title="Emergency & Safety Contacts"
          subtitle="Shown on results and added to replies for critical messages and health, sanitation, or product-safety reports. Defaults are US numbers; edit them for this business's region."
        >
          <div className="space-y-2">
            {business.emergencyContacts.map((c, i) => (
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
                  onClick={() => update({ emergencyContacts: business.emergencyContacts.filter((_, j) => j !== i) })}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold"
              onClick={() => update({ emergencyContacts: [...business.emergencyContacts, { name: '', contact: '', when: 'critical' }] })}
            >
              + Add Contact
            </button>
            <button className="text-sm text-gray-600 hover:underline" onClick={() => update({ emergencyContacts: DEFAULT_EMERGENCY_CONTACTS })}>
              Reset to defaults
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}

export default BusinessesPage
