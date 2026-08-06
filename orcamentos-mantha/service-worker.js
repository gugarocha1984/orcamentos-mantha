// ==========================================================================
// Service Worker — Orçamentos Mantha
// Responsável por receber Web Push e exibir notificações
// ==========================================================================

const CACHE = 'orcamentos-mantha-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Recebe uma notificação push do servidor
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Mantha Orçamentos', body: event.data ? event.data.text() : '' };
  }

  const titulo = data.title || 'Mantha Orçamentos';
  const opcoes = {
    body: data.body || 'Nova solicitação recebida.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/#orcamentista' },
    tag: 'nova-medicao',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

// Ao clicar na notificação, abre o app na tela do orçamentista
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/#orcamentista';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Se já tem uma janela aberta, foca nela e navega
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      // Senão, abre uma nova
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
