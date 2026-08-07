// ==========================================================================
// push.js — Web Push: registro do Service Worker e gerenciamento de subscription
// Versão robusta: valida a chave VAPID, mostra erros claros, sobrevive a espaços
// ==========================================================================

const Push = {
  vapidPublicKey: null,

  urlB64ToUint8Array(b64) {
    // Limpeza defensiva: remove espaços, aspas e quebras de linha
    b64 = String(b64 || '').trim().replace(/["'\s]/g, '');

    if (!b64) throw new Error('Chave VAPID vazia — verifique VAPID_PUBLIC_KEY no Netlify');

    // Valida caracteres permitidos (base64url)
    if (!/^[A-Za-z0-9_-]+$/.test(b64)) {
      throw new Error('Chave VAPID contém caracteres inválidos — precisa ser base64url puro');
    }

    // Comprimento típico de VAPID pública: 87 chars (65 bytes com base64url)
    if (b64.length < 80 || b64.length > 90) {
      throw new Error(`Chave VAPID com tamanho inesperado (${b64.length} caracteres) — deveria ter 87. Provavelmente foi cortada ou tem caractere a mais.`);
    }

    const padding = '='.repeat((4 - b64.length % 4) % 4);
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  },

  isSuportado() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  async registrarSW() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
      return reg;
    } catch (e) {
      console.warn('Falha ao registrar SW:', e);
      return null;
    }
  },

  async getSubscriptionAtual() {
    try {
      const reg = await navigator.serviceWorker.ready;
      return reg.pushManager.getSubscription();
    } catch (e) {
      console.warn('getSubscriptionAtual falhou:', e);
      return null;
    }
  },

  async carregarChavePublica() {
    if (this.vapidPublicKey) return this.vapidPublicKey;
    const r = await api('/vapid-public');
    if (!r || !r.publicKey) {
      throw new Error('Servidor não retornou chave pública. Verifique a variável VAPID_PUBLIC_KEY no Netlify.');
    }
    this.vapidPublicKey = String(r.publicKey).trim();
    return this.vapidPublicKey;
  },

  async ativar() {
    if (!this.isSuportado()) {
      toast('Este navegador não suporta notificações push.', 'danger');
      return false;
    }

    // Checa se as notificações estão bloqueadas no navegador
    if (Notification.permission === 'denied') {
      toast('Notificações estão bloqueadas. Libere no cadeado ao lado da URL e recarregue.', 'danger');
      return false;
    }

    // 1. Buscar a chave pública
    let publicKey;
    try {
      publicKey = await this.carregarChavePublica();
    } catch (e) {
      toast('Erro na configuração: ' + e.message, 'danger');
      console.error('[Push] Falha ao carregar chave:', e);
      return false;
    }

    // 2. Validar e converter a chave
    let applicationServerKey;
    try {
      applicationServerKey = this.urlB64ToUint8Array(publicKey);
    } catch (e) {
      toast('Chave VAPID inválida: ' + e.message, 'danger');
      console.error('[Push] Chave inválida:', publicKey, e);
      return false;
    }

    // 3. Pedir permissão do navegador
    let perm;
    try {
      perm = await Notification.requestPermission();
    } catch (e) {
      toast('Erro ao pedir permissão: ' + e.message, 'danger');
      return false;
    }

    if (perm !== 'granted') {
      toast('Permissão de notificação negada.', 'danger');
      return false;
    }

    // 4. Registrar SW se ainda não estiver
    let reg;
    try {
      reg = await navigator.serviceWorker.ready;
    } catch (e) {
      toast('Service Worker não está pronto. Recarregue a página e tente novamente.', 'danger');
      console.error('[Push] SW não pronto:', e);
      return false;
    }

    // 5. Criar subscription
    let sub;
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    } catch (e) {
      // Erros comuns do subscribe: chave inválida no servidor, service worker morto
      const msg = e.message || String(e);
      toast('Falha ao criar subscription: ' + msg, 'danger');
      console.error('[Push] subscribe() falhou:', e);
      return false;
    }

    // 6. Enviar ao backend
    try {
      await api('/registrar-push', {
        method: 'POST',
        body: { subscription: sub.toJSON() }
      });
      toast('Notificações ativadas!', 'success');
      return true;
    } catch (e) {
      toast('Erro ao registrar no servidor: ' + e.message, 'danger');
      // Cancela a subscription local pra não ficar orfã
      try { await sub.unsubscribe(); } catch(_) {}
      return false;
    }
  },

  async verificarBanner(container) {
    if (!this.isSuportado()) return;
    const perm = Notification.permission;
    const sub = await this.getSubscriptionAtual();

    if (perm === 'granted' && sub) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.className = 'push-banner';
    container.innerHTML = `
      <span>🔔 Ative as notificações para receber avisos de novas medições.</span>
      <button id="btnAtivarPush">Ativar</button>
    `;
    document.getElementById('btnAtivarPush').onclick = async () => {
      const btn = document.getElementById('btnAtivarPush');
      btn.disabled = true;
      btn.textContent = 'Ativando…';
      const ok = await this.ativar();
      if (ok) {
        container.style.display = 'none';
      } else {
        btn.disabled = false;
        btn.textContent = 'Ativar';
      }
    };
  }
};

// Registra o SW assim que o script carrega
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => Push.registrarSW());
}
