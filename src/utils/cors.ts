export type CorsConfig = {
    allowedMethods: string[]
    allowedHeadersByMethod: Record<string, string[]>
}

export const CORS_CONFIG: CorsConfig = {
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeadersByMethod: {
        GET: ['Accept', 'Accept-Encoding', 'Authorization'],
        POST: ['Content-Type', 'Authorization', 'Accept', 'Accept-Encoding'],
        PUT: ['Content-Type', 'Authorization', 'Accept', 'Accept-Encoding'],
        PATCH: ['Content-Type', 'Authorization', 'Accept', 'Accept-Encoding'],
        DELETE: ['Authorization', 'Accept', 'Accept-Encoding'],
        OPTIONS: ['Content-Type', 'Authorization', 'Accept', 'Accept-Encoding'],
        HEAD: ['Accept', 'Authorization']
    }
}

export function allowedMethodsHeader(): string {
    return CORS_CONFIG.allowedMethods.join(',')
}

export function allowedHeadersFor(method: string): string {
    const key = method.toUpperCase()
    const headers = CORS_CONFIG.allowedHeadersByMethod[key] || []
    return headers.join(',')
}

export default CORS_CONFIG

export function corsHeadersFor(method?: string, extraHeaders?: Record<string,string>) {
    const m = (method || 'GET').toUpperCase()
    const allowMethods = CORS_CONFIG.allowedMethods.join(',')
    const allowHeaders = allowedHeadersFor(m) || ''
    return Object.assign({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': allowMethods,
        'Access-Control-Allow-Headers': allowHeaders || 'Content-Type,Authorization'
    }, extraHeaders || {})
}
