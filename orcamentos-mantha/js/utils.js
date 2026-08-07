// ==========================================================================
// utils.js — funções auxiliares compartilhadas
// ==========================================================================

const API = '/api';

async function api(path, options = {}) {
  const opts = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  if (opts.body && typeof opts.body !== 'string') {
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = (data && data.error) || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function toast(msg, tipo = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${tipo}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 3200);
}

function fmtM2(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtBRL(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function fmtData(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Calcula o total de m² de um ambiente
function calcAmbienteTotal(ambiente) {
  let piso = 0;
  if (Array.isArray(ambiente.pisos) && ambiente.pisos.length) {
    piso = ambiente.pisos.reduce(
      (sum, p) => sum + (Number(p.comprimento_m) || 0) * (Number(p.largura_m) || 0),
      0
    );
  } else if (ambiente.piso_m2) {
    piso = Number(ambiente.piso_m2) || 0;
  }

  const paredes = (ambiente.paredes || []).reduce(
    (sum, p) => sum + (Number(p.comprimento_m) || 0) * (Number(p.altura_m) || 0),
    0
  );
  const subtotal = piso + paredes;
  const sobreposicaoPct = Number(ambiente.sobreposicao_pct) || 0;
  const sobreposicaoM2 = subtotal * (sobreposicaoPct / 100);
  return {
    piso, paredes, subtotal, sobreposicaoM2,
    total: subtotal + sobreposicaoM2
  };
}

function calcMedicaoTotal(medicao) {
  let total = 0;
  (medicao.pavimentos || []).forEach(pav => {
    (pav.ambientes || []).forEach(amb => {
      total += calcAmbienteTotal(amb).total;
    });
  });
  return total;
}

// Agrupa m² por sistema para a tela de precificação
// Retorna: [{ sistema_id, sistema_nome, m2_total }]
function agruparPorSistema(medicao) {
  const mapa = new Map();
  (medicao.pavimentos || []).forEach(pav => {
    (pav.ambientes || []).forEach(amb => {
      const id = amb.sistema_id || 'sem-sistema';
      const nome = amb.sistema_nome || 'Sem sistema';
      const totaisAmb = calcAmbienteTotal(amb);
      if (!mapa.has(id)) {
        mapa.set(id, { sistema_id: id, sistema_nome: nome, m2_total: 0 });
      }
      mapa.get(id).m2_total += totaisAmb.total;
    });
  });
  return Array.from(mapa.values());
}

// Normaliza o status (compatibilidade com nomes antigos)
function normalizarStatus(s) {
  if (s === 'pendente') return 'aguardando_precificacao';
  return s || 'aguardando_precificacao';
}

// Retorna badge HTML para status
function badgeStatus(status) {
  const s = normalizarStatus(status);
  const mapa = {
    'aguardando_precificacao': ['badge-aguardando-precificacao', 'Aguardando precificação'],
    'aguardando_orcamento': ['badge-aguardando-orcamento', 'Aguardando orçamento'],
    'orcado': ['badge-orcado', 'Orçado']
  };
  const [cls, txt] = mapa[s] || mapa['aguardando_precificacao'];
  return `<span class="badge ${cls}">${txt}</span>`;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
