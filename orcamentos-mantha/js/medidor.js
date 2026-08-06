// ==========================================================================
// medidor.js — formulário de nova medição (Arthur)
// ==========================================================================

const Medidor = {
  estado: {
    pavimentos: []
  },

  reset() {
    this.estado = { pavimentos: [] };
    document.getElementById('formMedicao').reset();
    document.getElementById('dataVisita').value = hojeISO();
    document.getElementById('pavimentosList').innerHTML = '';
    // Já cria um pavimento inicial
    this.addPavimento();
  },

  addPavimento(nome = '') {
    const pav = {
      id: gerarId(),
      nome,
      ambientes: []
    };
    this.estado.pavimentos.push(pav);
    this.renderizar();
    // Adiciona um ambiente inicial para não deixar vazio
    this.addAmbiente(pav.id);
  },

  removerPavimento(id) {
    this.estado.pavimentos = this.estado.pavimentos.filter(p => p.id !== id);
    this.renderizar();
  },

  addAmbiente(pavId) {
    const pav = this.estado.pavimentos.find(p => p.id === pavId);
    if (!pav) return;
    pav.ambientes.push({
      id: gerarId(),
      descricao: '',
      sistema_id: '',
      piso_m2: '',
      paredes: [{ id: gerarId(), comprimento_m: '', altura_m: '' }],
      sobreposicao_pct: 0,
      observacoes: ''
    });
    this.renderizar();
  },

  removerAmbiente(pavId, ambId) {
    const pav = this.estado.pavimentos.find(p => p.id === pavId);
    if (!pav) return;
    pav.ambientes = pav.ambientes.filter(a => a.id !== ambId);
    this.renderizar();
  },

  addParede(pavId, ambId) {
    const amb = this.acharAmb(pavId, ambId);
    if (!amb) return;
    amb.paredes.push({ id: gerarId(), comprimento_m: '', altura_m: '' });
    this.renderizar();
  },

  removerParede(pavId, ambId, paredeId) {
    const amb = this.acharAmb(pavId, ambId);
    if (!amb) return;
    amb.paredes = amb.paredes.filter(p => p.id !== paredeId);
    if (amb.paredes.length === 0) {
      amb.paredes.push({ id: gerarId(), comprimento_m: '', altura_m: '' });
    }
    this.renderizar();
  },

  acharAmb(pavId, ambId) {
    const pav = this.estado.pavimentos.find(p => p.id === pavId);
    return pav ? pav.ambientes.find(a => a.id === ambId) : null;
  },

  coletarDoDOM() {
    // Lê os inputs do DOM e atualiza this.estado antes de re-renderizar ou salvar
    this.estado.pavimentos.forEach(pav => {
      const pavEl = document.querySelector(`[data-pav="${pav.id}"]`);
      if (!pavEl) return;
      const nomeEl = pavEl.querySelector('.pav-nome');
      if (nomeEl) pav.nome = nomeEl.value;

      pav.ambientes.forEach(amb => {
        const ambEl = pavEl.querySelector(`[data-amb="${amb.id}"]`);
        if (!ambEl) return;
        amb.descricao = ambEl.querySelector('.amb-descricao').value;
        amb.sistema_id = ambEl.querySelector('.amb-sistema').value;
        amb.piso_m2 = ambEl.querySelector('.amb-piso').value;
        amb.sobreposicao_pct = ambEl.querySelector('.amb-sobreposicao').value;
        amb.observacoes = ambEl.querySelector('.amb-obs').value;

        amb.paredes.forEach(pr => {
          const prEl = ambEl.querySelector(`[data-parede="${pr.id}"]`);
          if (!prEl) return;
          pr.comprimento_m = prEl.querySelector('.parede-comp').value;
          pr.altura_m = prEl.querySelector('.parede-alt').value;
        });
      });
    });
  },

  renderizar() {
    const container = document.getElementById('pavimentosList');
    const sistemas = Sistemas.cache;

    container.innerHTML = this.estado.pavimentos.map((pav, iPav) => `
      <div class="pavimento" data-pav="${pav.id}">
        <div class="pavimento-header">
          <input type="text" class="pav-nome"
            placeholder="Nome do pavimento (Ex: Térreo, Superior, Cobertura)"
            value="${escapeHtml(pav.nome)}">
          <button type="button" class="btn btn-danger btn-sm" data-rm-pav="${pav.id}">
            Remover pavimento
          </button>
        </div>

        ${pav.ambientes.map((amb, iAmb) => {
          const totais = calcAmbienteTotal(amb);
          return `
          <div class="ambiente" data-amb="${amb.id}">
            <div class="ambiente-header">
              <span class="ambiente-num">Ambiente ${iAmb + 1}</span>
              <button type="button" class="btn btn-ghost btn-sm" data-rm-amb="${pav.id}|${amb.id}">
                Remover
              </button>
            </div>

            <div class="field">
              <label>Descrição do ambiente</label>
              <input type="text" class="amb-descricao"
                placeholder="Ex: Piscina, Banheiro Master, Laje Cobertura"
                value="${escapeHtml(amb.descricao)}">
            </div>

            <div class="field">
              <label>Sistema de impermeabilização</label>
              <select class="amb-sistema">
                <option value="">— selecione —</option>
                ${sistemas.map(s => `
                  <option value="${s.id}" ${s.id === amb.sistema_id ? 'selected' : ''}>
                    ${escapeHtml(s.nome)}
                  </option>
                `).join('')}
              </select>
              ${sistemas.length === 0 ? '<div class="hint">Nenhum sistema cadastrado. Cadastre em "Sistemas" antes de enviar.</div>' : ''}
            </div>

            <div class="row two">
              <div class="field">
                <label>Piso (m²)</label>
                <input type="number" step="0.01" min="0" class="amb-piso"
                  placeholder="0,00" value="${amb.piso_m2}">
              </div>
              <div class="field">
                <label>Sobreposição (%)</label>
                <input type="number" step="0.01" min="0" class="amb-sobreposicao"
                  placeholder="0" value="${amb.sobreposicao_pct}">
              </div>
            </div>

            <div class="field">
              <label>Paredes</label>
              <div class="paredes-list">
                ${amb.paredes.map(pr => `
                  <div class="parede-row" data-parede="${pr.id}">
                    <input type="number" step="0.01" min="0" class="parede-comp"
                      placeholder="Comprimento (m)" value="${pr.comprimento_m}">
                    <input type="number" step="0.01" min="0" class="parede-alt"
                      placeholder="Altura (m)" value="${pr.altura_m}">
                    <button type="button" class="remove-parede"
                      data-rm-parede="${pav.id}|${amb.id}|${pr.id}" title="Remover parede">✕</button>
                  </div>
                `).join('')}
              </div>
              <button type="button" class="btn btn-ghost btn-sm mt-1"
                data-add-parede="${pav.id}|${amb.id}">+ Adicionar parede</button>
            </div>

            <div class="field">
              <label>Observações do ambiente</label>
              <textarea class="amb-obs" placeholder="Detalhes técnicos, cuidados, etc.">${escapeHtml(amb.observacoes)}</textarea>
            </div>

            <div class="ambiente-total">
              <span class="label">Total do ambiente</span>
              <span class="value">${fmtM2(totais.total)} m²</span>
            </div>
          </div>
        `;}).join('')}

        <button type="button" class="btn btn-secondary btn-block" data-add-amb="${pav.id}">
          + Adicionar ambiente
        </button>
      </div>
    `).join('');

    this.bindLinhas();
  },

  bindLinhas() {
    // Inputs: atualizam o estado on input (para não perder ao re-renderizar)
    document.querySelectorAll('[data-amb] input, [data-amb] select, [data-amb] textarea, .pav-nome').forEach(inp => {
      inp.addEventListener('input', debounce(() => {
        this.coletarDoDOM();
        // re-renderiza apenas para atualizar totais
        this.atualizarTotais();
      }, 250));
    });

    // Botões
    document.querySelectorAll('[data-rm-pav]').forEach(b => {
      b.onclick = () => {
        if (!confirm('Remover este pavimento e todos os seus ambientes?')) return;
        this.coletarDoDOM();
        this.removerPavimento(b.dataset.rmPav);
      };
    });

    document.querySelectorAll('[data-rm-amb]').forEach(b => {
      b.onclick = () => {
        const [pavId, ambId] = b.dataset.rmAmb.split('|');
        this.coletarDoDOM();
        this.removerAmbiente(pavId, ambId);
      };
    });

    document.querySelectorAll('[data-add-amb]').forEach(b => {
      b.onclick = () => {
        this.coletarDoDOM();
        this.addAmbiente(b.dataset.addAmb);
      };
    });

    document.querySelectorAll('[data-add-parede]').forEach(b => {
      b.onclick = () => {
        const [pavId, ambId] = b.dataset.addParede.split('|');
        this.coletarDoDOM();
        this.addParede(pavId, ambId);
      };
    });

    document.querySelectorAll('[data-rm-parede]').forEach(b => {
      b.onclick = () => {
        const [pavId, ambId, prId] = b.dataset.rmParede.split('|');
        this.coletarDoDOM();
        this.removerParede(pavId, ambId, prId);
      };
    });
  },

  atualizarTotais() {
    // Sem re-renderizar tudo, só atualiza as caixas de total
    this.estado.pavimentos.forEach(pav => {
      pav.ambientes.forEach(amb => {
        const totais = calcAmbienteTotal(amb);
        const el = document.querySelector(`[data-amb="${amb.id}"] .ambiente-total .value`);
        if (el) el.textContent = `${fmtM2(totais.total)} m²`;
      });
    });
  },

  validar() {
    const cliente = document.getElementById('cliente').value.trim();
    const dataVisita = document.getElementById('dataVisita').value;
    if (!cliente) { toast('Informe o cliente.', 'danger'); return false; }
    if (!dataVisita) { toast('Informe a data da visita.', 'danger'); return false; }

    if (this.estado.pavimentos.length === 0) {
      toast('Adicione pelo menos um pavimento.', 'danger');
      return false;
    }

    for (const pav of this.estado.pavimentos) {
      if (!pav.nome.trim()) {
        toast('Nomeie todos os pavimentos.', 'danger');
        return false;
      }
      if (pav.ambientes.length === 0) {
        toast(`Adicione ambientes ao pavimento "${pav.nome}".`, 'danger');
        return false;
      }
      for (const amb of pav.ambientes) {
        if (!amb.descricao.trim()) {
          toast('Descreva todos os ambientes.', 'danger');
          return false;
        }
        if (!amb.sistema_id) {
          toast(`Selecione o sistema para "${amb.descricao}".`, 'danger');
          return false;
        }
      }
    }
    return true;
  },

  async enviar() {
    this.coletarDoDOM();
    if (!this.validar()) return;

    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    const payload = {
      cliente: document.getElementById('cliente').value.trim(),
      contato: document.getElementById('contato').value.trim(),
      endereco: document.getElementById('endereco').value.trim(),
      data_visita: document.getElementById('dataVisita').value,
      observacoes_gerais: document.getElementById('obsGeral').value.trim(),
      medidor: 'Arthur',
      pavimentos: this.estado.pavimentos.map(pav => ({
        nome: pav.nome.trim(),
        ambientes: pav.ambientes.map(amb => ({
          descricao: amb.descricao.trim(),
          sistema_id: amb.sistema_id,
          sistema_nome: (Sistemas.cache.find(s => s.id === amb.sistema_id) || {}).nome || '',
          piso_m2: Number(amb.piso_m2) || 0,
          paredes: amb.paredes
            .filter(p => Number(p.comprimento_m) > 0 && Number(p.altura_m) > 0)
            .map(p => ({
              comprimento_m: Number(p.comprimento_m),
              altura_m: Number(p.altura_m)
            })),
          sobreposicao_pct: Number(amb.sobreposicao_pct) || 0,
          observacoes: amb.observacoes.trim()
        }))
      }))
    };

    try {
      await api('/salvar-medicao', { method: 'POST', body: payload });
      toast('Medição enviada! O orçamentista foi notificado.', 'success');
      this.reset();
      setTimeout(() => App.ir('home'), 1200);
    } catch (e) {
      toast('Erro ao enviar: ' + e.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar para orçamento';
    }
  },

  async bindTela() {
    await Sistemas.carregar();
    this.reset();

    document.getElementById('btnAddPavimento').onclick = () => {
      this.coletarDoDOM();
      this.addPavimento();
    };
    document.getElementById('btnCancelMedicao').onclick = () => {
      if (confirm('Descartar a medição atual?')) {
        this.reset();
        App.ir('home');
      }
    };
    document.getElementById('formMedicao').onsubmit = e => {
      e.preventDefault();
      this.enviar();
    };
  }
};
