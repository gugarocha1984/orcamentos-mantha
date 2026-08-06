// ==========================================================================
// utils.js — funções auxiliares compartilhadas
// ==========================================================================

const API = '/api';

// Chamada à API com JSON automático
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

// Toast simples
function toast(msg, tipo = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${tipo}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 3200);
}

// Formatação de número em m²
function fmtM2(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Gera ID simples baseado em timestamp
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Debounce simples
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Formata data ISO para dd/mm/aaaa
function fmtData(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Data de hoje em ISO (YYYY-MM-DD)
function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Calcula o total de m² de um ambiente
// Suporta o formato novo (pisos como array) e o antigo (piso_m2 escalar)
function calcAmbienteTotal(ambiente) {
  let piso = 0;
  if (Array.isArray(ambiente.pisos) && ambiente.pisos.length) {
    piso = ambiente.pisos.reduce(
      (sum, p) => sum + (Number(p.comprimento_m) || 0) * (Number(p.largura_m) || 0),
      0
    );
  } else if (ambiente.piso_m2) {
    // fallback para medições antigas
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
    piso,
    paredes,
    subtotal,
    sobreposicaoM2,
    total: subtotal + sobreposicaoM2
  };
}

// Total geral de uma medição
function calcMedicaoTotal(medicao) {
  let total = 0;
  (medicao.pavimentos || []).forEach(pav => {
    (pav.ambientes || []).forEach(amb => {
      total += calcAmbienteTotal(amb).total;
    });
  });
  return total;
}
