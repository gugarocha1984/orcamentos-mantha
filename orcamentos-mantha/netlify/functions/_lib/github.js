// ==========================================================================
// _lib/github.js — helper para ler e escrever JSONs em um repositório GitHub
// ==========================================================================

const fetch = require('node-fetch');

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO_DATA;
const BRANCH = process.env.GITHUB_BRANCH || 'main';

const API = 'https://api.github.com';

function headers() {
  if (!TOKEN) throw new Error('GITHUB_TOKEN não configurado.');
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'orcamentos-mantha',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

// Lê um arquivo JSON do repositório. Se não existir, retorna { data: fallback, sha: null }
async function lerJSON(caminho, fallback = []) {
  if (!OWNER || !REPO) throw new Error('GITHUB_OWNER/GITHUB_REPO_DATA não configurados.');
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(caminho)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) {
    return { data: fallback, sha: null };
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub GET ${res.status}: ${t}`);
  }
  const j = await res.json();
  const conteudo = Buffer.from(j.content, 'base64').toString('utf-8');
  let data;
  try { data = JSON.parse(conteudo); } catch { data = fallback; }
  return { data, sha: j.sha };
}

// Escreve/atualiza um arquivo JSON no repositório
async function escreverJSON(caminho, data, sha, mensagem = 'Atualização') {
  if (!OWNER || !REPO) throw new Error('GITHUB_OWNER/GITHUB_REPO_DATA não configurados.');
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(caminho)}`;
  const body = {
    message: mensagem,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
    branch: BRANCH
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub PUT ${res.status}: ${t}`);
  }
  return res.json();
}

module.exports = { lerJSON, escreverJSON };
