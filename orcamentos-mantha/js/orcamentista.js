// ==========================================================================
// orcamentista.js — lista de medições e visualização detalhada
// ==========================================================================

const Orcamentista = {
  medicoes: [],

  async carregarLista() {
    const list = document.getElementById('medicoesList');
    list.innerHTML = '<div class="loading">Carregando…</div>';

    try {
      const r = await api('/listar-medicoes');
      this.medicoes = (r.medicoes || []).sort((a, b) =>
        new Date(b.criado_em) - new Date(a.criado_em)
      );
    } catch (e) {
      list.innerHTML = `<div class="empty-state"><h3>Erro ao carregar</h3><p>${escapeHtml(e.message)}</p></div>`;
      return;
    }

    if (this.medicoes.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">📭</div>
          <h3>Nenhuma medição ainda</h3>
          <p>Quando o Arthur enviar uma nova medição, ela aparecerá aqui.</p>
        </div>`;
      return;
    }

    list.innerHTML = this.medicoes.map(m => {
      const totalM2 = calcMedicaoTotal(m);
      const badge = m.status === 'orcado'
        ? '<span class="badge badge-orcado">Orçado</span>'
        : '<span class="badge badge-pendente">Pendente</span>';
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
          ${badge}
        </div>
      `;
    }).join('');

    list.querySelectorAll('[data-open]').forEach(el => {
      el.onclick = () => this.abrirDetalhe(el.dataset.open);
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

      ${m.pavimentos.map(pav => `
        <div class="pavimento-view">
          <h3>${escapeHtml(pav.nome)}</h3>
          ${pav.ambientes.map((amb, iAmb) => {
            const t = calcAmbienteTotal(amb);
            const temPisosDetalhados = Array.isArray(amb.pisos) && amb.pisos.length;
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
                ${temPisosDetalhados ? `
                  <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem">
                    Pisos: ${amb.pisos.map(p => `${p.comprimento_m} × ${p.largura_m}m`).join(' + ')}
                  </div>` : ''}
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

      <div class="action-bar" style="flex-wrap: wrap;">
        <button class="btn btn-primary" data-editar style="flex: 1 1 45%;">Editar</button>
        ${m.status === 'orcado'
          ? '<button class="btn btn-secondary" data-marcar="pendente" style="flex: 1 1 45%;">Marcar pendente</button>'
          : '<button class="btn btn-secondary" data-marcar="orcado" style="flex: 1 1 45%;">Marcar orçado</button>'}
        <button class="btn btn-secondary" onclick="window.print()" style="flex: 1 1 45%;">Imprimir / PDF</button>
        <button class="btn btn-danger" data-excluir style="flex: 1 1 45%;">Excluir</button>
      </div>
    `;

    // Handler: Editar
    const btnEditar = container.querySelector('[data-editar]');
    if (btnEditar) {
      btnEditar.onclick = () => {
        if (m.status === 'orcado') {
          if (!confirm('Esta medição já foi marcada como orçada. Ao salvar as alterações, o status volta para pendente e o orçamento precisará ser refeito. Continuar?')) return;
        }
        Medidor.carregarParaEdicao(m);
        App.ir('medidor');
      };
    }

    // Handler: Marcar status
    const btnMarcar = container.querySelector('[data-marcar]');
    if (btnMarcar) {
      btnMarcar.onclick = async () => {
        const novoStatus = btnMarcar.dataset.marcar;
        btnMarcar.disabled = true;
        try {
          await api('/medicao', {
            method: 'PATCH',
            body: { id: m.id, status: novoStatus }
          });
          m.status = novoStatus;
          toast('Status atualizado.', 'success');
          this.renderDetalhe(m);
        } catch (e) {
          toast('Erro: ' + e.message, 'danger');
          btnMarcar.disabled = false;
        }
      };
    }

    // Handler: Excluir
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
