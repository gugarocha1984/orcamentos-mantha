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

    if (tela === 'medidor') Medidor.bindTela();
    if (tela === 'precificar') Precificar.bindTela();
    if (tela === 'orcamentista') Orcamentista.bindTela();
    if (tela === 'sistemas') { Sistemas.bindTela(); Sistemas.renderizarTela(); }
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
