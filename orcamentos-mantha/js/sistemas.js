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

  async adicionar(nome) {
    const r = await api('/sistemas', {
      method: 'POST',
      body: { nome }
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

    list.innerHTML = sistemas.map(s => `
      <div class="sistema-item">
        <span class="nome">${escapeHtml(s.nome)}</span>
        <button class="btn btn-danger btn-sm" data-remove="${s.id}">Excluir</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm(`Excluir "${btn.parentElement.querySelector('.nome').textContent}"?`)) return;
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
  },

  bindTela() {
    document.getElementById('btnAddSistema').onclick = async () => {
      const input = document.getElementById('novoSistema');
      const nome = input.value.trim();
      if (!nome) {
        toast('Digite o nome do sistema.', 'danger');
        return;
      }
      try {
        await this.adicionar(nome);
        input.value = '';
        toast('Sistema adicionado.', 'success');
        this.renderizarTela();
      } catch (e) {
        toast('Erro: ' + e.message, 'danger');
      }
    };

    document.getElementById('novoSistema').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btnAddSistema').click();
      }
    });
  }
};

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
