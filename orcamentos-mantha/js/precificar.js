// ==========================================================================
// precificar.js — tela do Gustavo (definir R$/m² por sistema + condição)
// ==========================================================================

const Precificar = {
  medicoes: [],
  medicaoAtual: null,
  estado: {
    precos_por_sistema: {},   // { sistema_id: preco }
    condicao_pagamento: ''
  },

  async carregarLista() {
    const container = document.getElementById('precificarLista');
    container.innerHTML = '<div class="loading">Carregando…</div>';

    try {
      const r = await api('/listar-medicoes');
      this.medicoes = (r.medicoes || [])
        .filter(m => normalizarStatus(m.status) === 'aguardando_precificacao')
        .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    } catch (e) {
      container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar</h3><p>${escapeHtml(e.message)}</p></div>`;
      return;
    }

    if (!this.medicoes.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">💰</div>
          <h3>Nada para precificar</h3>
          <p>Quando o Arthur enviar uma medição, ela aparecerá aqui.</p>
        </div>`;
      return;
    }

    container.innerHTML = this.medicoes.map(m => {
      const totalM2 = calcMedicaoTotal(m);
      return `
        <div class="medicao-item" data-open="${m.id}">
          <div class="info">
            <h4>${escapeHtml(m.cliente)}</h4>
            <div class="meta">
              <span>📅 ${fmtData(m.data_visita)}</span>
              <span>📐 ${fmtM2(totalM2)} m²</span>
              <span>🏗️ ${m.pavimentos.length} pav.</span>
            </div>
          </div>
          ${badgeStatus(m.status)}
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-open]').forEach(el => {
      el.onclick = () => this.abrirParaPrecificar(el.dataset.open);
    });
  },

  abrirParaPrecificar(id) {
    const m = this.medicoes.find(x => x.id === id);
    if (!m) return;
    this.medicaoAtual = m;
    this.estado = {
      precos_por_sistema: {},
      condicao_pagamento: (m.precificacao && m.precificacao.condicao_pagamento) || ''
    };

    // Pré-preencher com preço padrão dos sistemas (ou valor já precificado)
    const sistemasUsados = agruparPorSistema(m);
    sistemasUsados.forEach(s => {
      // Ordem de prioridade: precificação existente > preço padrão do sistema
      const precoExistente = m.precificacao && m.precificacao.precos_por_sistema
        ? (m.precificacao.precos_por_sistema.find(p => p.sistema_id === s.sistema_id) || {}).preco_m2
        : null;
      const sistemaCache = Sistemas.cache.find(x => x.id === s.sistema_id);
      const precoPadrao = sistemaCache ? sistemaCache.preco_padrao_m2 : null;
      this.estado.precos_por_sistema[s.sistema_id] = precoExistente || precoPadrao || '';
    });

    this.renderForm();
  },

  renderForm() {
    const m = this.medicaoAtual;
    const sistemasUsados = agruparPorSistema(m);
    const totalM2 = calcMedicaoTotal(m);
    const container = document.getElementById('precificarConteudo');

    container.innerHTML = `
      <h1 class="screen-title">Precificar</h1>
      <p class="screen-subtitle">Defina o preço por metro quadrado de cada sistema usado nesta obra.</p>

      <div class="resumo-obra">
        <h2>${escapeHtml(m.cliente)}</h2>
        <div class="meta">
          ${m.endereco ? `<span>📍 ${escapeHtml(m.endereco)}</span>` : ''}
          <span>📅 ${fmtData(m.data_visita)}</span>
          <span>📐 ${fmtM2(totalM2)} m² totais</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Preço por sistema</div>

        ${sistemasUsados.map(s => {
          const preco = this.estado.precos_por_sistema[s.sistema_id] || '';
          const subtotal = (Number(preco) || 0) * s.m2_total;
          return `
            <div class="sistema-preco-card" data-sistema="${s.sistema_id}">
              <div class="head">
                <div class="nome">${escapeHtml(s.sistema_nome)}</div>
                <div class="metragem">${fmtM2(s.m2_total)} m²</div>
              </div>
              <div class="campos">
                <div class="field" style="margin:0">
                  <label>R$/m²</label>
                  <input type="number" step="0.01" min="0" class="preco-sistema"
                    placeholder="0,00" value="${preco}">
                </div>
                <div class="subtotal-linha" style="margin:0; padding:0; border:none; align-items:baseline;">
                  <span class="k">Subtotal</span>
                  <span class="val subtotal-val">${fmtBRL(subtotal)}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="total-precificacao">
        <span class="label">Valor total da obra</span>
        <span class="value" id="totalPrecificacao">${fmtBRL(this.calcularTotal())}</span>
      </div>

      <div class="card">
        <div class="card-title">Condição de pagamento</div>
        <div class="field" style="margin:0">
          <textarea id="condicaoPagamento" placeholder="Ex: 50% na entrada, 50% na conclusão. Ou: 3× no boleto, primeiro 30 dias após entrega...">${escapeHtml(this.estado.condicao_pagamento)}</textarea>
        </div>
      </div>

      <div class="action-bar">
        <button type="button" class="btn btn-secondary" id="btnCancelPrec">Cancelar</button>
        <button type="button" class="btn btn-primary" id="btnSalvarPrec">Enviar para orçamento</button>
      </div>
    `;

    this.bindForm();
  },

  bindForm() {
    // Atualiza preços ao vivo
    document.querySelectorAll('.preco-sistema').forEach(inp => {
      inp.addEventListener('input', debounce(() => {
        const card = inp.closest('[data-sistema]');
        const sistemaId = card.dataset.sistema;
        this.estado.precos_por_sistema[sistemaId] = inp.value;
        this.atualizarTotais();
      }, 200));
    });

    document.getElementById('condicaoPagamento').addEventListener('input', e => {
      this.estado.condicao_pagamento = e.target.value;
    });

    document.getElementById('btnCancelPrec').onclick = () => {
      if (confirm('Cancelar a precificação?')) {
        this.medicaoAtual = null;
        App.ir('home');
      }
    };

    document.getElementById('btnSalvarPrec').onclick = () => this.salvar();
  },

  atualizarTotais() {
    const sistemasUsados = agruparPorSistema(this.medicaoAtual);
    sistemasUsados.forEach(s => {
      const preco = Number(this.estado.precos_por_sistema[s.sistema_id]) || 0;
      const subtotal = preco * s.m2_total;
      const card = document.querySelector(`[data-sistema="${s.sistema_id}"]`);
      if (card) {
        const el = card.querySelector('.subtotal-val');
        if (el) el.textContent = fmtBRL(subtotal);
      }
    });
    const el = document.getElementById('totalPrecificacao');
    if (el) el.textContent = fmtBRL(this.calcularTotal());
  },

  calcularTotal() {
    const sistemasUsados = agruparPorSistema(this.medicaoAtual);
    return sistemasUsados.reduce((sum, s) => {
      const preco = Number(this.estado.precos_por_sistema[s.sistema_id]) || 0;
      return sum + preco * s.m2_total;
    }, 0);
  },

  async salvar() {
    const sistemasUsados = agruparPorSistema(this.medicaoAtual);
    const semPreco = sistemasUsados.filter(s => !Number(this.estado.precos_por_sistema[s.sistema_id]));
    if (semPreco.length) {
      toast(`Falta preço para: ${semPreco.map(s => s.sistema_nome).join(', ')}`, 'danger');
      return;
    }
    if (!this.estado.condicao_pagamento.trim()) {
      toast('Informe a condição de pagamento.', 'danger');
      return;
    }

    const btn = document.getElementById('btnSalvarPrec');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    const precos_por_sistema = sistemasUsados.map(s => ({
      sistema_id: s.sistema_id,
      sistema_nome: s.sistema_nome,
      m2_total: s.m2_total,
      preco_m2: Number(this.estado.precos_por_sistema[s.sistema_id]),
      subtotal: Number(this.estado.precos_por_sistema[s.sistema_id]) * s.m2_total
    }));

    const valor_total = precos_por_sistema.reduce((sum, p) => sum + p.subtotal, 0);

    try {
      await api('/precificar', {
        method: 'POST',
        body: {
          id: this.medicaoAtual.id,
          precificacao: {
            precos_por_sistema,
            condicao_pagamento: this.estado.condicao_pagamento.trim(),
            valor_total,
            precificado_em: new Date().toISOString(),
            precificado_por: 'Gustavo'
          }
        }
      });
      toast('Precificação enviada! Anne foi notificada.', 'success');
      this.medicaoAtual = null;
      setTimeout(() => App.ir('home'), 1200);
    } catch (e) {
      toast('Erro: ' + e.message, 'danger');
      btn.disabled = false;
      btn.textContent = 'Enviar para orçamento';
    }
  },

  async bindTela() {
    await Sistemas.carregar();
    this.medicaoAtual = null;

    // Reset do conteúdo para mostrar lista de novo
    document.getElementById('precificarConteudo').innerHTML = `
      <h1 class="screen-title">Precificar</h1>
      <p class="screen-subtitle">Medições aguardando definição de valores.</p>
      <div id="pushBannerPrecificar" style="display:none"></div>
      <div id="precificarLista"><div class="loading">Carregando…</div></div>
    `;

    await this.carregarLista();

    const banner = document.getElementById('pushBannerPrecificar');
    if (banner) await Push.verificarBanner(banner);
  }
};
