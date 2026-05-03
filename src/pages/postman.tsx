import type { NextPage } from 'next'
import { useState, useEffect } from 'react'

type HeaderPair = { id: string; name: string; value: string }

const Postman: NextPage = () => {
    /**
     * Do NOT remove this comment block!
     * For each sub-page, the id naming must follow these 3 rules:
     * 1. Each element, even wrappers, must have a unique id;
     * 2. The id must start with the page name as prefix;
     * 3. The id must be kebab-case (lowercase with hyphens).
     * For this page, the prefix is: "postman-"
     */

    const [url, setUrl] = useState('/api/health')
    const [method, setMethod] = useState('GET')
    const [headers, setHeaders] = useState<HeaderPair[]>([{ id: 'h-1', name: 'Content-Type', value: 'application/json' }])
    const [body, setBody] = useState('')
    const [responseStatus, setResponseStatus] = useState<number | null>(null)
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
    const [responseBody, setResponseBody] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const addHeader = () => setHeaders(h => [...h, { id: `h-${Date.now()}`, name: '', value: '' }])
    const updateHeader = (id: string, key: 'name' | 'value', val: string) => setHeaders(h => h.map(x => x.id === id ? { ...x, [key]: val } : x))
    const removeHeader = (id: string) => setHeaders(h => h.filter(x => x.id !== id))

    const send = async () => {
        // require absolute URL
        if (!/^https?:\/\//i.test(url)) {
            setResponseBody('Error: URL must be absolute and start with http:// or https://')
            return
        }

        setLoading(true)
        setResponseStatus(null)
        setResponseHeaders({})
        setResponseBody('')
        try {
            const hdrs: Record<string, string> = {}
            for (const h of headers) if (h.name) hdrs[h.name] = h.value

            const opts: RequestInit = { method, headers: hdrs }
            if (method !== 'GET' && method !== 'HEAD') {
                const contentType = Object.keys(hdrs).find(k => k.toLowerCase() === 'content-type')
                if (contentType && hdrs[contentType].includes('application/json')) {
                    try { opts.body = body && JSON.stringify(JSON.parse(body)) } catch { opts.body = body }
                } else {
                    opts.body = body
                }
            }

            const res = await fetch(url, opts)
            setResponseStatus(res.status)
            const rh: Record<string, string> = {}
            res.headers.forEach((v, k) => rh[k] = v)
            setResponseHeaders(rh)
            const text = await res.text()
            try { setResponseBody(JSON.stringify(JSON.parse(text), null, 2)) } catch { setResponseBody(text) }
        } catch (err: any) {
            setResponseBody(String(err))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // On mount, if current url is not absolute, populate with BASE = window.location.origin + path
        if (typeof window !== 'undefined') {
            if (!/^https?:\/\//i.test(url)) {
                try {
                    const origin = window.location.origin
                    setUrl(origin + (url.startsWith('/') ? url : '/' + url))
                } catch {
                    // ignore
                }
            }
        }
    }, [])

    return (
        <main id="postman-main" style={{ fontFamily: 'system-ui, sans-serif' }}>
            <h1 id="postman-title">Postman-like UI</h1>

            <section id="postman-request" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 12 }}>
                <div id="postman-request-details" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select id="postman-method" value={method} onChange={e => setMethod(e.target.value)}>
                        <option id="postman-method-option-get">GET</option>
                        <option id="postman-method-option-post">POST</option>
                        <option id="postman-method-option-put">PUT</option>
                        <option id="postman-method-option-patch">PATCH</option>
                        <option id="postman-method-option-delete">DELETE</option>
                    </select>
                    <input id="postman-url" name="postman-url" style={{ flex: 1 }} value={url} onChange={e => setUrl(e.target.value)} />
                    <button id="postman-send" name="postman-send" onClick={send} disabled={loading}>
                        <span id="postman-send-label">{loading ? 'Sending...' : 'Send'}</span>
                    </button>
                </div>

                <div id="postman-headers" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'left' }}>
                        <strong id="postman-headers-title">Headers</strong>
                        <button id="postman-headers-add" name="postman-headers-add" onClick={addHeader}>Add</button>
                    </div>
                    {headers.map(h => (
                        <div key={h.id} id={`postman-header-${h.id}`} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <input id={`postman-header-name-${h.id}`} name={`postman-header-name-${h.id}`} placeholder="Name" value={h.name} onChange={e => updateHeader(h.id, 'name', e.target.value)} style={{ width: 160 }} />
                            <input id={`postman-header-value-${h.id}`} name={`postman-header-value-${h.id}`} placeholder="Value" value={h.value} onChange={e => updateHeader(h.id, 'value', e.target.value)} style={{ flex: 1 }} />
                            <button id={`postman-header-remove-${h.id}`} name={`postman-header-remove-${h.id}`} onClick={() => removeHeader(h.id)}>×</button>
                        </div>
                    ))}
                </div>

                <div id="postman-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong id="postman-body-title">Body</strong>
                        <small>{method === 'GET' || method === 'HEAD' ? 'Not used for GET/HEAD' : ''}</small>
                    </div>
                    <textarea id="postman-body-text" name="postman-body-text" value={body} onChange={e => setBody(e.target.value)} rows={12} style={{ width: '100%', marginTop: 6, boxSizing: 'border-box', minWidth: 0, fontFamily: 'monospace' }} />
                </div>

                <div id="postman-response" style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
                    <div style={{ marginBottom: 8 }}>
                        <strong id="postman-response-title">Response</strong>
                        <div id="postman-response-status">Status: {responseStatus ?? '-'}</div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                        <strong id="postman-response-headers-title">Headers</strong>
                        <pre id="postman-response-headers" style={{ maxHeight: 120, overflow: 'auto', background: '#f9f9f9', padding: 8 }}>{JSON.stringify(responseHeaders, null, 2)}</pre>
                    </div>

                    <div>
                        <strong id="postman-response-body-title">Body</strong>
                        <pre id="postman-response-body" style={{ maxHeight: 300, overflow: 'auto', background: '#111', color: '#fff', padding: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{responseBody}</pre>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Postman
