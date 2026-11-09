# Sample wiki files

Upload these on the **Businesses** page (Wiki section) to try the feature:

- `fresh-foods-wiki.md`: Markdown. Each `#` heading becomes its own article.
- `fresh-foods-faq.csv`: CSV with `question,answer,keywords` columns. Each row becomes an article.

Supported formats: `.md`, `.markdown`, `.txt`, `.csv`, `.json`, `.html`. For PDF or Word documents, save them as `.txt` or `.md` first.

JSON format:
```json
[
  { "title": "Return policy", "content": "Returns are accepted within 30 days...", "keywords": ["return", "refund"], "url": "https://example.com/returns" }
]
```
