import { useRef, useState } from 'react'
import { getAllCategories, parseKeywordList, updateBusiness } from '../utils/categories'
import { SUPPORTED_WIKI_FILES, hasWiki, newArticle, parseWikiFile } from '../utils/wiki'

const inputClass =
  'w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

const emptyDraft = { title: '', content: '', keywords: '', url: '', categoryIds: [] }

/** Wiki for one business: upload files or type articles. */
function WikiEditor({ business, onChange }) {
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [status, setStatus] = useState(null) // { type: 'ok'|'error', text }
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const fileInput = useRef(null)

  const wiki = business.wiki || []
  const categories = getAllCategories(business.id)
  const sources = [...new Set(wiki.map((a) => a.source).filter((s) => s && s !== 'typed'))]

  const save = (nextWiki) => onChange(updateBusiness(business.id, { wiki: nextWiki }))

  const handleFiles = async (files) => {
    const imported = []
    const errors = []
    for (const file of files) {
      try {
        const text = await file.text()
        const articles = parseWikiFile(file.name, text)
        imported.push(...articles)
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`)
      }
    }
    if (imported.length) {
      // re-uploading a file replaces the articles previously imported from it
      const names = new Set(imported.map((a) => a.source))
      save([...wiki.filter((a) => !names.has(a.source)), ...imported])
    }
    setStatus(
      errors.length
        ? { type: 'error', text: `${imported.length ? `Imported ${imported.length} article(s). ` : ''}${errors.join(' ')}` }
        : { type: 'ok', text: `Imported ${imported.length} article${imported.length === 1 ? '' : 's'} from ${files.length} file${files.length === 1 ? '' : 's'}.` }
    )
    if (fileInput.current) fileInput.current.value = ''
  }

  const saveDraft = () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      setStatus({ type: 'error', text: 'An article needs a title and some content.' })
      return
    }
    const fields = { ...draft, keywords: parseKeywordList(draft.keywords) }
    if (editingId) {
      save(wiki.map((a) => (a.id === editingId ? { ...a, ...fields, title: fields.title.trim(), content: fields.content.trim() } : a)))
    } else {
      save([...wiki, newArticle(fields)])
    }
    setStatus({ type: 'ok', text: editingId ? 'Article updated.' : 'Article added.' })
    setDraft(emptyDraft)
    setEditingId(null)
    setShowForm(false)
  }

  const edit = (a) => {
    setEditingId(a.id)
    setDraft({ title: a.title, content: a.content, keywords: (a.keywords || []).join(', '), url: a.url || '', categoryIds: a.categoryIds || [] })
    setShowForm(true)
  }

  const remove = (id) => {
    if (!window.confirm('Delete this article?')) return
    save(wiki.filter((a) => a.id !== id))
  }

  const removeSource = (source) => {
    if (!window.confirm(`Delete all articles imported from ${source}?`)) return
    save(wiki.filter((a) => a.source !== source))
  }

  const toggleCategory = (id) =>
    setDraft({
      ...draft,
      categoryIds: draft.categoryIds.includes(id) ? draft.categoryIds.filter((c) => c !== id) : [...draft.categoryIds, id],
    })

  const q = search.trim().toLowerCase()
  const visible = q ? wiki.filter((a) => `${a.title} ${a.content}`.toLowerCase().includes(q)) : wiki

  return (
    <div>
      {!hasWiki(business) && (
        <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3 text-sm">
          <span className="font-semibold">Required:</span> add at least one article before analyzing messages for {business.companyName}.
        </div>
      )}

      {/* Upload or type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFiles([...e.dataTransfer.files])
          }}
        >
          <div className="font-semibold text-gray-800 mb-1">📄 Upload a file</div>
          <div className="text-xs text-gray-500 mb-3">
            Drag files here or choose them. Markdown/text headings become separate articles; CSV needs title and content columns. Uploading a file again replaces its articles.
            Supported: {SUPPORTED_WIKI_FILES.replaceAll(',', ' ')}
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={SUPPORTED_WIKI_FILES}
            onChange={(e) => handleFiles([...e.target.files])}
            className="text-sm"
            aria-label="Upload wiki files"
          />
        </div>
        <button
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400"
          onClick={() => {
            setEditingId(null)
            setDraft(emptyDraft)
            setShowForm(true)
          }}
        >
          <div className="font-semibold text-gray-800 mb-1">✏️ Type an article</div>
          <div className="text-xs text-gray-500">Write a policy, FAQ answer, or procedure directly.</div>
        </button>
      </div>

      {status && (
        <div className={`mb-4 text-sm rounded-lg p-3 ${status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {status.text}
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="font-semibold text-gray-800 mb-3">{editingId ? 'Edit Article' : 'New Article'}</div>
          <div className="space-y-3">
            <input className={inputClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title, e.g., Allergen policy" />
            <textarea
              className={`${inputClass} h-40`}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder="e.g., All bakery items are made in a facility that also processes peanuts and tree nuts. Customers who report an allergic reaction receive a full refund, and our quality team contacts them within 24 hours..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className={inputClass} value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} placeholder="Keywords (optional), e.g., allergy, peanut, label" />
              <input className={inputClass} value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="Public link to this article (optional)" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Use for these categories (optional)</div>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <label key={c.id} className={`text-xs px-2 py-1 rounded border cursor-pointer ${draft.categoryIds.includes(c.id) ? 'bg-blue-100 border-blue-400 text-blue-900' : 'bg-white border-gray-300 text-gray-700'}`}>
                    <input type="checkbox" className="mr-1" checked={draft.categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold" onClick={saveDraft}>
              {editingId ? 'Save Changes' : 'Add Article'}
            </button>
            <button className="text-sm text-gray-600 hover:underline" onClick={() => { setShowForm(false); setEditingId(null); setDraft(emptyDraft) }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Article list */}
      {wiki.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="text-sm text-gray-700 font-semibold">
              {wiki.length} article{wiki.length === 1 ? '' : 's'}
            </div>
            {wiki.length > 5 && (
              <input className="border border-gray-300 rounded px-2 py-1 text-sm w-56" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles" />
            )}
          </div>
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 text-xs">
              {sources.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-2">
                  📄 {s} ({wiki.filter((a) => a.source === s).length})
                  <button className="text-red-600 hover:underline" onClick={() => removeSource(s)}>remove</button>
                </span>
              ))}
            </div>
          )}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {visible.map((a) => (
              <div key={a.id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{a.title}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{a.content.slice(0, 200)}{a.content.length > 200 ? '…' : ''}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {a.source === 'typed' ? 'Typed' : `From ${a.source}`}
                    {a.keywords?.length ? ` · keywords: ${a.keywords.slice(0, 6).join(', ')}` : ''}
                    {a.categoryIds?.length ? ` · ${a.categoryIds.length} linked categor${a.categoryIds.length === 1 ? 'y' : 'ies'}` : ''}
                  </div>
                </div>
                <div className="flex gap-3 text-sm shrink-0">
                  <button className="text-blue-600 hover:underline" onClick={() => edit(a)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => remove(a.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default WikiEditor
