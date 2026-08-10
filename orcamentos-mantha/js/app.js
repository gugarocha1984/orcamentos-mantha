// ==========================================================================
// app.js — roteamento entre telas e inicialização
// ==========================================================================

const App = {
  telaAtual: 'home',
  telas: ['home', 'medidor', 'precificar', 'orcamentista', 'detalhe', 'sistemas'],
  telaAnterior: 'home',

  ir(tela) {
    if (!this.telas.includes(tela)) tela = 'home';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + tela);
    if (el) el.classList.add('active');

    if (tela !== this.telaAtual) this.telaAnterior = this.telaAtual;
    this.telaAtual = tela;
    window.location.hash = tela === 'home' ? '' : tela;
    document.getElementById('btnBack').style.display = tela === 'home' ? 'none' : 'inline-block';
    document.getElementById('btnSistemas').style.display = tela === 'home' ? 'inline-block' : 'none';
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (tela === 'home') this.atualizarContadores();
    if (tela === 'medidor') Medidor.bindTela();
    if (tela === 'precificar') Precificar.bindTela();
    if (tela === 'orcamentista') Orcamentista.bindTela();
    if (tela === 'sistemas') { Sistemas.bindTela(); Sistemas.renderizarTela(); }
  },

  // Atualiza os badges de contagem nos cards da home
  async atualizarContadores() {
    try {
      const r = await api('/listar-medicoes');
      const medicoes = r.medicoes || [];

      const precificar = medicoes.filter(m =>
        normalizarStatus(m.status) === 'aguardando_precificacao'
      ).length;

      const orcamento = medicoes.filter(m =>
        normalizarStatus(m.status) === 'aguardando_orcamento'
      ).length;

      this.setBadge('badgePrecificar', precificar);
      this.setBadge('badgeOrcamentos', orcamento);
    } catch (e) {
      console.warn('Falha ao atualizar contadores da home:', e);
      // Em caso de erro, esconde os badges pra não mostrar número errado
      this.setBadge('badgePrecificar', 0);
      this.setBadge('badgeOrcamentos', 0);
    }
  },

  setBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    if (count > 0) {
      el.textContent = count > 99 ? '99+' : String(count);
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  },

  init() {
    document.querySelectorAll('[data-goto]').forEach(el => {
      el.onclick = () => this.ir(el.dataset.goto);
    });

    document.getElementById('btnBack').onclick = () => {
      if (this.telaAtual === 'detalhe') this.ir('orcamentista');
      else this.ir('home');
    };

    document.getElementById('btnSistemas').onclick = () => this.ir('sistemas');

    window.addEventListener('hashchange', () => {
      const t = window.location.hash.replace('#', '') || 'home';
      if (t !== this.telaAtual) this.ir(t);
    });

    const inicial = window.location.hash.replace('#', '') || 'home';
    this.ir(inicial);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
