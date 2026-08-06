// ==========================================================================
// push.js — Web Push: registro do Service Worker e gerenciamento de subscription
// ==========================================================================

const Push = {
  vapidPublicKey: null,

  // Converte a chave pública VAPID (base64url) para Uint8Array
  urlB64ToUint8Array(b64) {
    const padding = '='.repeat((4 - b64.length % 4) % 4);
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  },

  // Verifica se o navegador suporta Web Push
  isSuportado() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Registra o Service Worker
  async registrarSW() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      return reg;
    } catch (e) {
      console.warn('Falha ao registrar SW:', e);
      return null;
    }
  },

  // Retorna a subscription atual (se já existe)
  async getSubscriptionAtual() {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  },

  // Solicita permissão e cria a subscription
  async ativar() {
    if (!this.isSuportado()) {
      toast('Este navegador não suporta notificações push.', 'danger');
      return false;
    }

    // Buscar chave pública VAPID
    if (!this.vapidPublicKey) {
      try {
        const r = await api('/vapid-public');
        this.vapidPublicKey = r.publicKey;
      } catch (e) {
        toast('Erro ao carregar configuração de push.', 'danger');
        return false;
      }
    }

    // Pedir permissão
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      toast('Permissão de notificação negada.', 'danger');
      return false;
    }

    // Criar subscription
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey)
    });

    // Enviar ao backend
    try {
      await api('/registrar-push', {
        method: 'POST',
        body: { subscription: sub.toJSON() }
      });
      toast('Notificações ativadas!', 'success');
      return true;
    } catch (e) {
      toast('Erro ao registrar no servidor: ' + e.message, 'danger');
      return false;
    }
  },

  // Verifica o estado e mostra o banner se precisar ativar
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
      const ok = await this.ativar();
      if (ok) container.style.display = 'none';
    };
  }
};

// Registra o SW assim que o script carrega
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => Push.registrarSW());
}
