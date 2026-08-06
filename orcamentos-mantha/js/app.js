// ==========================================================================
// app.js — roteamento entre telas e inicialização
// ==========================================================================

const App = {
  telaAtual: 'home',

  telas: ['home', 'medidor', 'orcamentista', 'detalhe', 'sistemas'],

  ir(tela) {
    if (!this.telas.includes(tela)) tela = 'home';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + tela);
    if (el) el.classList.add('active');
    this.telaAtual = tela;
    window.location.hash = tela === 'home' ? '' : tela;
    document.getElementById('btnBack').style.display = tela === 'home' ? 'none' : 'inline-block';
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Callbacks por tela
    if (tela === 'medidor') Medidor.bindTela();
    if (tela === 'orcamentista') Orcamentista.bindTela();
    if (tela === 'sistemas') { Sistemas.bindTela(); Sistemas.renderizarTela(); }
  },

  init() {
    // Botões de navegação
    document.querySelectorAll('[data-goto]').forEach(el => {
      el.onclick = () => this.ir(el.dataset.goto);
    });

    document.getElementById('btnBack').onclick = () => {
      if (this.telaAtual === 'detalhe') this.ir('orcamentista');
      else this.ir('home');
    };

    // Navegação por hash
    window.addEventListener('hashchange', () => {
      const t = window.location.hash.replace('#', '') || 'home';
      if (t !== this.telaAtual) this.ir(t);
    });

    // Tela inicial (respeita hash existente)
    const inicial = window.location.hash.replace('#', '') || 'home';
    this.ir(inicial);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
