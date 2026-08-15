// ==========================================================================
// orcamentista.js — tela da Anne (medições precificadas prontas para orçamento)
// ==========================================================================

const STATUS_COMERCIAL_OPCOES = [
  { valor: 'aguardando_resposta', label: '🟡 Aguardando resposta' },
  { valor: 'aprovado',            label: '✅ Aprovado' },
  { valor: 'recusado',            label: '❌ Recusado' }
];

const Orcamentista = {
  medicoes: [],

  async carregarLista() {
    const list = document.getElementById('medicoesList');
    list.innerHTML = '<div class="loading">Carregando…</div>';

    try {
      const r = await api('/listar-medicoes');
      this.medicoes = (r.medicoes || [])
        .filter(m => ['aguardando_orcamento', 'orcado'].includes(normalizarStatus(m.status)))
        .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    } catch (e) {
      list.innerHTML = `<div class="empty-state"><h3>Erro ao carregar</h3><p>${escapeHtml(e.message)}</p></div>`;
      return;
    }

    if (this.medicoes.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">📭</div>
          <h3>Nenhuma medição pronta</h3>
          <p>Assim que o Gustavo terminar de precificar uma medição, ela aparecerá aqui.</p>
        </div>`;
      return;
    }

    list.innerHTML = this.medicoes.map(m => {
      const totalM2 = calcMedicaoTotal(m);
      const valor = m.precificacao && m.precificacao.valor_total ? m.precificacao.valor_total : 0;
      const st = normalizarStatus(m.status);
      const isOrcado = st === 'orcado';
      const statusComercial = m.status_comercial || 'aguardando_resposta';

      // Se está orçado → mostra o select de status comercial
      // Senão → mostra o badge do status operacional
      const ladoDireito = isOrcado
        ? `<select class="status-comercial-select status-${statusComercial}" data-medicao="${m.id}" aria-label="Alterar status comercial">
             ${STATUS_COMERCIAL_OPCOES.map(o => `
               <option value="${o.valor}" ${o.valor === statusComercial ? 'selected' : ''}>${o.label}</option>
             `).join('')}
           </select>`
        : badgeStatus(m.status);

      return `
        <div class="medicao-item">
          <div class="info-clickable" data-open="${m.id}">
            <h4>${escapeHtml(m.cliente)}</h4>
            <div class="meta">
              <span>📅 ${fmtData(m.data_visita)}</span>
              <span>📐 ${fmtM2(totalM2)} m²</span>
              <span>💰 ${fmtBRL(valor)}</span>
            </div>
          </div>
          ${ladoDireito}
        </div>
      `;
    }).join('');

    // Handler: clique no card (área do lado esquerdo) abre o detalhe
    list.querySelectorAll('[data-open]').forEach(el => {
      el.onclick = () => this.abrirDetalhe(el.dataset.open);
    });

    // Handler: mudança no select de status comercial
    list.querySelectorAll('.status-comercial-select').forEach(sel => {
      // Impede que clicar no select abra o detalhe
      sel.addEventListener('click', e => e.stopPropagation());
      sel.addEventListener('mousedown', e => e.stopPropagation());

      sel.addEventListener('change', async () => {
        const id = sel.dataset.medicao;
        const novoStatus = sel.value;
        // Atualização visual otimista: aplica classe imediatamente
        sel.className = 'status-comercial-select status-' + novoStatus;
        sel.disabled = true;

        try {
          await api('/medicao', {
            method: 'PATCH',
            body: { id, status_comercial: novoStatus }
          });
          toast('Status atualizado.', 'success');
          // Atualiza cache local
          const m = this.medicoes.find(x => x.id === id);
          if (m) m.status_comercial = novoStatus;
        } catch (e) {
          toast('Erro: ' + e.message, 'danger');
          // Reverte visual em caso de erro
          const m = this.medicoes.find(x => x.id === id);
          const statusAntigo = (m && m.status_comercial) || 'aguardando_resposta';
          sel.value = statusAntigo;
          sel.className = 'status-comercial-select status-' + statusAntigo;
        } finally {
          sel.disabled = false;
        }
      });
    });
  },

  abrirDetalhe(id) {
    const m = this.medicoes.find(x => x.id === id);
    if (!m) return;
    this.renderDetalhe(m);
    App.ir('detalhe');
  },

  renderDetalhe(m) {
    const totalM2 = calcMedicaoTotal(m);
    const container = document.getElementById('detalheContent');
    const precificacao = m.precificacao || null;
    const isOrcado = normalizarStatus(m.status) === 'orcado';
    const statusComercial = m.status_comercial || 'aguardando_resposta';

    container.innerHTML = `
      <div class="resumo-obra">
        <h2>${escapeHtml(m.cliente)}</h2>
        <div class="meta">
          ${m.endereco ? `<span>📍 ${escapeHtml(m.endereco)}</span>` : ''}
          ${m.contato ? `<span>📞 ${escapeHtml(m.contato)}</span>` : ''}
          <span>📅 ${fmtData(m.data_visita)}</span>
          <span>👤 ${escapeHtml(m.medidor || 'Arthur')}</span>
        </div>
        ${m.observacoes_gerais ? `<div style="opacity:0.85;font-size:0.85rem;margin-top:0.5rem">📝 ${escapeHtml(m.observacoes_gerais)}</div>` : ''}
        <div class="total-geral">
          <span class="label">Total geral</span>
          <span class="value">${fmtM2(totalM2)} m²</span>
        </div>
      </div>

      ${precificacao ? `
        <div class="resumo-comercial">
          <h4>Precificação (Gustavo)</h4>
          ${(precificacao.precos_por_sistema || []).map(p => `
            <div class="linha">
              <span>${escapeHtml(p.sistema_nome)} — ${fmtM2(p.m2_total)} m² × ${fmtBRL(p.preco_m2)}</span>
              <span class="v">${fmtBRL(p.subtotal)}</span>
            </div>
          `).join('')}
          <div class="total-linha">
            <span>Valor total</span>
            <span class="v">${fmtBRL(precificacao.valor_total)}</span>
          </div>
          <div class="condicao">
            <div class="k">Condição de pagamento</div>
            <div>${escapeHtml(precificacao.condicao_pagamento)}</div>
          </div>
          ${isOrcado ? `
            <div class="condicao" style="margin-top:0.5rem">
              <div class="k">Status comercial</div>
              <div style="margin-top:0.35rem">
                ${(STATUS_COMERCIAL_OPCOES.find(o => o.valor === statusComercial) || {}).label || statusComercial}
              </div>
            </div>` : ''}
        </div>
      ` : ''}

      ${m.pavimentos.map(pav => `
        <div class="pavimento-view">
          <h3>${escapeHtml(pav.nome)}</h3>
          ${pav.ambientes.map((amb, iAmb) => {
            const t = calcAmbienteTotal(amb);
            return `
              <div class="ambiente-view">
                <div class="head">
                  <div class="desc">${iAmb + 1}. ${escapeHtml(amb.descricao)}</div>
                </div>
                <div class="sistema">${escapeHtml(amb.sistema_nome || '—')}</div>
                <div class="medidas">
                  <div><span class="k">Piso</span><span class="v">${fmtM2(t.piso)} m²</span></div>
                  <div><span class="k">Paredes</span><span class="v">${fmtM2(t.paredes)} m²</span></div>
                  <div><span class="k">Subtotal</span><span class="v">${fmtM2(t.subtotal)} m²</span></div>
                  <div><span class="k">Sobrep. ${amb.sobreposicao_pct || 0}%</span><span class="v">${fmtM2(t.sobreposicaoM2)} m²</span></div>
                </div>
                ${amb.paredes && amb.paredes.length ? `
                  <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem">
                    Paredes: ${amb.paredes.map(p => `${p.comprimento_m} × ${p.altura_m}m`).join(' + ')}
                  </div>` : ''}
                ${amb.observacoes ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.4rem;font-style:italic">📝 ${escapeHtml(amb.observacoes)}</div>` : ''}
                <div class="total">Total: <span class="value">${fmtM2(t.total)} m²</span></div>
              </div>
            `;
          }).join('')}
        </div>
      `).join('')}

      <div class="action-bar">
        <button class="btn btn-primary" data-editar>Editar</button>
        ${isOrcado
          ? '<button class="btn btn-secondary" data-marcar="aguardando_orcamento">Reabrir</button>'
          : '<button class="btn btn-secondary" data-marcar="orcado">Marcar orçado</button>'}
        <button class="btn btn-secondary" onclick="window.print()">Imprimir / PDF</button>
        <button class="btn btn-danger" data-excluir>Excluir</button>
      </div>
    `;

    const btnEditar = container.querySelector('[data-editar]');
    if (btnEditar) {
      btnEditar.onclick = () => {
        const st = normalizarStatus(m.status);
        if (st === 'orcado' || st === 'aguardando_orcamento') {
          if (!confirm('Editar essa medição vai voltar o status para "aguardando precificação" e o Gustavo precisará precificar de novo. Continuar?')) return;
        }
        Medidor.carregarParaEdicao(m);
        App.ir('medidor');
      };
    }

    const btnMarcar = container.querySelector('[data-marcar]');
    if (btnMarcar) {
      btnMarcar.onclick = async () => {
        const novoStatus = btnMarcar.dataset.marcar;
        btnMarcar.disabled = true;
        try {
          await api('/medicao', { method: 'PATCH', body: { id: m.id, status: novoStatus } });
          m.status = novoStatus;
          if (novoStatus === 'orcado' && !m.status_comercial) {
            m.status_comercial = 'aguardando_resposta';
          }
          toast('Status atualizado.', 'success');
          this.renderDetalhe(m);
        } catch (e) {
          toast('Erro: ' + e.message, 'danger');
          btnMarcar.disabled = false;
        }
      };
    }

    const btnExcluir = container.querySelector('[data-excluir]');
    if (btnExcluir) {
      btnExcluir.onclick = async () => {
        if (!confirm(`Excluir a medição de "${m.cliente}"?\n\nEsta ação não pode ser desfeita pelo app.`)) return;
        btnExcluir.disabled = true;
        try {
          await api('/medicao', { method: 'DELETE', body: { id: m.id } });
          toast('Medição excluída.', 'success');
          this.medicoes = this.medicoes.filter(x => x.id !== m.id);
          setTimeout(() => App.ir('orcamentista'), 700);
        } catch (e) {
          toast('Erro ao excluir: ' + e.message, 'danger');
          btnExcluir.disabled = false;
        }
      };
    }
  },

  async bindTela() {
    await this.carregarLista();
    const banner = document.getElementById('pushBanner');
    if (banner) await Push.verificarBanner(banner);
  }
};
