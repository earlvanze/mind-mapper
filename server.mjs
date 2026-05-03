import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const port = Number(process.env.PORT || 4173)
const host = process.env.HOST || '127.0.0.1'
const ollamaProvider = process.env.OLLAMA_PROVIDER || 'ollama-cyber'
const sageRouterUrl = (process.env.SAGE_ROUTER_OPENAI_BASE_URL || process.env.SAGE_ROUTER_BASE_URL || process.env.SAGE_ROUTER_URL || '').replace(/\/$/, '')
const sageRouterApiKey = process.env.SAGE_ROUTER_API_KEY || process.env.SAGE_API_KEY || ''
const sageRouterModel = process.env.SAGE_ROUTER_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct'

function ollamaProviderUrl(providerName) {
  try {
    const configPath = process.env.OPENCLAW_CONFIG || path.join(os.homedir(), '.openclaw', 'openclaw.json')
    const config = JSON.parse(awaitableReadFileSync(configPath))
    return config?.models?.providers?.[providerName]?.baseUrl
  } catch {
    return null
  }
}

function awaitableReadFileSync(filePath) {
  return readFileSync(filePath, 'utf8')
}

function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean).map(url => String(url).replace(/\/$/, '')))]
}

const ollamaUrls = uniqueUrls([
  process.env.OLLAMA_URL,
  ollamaProviderUrl(ollamaProvider),
  'http://127.0.0.1:11434',
])
const ollamaModel = process.env.OLLAMA_VISION_MODEL || 'qwen2.5vl:7b'
const maxBodyBytes = Number(process.env.MAX_RECOGNITION_BYTES || 8 * 1024 * 1024)

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon'],
])

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', chunk => {
      size += chunk.length
      if (size > maxBodyBytes) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

function imageBase64FromDataUrl(image) {
  if (typeof image !== 'string') return ''
  const match = image.match(/^data:image\/(?:png|jpeg|webp);base64,(.+)$/)
  return match ? match[1] : image
}

async function recognizeWithOllamaAt(recognitionOllamaUrl, { image, strokes }) {
  const base64 = imageBase64FromDataUrl(image)
  if (!base64) throw Object.assign(new Error('Missing drawing image'), { status: 400 })

  const prompt = [
    'You are an OCR engine for handwritten notes in a mind-mapping app.',
    'Read the handwriting in this drawing image.',
    'Return only the recognized text, no markdown, no explanation.',
    'If there is no readable handwriting, return an empty string.',
    strokes?.length ? `Stroke count: ${strokes.length}.` : '',
  ].filter(Boolean).join('\n')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OLLAMA_TIMEOUT_MS || 90000))
  try {
    const response = await fetch(`${recognitionOllamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        images: [base64],
        stream: false,
        options: { temperature: 0 },
      }),
      signal: controller.signal,
    })

    const raw = await response.text()
    let data = {}
    try { data = JSON.parse(raw) } catch { /* keep raw for diagnostics */ }
    if (!response.ok) {
      const message = data.error || raw || `Ollama returned HTTP ${response.status}`
      throw Object.assign(new Error(message), { status: 502 })
    }

    return String(data.response || '').trim()
  } catch (error) {
    if (error.name === 'AbortError') throw Object.assign(new Error('Ollama recognition timed out'), { status: 504 })
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function handleRecognition(req, res) {
  try {
    const body = await readRequestJson(req)
    let lastError = null
    for (const url of ollamaUrls) {
      try {
        const text = await recognizeWithOllamaAt(url, body)
        return sendJson(res, 200, { text, provider: 'ollama', model: ollamaModel, endpoint: url })
      } catch (error) {
        lastError = error
      }
    }
    throw lastError || new Error('No Ollama endpoints configured')
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.message || 'Recognition failed',
      provider: 'ollama',
      model: ollamaModel,
      endpoints: ollamaUrls,
    })
  }
}


function safeJsonFromText(text) {
  const raw = String(text || '').trim()
  try { return JSON.parse(raw) } catch { /* try fenced/object extraction */ }
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    try { return JSON.parse(fenced[1]) } catch { /* continue */ }
  }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1))
  throw new Error('Sage Router did not return JSON')
}

function localMindMapFallback(body) {
  const incoming = new Set((body.edges || []).map(edge => edge.to))
  const childIds = new Map((body.nodes || []).map(node => [node.id, []]))
  for (const edge of body.edges || []) if (childIds.has(edge.from)) childIds.get(edge.from).push(edge.to)
  const roots = (body.nodes || []).filter(node => !incoming.has(node.id))
  const visited = new Set()
  const output = []
  function status(text) {
    const normalized = String(text || '').toLowerCase()
    if (/\b(done|complete|completed|shipped|closed|resolved|finished)\b/.test(normalized)) return 'Done'
    if (/\b(blocked|risk|issue|bug|broken|fail|failed|failure|stuck|waiting|depends|timeout)\b/.test(normalized)) return 'Blocked / Risk'
    if (/\b(active|now|doing|progress|current|execution|building|implement|working)\b/.test(normalized)) return 'In Progress'
    return 'To Do'
  }
  function concept(text, fallback) {
    const normalized = String(text || '').toLowerCase()
    if (/openclaw|gateway|cloudflare|hostinger|deploy|server|api|infra/.test(normalized)) return 'infra'
    if (/property|real estate|guest|booking|rent|owner/.test(normalized)) return 'property'
    if (/finance|payment|ledger|stripe|token|valuation/.test(normalized)) return 'finance'
    if (/automation|cron|agent|workflow|skill|script/.test(normalized)) return 'automation'
    if (/kanban|trello|obsidian|ux|feature|product|app/.test(normalized)) return 'product'
    return fallback || 'general'
  }
  function visit(node, parentId = null, depth = 0) {
    if (!node || visited.has(node.id)) return
    visited.add(node.id)
    const text = `${node.title || ''} ${node.details || ''} ${(node.parents || []).join(' ')} ${(node.children || []).join(' ')}`
    output.push({ id: String(node.id), sourceId: node.id, title: node.title || 'Untitled node', details: node.details || '', parentId: parentId == null ? null : String(parentId), concept: concept(text, status(text).toLowerCase()), status: status(text), order: output.length, depth })
    for (const childId of childIds.get(node.id) || []) visit((body.nodes || []).find(candidate => candidate.id === childId), node.id, depth + 1)
  }
  for (const root of roots) visit(root)
  for (const node of body.nodes || []) if (!visited.has(node.id)) visit(node)
  return { title: `Organized: ${body.title || 'Mind Map'}`, nodes: output, provider: 'local heuristic' }
}

function sageChatCompletionsUrl() {
  if (!sageRouterUrl) return ''
  if (/\/chat\/completions$/.test(sageRouterUrl)) return sageRouterUrl
  if (/\/v\d+$/.test(sageRouterUrl) || sageRouterUrl.endsWith('/v1')) return `${sageRouterUrl}/chat/completions`
  return `${sageRouterUrl}/v1/chat/completions`
}

async function handleOrganizeMindMap(req, res) {
  try {
    const body = await readRequestJson(req)
    if (!sageRouterUrl || !sageRouterApiKey) return sendJson(res, 200, localMindMapFallback(body))

    const prompt = [
      'You are an intelligence layer for a visual mind-mapping app. Analyze the provided mind map and return concept/status annotations for automatic coloring.',
      'Do not rewrite the tree, do not invent nodes, and do not change parent-child structure. The client will preserve the existing layout and edges.',
      'Return strict JSON only with shape: {"title":"Organized: ...","nodes":[{"sourceId":123,"concept":"short-concept-key","status":"optional status","order":0}],"provider":"sage-router:<model>"}.',
      'Rules: sourceId must match an input node id; concept should be stable and useful for coloring branches; status is optional; do not return markdown; do not invent private facts.',
      `Mind map JSON:\n${JSON.stringify(body).slice(0, 20000)}`,
    ].join('\n\n')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), Number(process.env.SAGE_ROUTER_TIMEOUT_MS || 90000))
    try {
      const response = await fetch(sageChatCompletionsUrl(), {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${sageRouterApiKey}` },
        body: JSON.stringify({
          model: sageRouterModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      })
      const raw = await response.text()
      if (!response.ok) throw new Error(raw || `Sage Router returned HTTP ${response.status}`)
      const data = JSON.parse(raw)
      const content = data.choices?.[0]?.message?.content || raw
      const plan = safeJsonFromText(content)
      plan.provider = plan.provider || `sage-router:${sageRouterModel}`
      return sendJson(res, 200, plan)
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (error.name === 'AbortError') return sendJson(res, 504, { error: 'Sage Router organization timed out' })
    sendJson(res, error.status || 500, { error: error.message || 'Mind-map organization failed' })
  }
}


async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/') pathname = '/index.html'
  const resolved = path.normalize(path.join(distDir, pathname))
  const filePath = resolved.startsWith(distDir) && existsSync(resolved) ? resolved : path.join(distDir, 'index.html')
  try {
    const body = await readFile(filePath)
    res.writeHead(200, {
      'content-type': mimeTypes.get(path.extname(filePath)) || 'application/octet-stream',
      'cache-control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/recognize-handwriting') return handleRecognition(req, res)
  if (req.method === 'POST' && req.url === '/api/organize-mind-map') return handleOrganizeMindMap(req, res)
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res)
  res.writeHead(405)
  res.end('Method not allowed')
})

server.listen(port, host, () => {
  console.log(`Mind Mapp server listening on http://${host}:${port}`)
  console.log(`Handwriting provider: Ollama ${ollamaModel} via ${ollamaProvider}: ${ollamaUrls.join(', ')}`)
  console.log(`Mind-map organizer: ${sageRouterUrl && sageRouterApiKey ? `Sage Router OpenAI-compatible ${sageRouterModel} at ${sageChatCompletionsUrl()}` : 'local heuristic fallback'}`)
})
