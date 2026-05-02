import React, { useEffect, useState } from 'react';

type ReqInfo = {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any | null;
};

type RespInfo = {
    status: number | null;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
    durationMs?: number | null;
    error?: string | null;
};

export default function HealthPage() {
    const [req, setReq] = useState<ReqInfo>({
        url: '/api/health',
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        body: null,
    });

    const [resp, setResp] = useState<RespInfo>({ status: null, durationMs: null, error: null });
    const [pingCount, setPingCount] = useState(0);
    const [loading, setLoading] = useState(false);

    async function ping() {
        setLoading(true);
        setResp({ status: null, durationMs: null, error: null });
        const { url, method, headers, body } = req;
        const init: RequestInit = { method, headers };
        if (body != null) init.body = JSON.stringify(body);

        const start = performance.now();
        try {
            const r = await fetch(url, init);
            const durationMs = Math.round(performance.now() - start);
            const text = await r.text();
            let parsed: any = null;
            try { parsed = text ? JSON.parse(text) : text; } catch (e) { parsed = text; }
            const headersObj: Record<string, string> = {};
            r.headers.forEach((v, k) => (headersObj[k] = v));
            setResp({ status: r.status, statusText: r.statusText, headers: headersObj, body: parsed, durationMs, error: null });
        } catch (err: any) {
            const durationMs = Math.round(performance.now() - start);
            setResp({ status: null, durationMs, error: err?.message || String(err) });
        } finally {
            setLoading(false);
            setPingCount(c => c + 1);
        }
    }

    // on mount, resolve the full absolute URL so the UI shows the entire URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setReq(r => ({ ...r, url: (window.location.origin || '') + r.url }));
        }
        ping();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Do NOT remove this comment block!
     * For each sub-page, the id naming must follow these 3 rules:
     * 1. Each element, even wrappers, must have a unique id;
     * 2. The id must start with the page name as prefix;
     * 3. The id must be kebab-case (lowercase with hyphens).
     * For this page, the prefix is: "health-"
     */
    return (
        
        <div id="health-root" style={{ padding: 20, fontFamily: 'Segoe UI, system-ui, -apple-system, Roboto, sans-serif' }}>
            <h1 id="health-title">Health Check (debug)</h1>

            <section id="health-request-section" style={{ marginBottom: 12 }}>
                <strong>Request</strong>
                <pre id="health-request-pre" style={{ background: '#f6f8fa', padding: 12 }}>{JSON.stringify(req, null, 2)}</pre>
            </section>

            <section id="health-response-section" style={{ marginBottom: 12 }}>
                <strong>Response</strong>
                <div id="health-response-wrapper" style={{ marginTop: 8 }}>
                    <div id="health-status-line">Status: {resp.status ?? '—'} {resp.statusText ? `(${resp.statusText})` : ''}</div>
                    <div id="health-duration-line">Duration: {resp.durationMs != null ? `${resp.durationMs} ms` : '—'}</div>
                    {resp.error && <div id="health-error-line" style={{ color: 'crimson' }}>Error: {resp.error}</div>}
                    <div id="health-response-inner" style={{ marginTop: 8 }}>
                        <details id="health-headers-details">
                            <summary>Headers</summary>
                            <pre id="health-headers-pre" style={{ background: '#f6f8fa', padding: 12 }}>{JSON.stringify(resp.headers ?? {}, null, 2)}</pre>
                        </details>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <details id="health-body-details" open>
                            <summary>Body</summary>
                            <pre id="health-body-pre" style={{ background: '#f6f8fa', padding: 12 }}>{JSON.stringify(resp.body ?? null, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            </section>

            <div id="health-controls" style={{ display: 'flex', gap: 8 }}>
                <button id="health-reping-button" onClick={() => ping()} disabled={loading}>
                    {loading ? 'Pinging…' : 'Re-ping'}
                </button>
                <div id="health-pings-counter" style={{ alignSelf: 'center', color: '#666' }}>Pings: {pingCount}</div>
            </div>
        </div>
    );
}
