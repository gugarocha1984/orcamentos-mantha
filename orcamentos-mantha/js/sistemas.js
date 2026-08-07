// ==========================================================================
// sistemas.js — cadastro e listagem dos sistemas de impermeabilização
// ==========================================================================

const Sistemas = {
  cache: [],

  async carregar(force = false) {
    if (this.cache.length && !force) return this.cache;
    try {
      const r = await api('/sistemas');
      this.cache = r.sistemas || [];
    } catch (e) {
      this.cache = [];
      console.warn(e);
    }
    return this.cache;
  },

  async adicionar(nome, precoPadrao) {
    const r = await api('/sistemas', {
      method: 'POST',
      body: {
        nome,
        preco_padrao_m2: precoPadrao ? Number(precoPadrao) : null
      }
    });
    this.cache = r.sistemas || [];
    return this.cache;
  },

  async atualizarPreco(id, precoPadrao) {
    const r = await api('/sistemas', {
      method: 'PATCH',
      body: {
        id,
        preco_padrao_m2: precoPadrao ? Number(precoPadrao) : null
      }
    });
    this.cache = r.sistemas || [];
    return this.cache;
  },

  async remover(id) {
    const r = await api('/sistemas', {
      method: 'DELETE',
      body: { id }
    });
    this.cache = r.sistemas || [];
    return this.cache;
  },

  async renderizarTela() {
    const list = document.getElementById('sistemasList');
    list.innerHTML = '<div class="loading">Carregando…</div>';

    const sistemas = await this.carregar(true);

    if (!sistemas.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">📋</div>
          <h3>Nenhum sistema cadastrado</h3>
          <p>Adicione o primeiro sistema no formulário acima.</p>
        </div>`;
      return;
    }

    list.innerHTML = `
      <h3 class="card-title" style="margin-top:1.5rem">Sistemas cadastrados</h3>
      ${sistemas.map(s => `
        <div class="sistema-item">
          <div class="info">
            <div class="nome">${escapeHtml(s.nome)}</div>
            <div class="preco">${s.preco_padrao_m2 ? `Preço padrão: ${fmtBRL(s.preco_padrao_m2)}/m²` : 'Sem preço padrão'}</div>
          </div>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary btn-sm" data-edit-preco="${s.id}" data-nome="${escapeHtml(s.nome)}" data-preco="${s.preco_padrao_m2 || ''}">
              Preço
            </button>
            <button class="btn btn-danger btn-sm" data-remove="${s.id}">Excluir</button>
          </div>
        </div>
      `).join('')}
    `;

    list.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm(`Excluir esse sistema?`)) return;
        btn.disabled = true;
        try {
          await this.remover(btn.dataset.remove);
          toast('Sistema removido.', 'success');
          this.renderizarTela();
        } catch (e) {
          toast('Erro ao remover: ' + e.message, 'danger');
          btn.disabled = false;
        }
      };
    });

    list.querySelectorAll('[data-edit-preco]').forEach(btn => {
      btn.onclick = async () => {
        const nome = btn.dataset.nome;
        const atual = btn.dataset.preco || '';
        const novo = prompt(`Preço padrão de "${nome}" (R$/m²)\nDeixe em branco para remover:`, atual);
        if (novo === null) return;
        try {
          await this.atualizarPreco(btn.dataset.editPreco, novo);
          toast('Preço atualizado.', 'success');
          this.renderizarTela();
        } catch (e) {
          toast('Erro: ' + e.message, 'danger');
        }
      };
    });
  },

  bindTela() {
    document.getElementById('btnAddSistema').onclick = async () => {
      const inputNome = document.getElementById('novoSistema');
      const inputPreco = document.getElementById('novoPrecoPadrao');
      const nome = inputNome.value.trim();
      if (!nome) {
        toast('Digite o nome do sistema.', 'danger');
        return;
      }
      try {
        await this.adicionar(nome, inputPreco.value);
        inputNome.value = '';
        inputPreco.value = '';
        toast('Sistema adicionado.', 'success');
        this.renderizarTela();
      } catch (e) {
        toast('Erro: ' + e.message, 'danger');
      }
    };

    document.getElementById('novoSistema').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('novoPrecoPadrao').focus();
      }
    });

    document.getElementById('novoPrecoPadrao').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btnAddSistema').click();
      }
    });
  }
};
