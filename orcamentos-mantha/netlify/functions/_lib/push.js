// ==========================================================================
// _lib/push.js — envio de notificações Web Push
// ==========================================================================

const webpush = require('web-push');
const { lerJSON, escreverJSON } = require('./github');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@manthaimper.com.br';

let configurado = false;
function configurar() {
  if (configurado) return;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    throw new Error('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas.');
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  configurado = true;
}

// Envia push a todas as subscriptions cadastradas
async function enviarParaTodos(payload) {
  configurar();
  const { data: subs, sha } = await lerJSON('subscriptions.json', []);
  if (!subs.length) return { enviados: 0, falhados: 0 };

  const body = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map(item => webpush.sendNotification(item.subscription, body))
  );

  // Detecta subscriptions inválidas (410 Gone / 404) e as remove
  const validos = [];
  let enviados = 0, falhados = 0;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      enviados++;
      validos.push(subs[i]);
    } else {
      const status = r.reason && r.reason.statusCode;
      falhados++;
      if (status !== 404 && status !== 410) {
        // Erro transitório — mantém subscription para tentar depois
        validos.push(subs[i]);
      }
    }
  });

  if (validos.length !== subs.length) {
    await escreverJSON('subscriptions.json', validos, sha, 'Remove subscriptions inválidas');
  }

  return { enviados, falhados };
}

module.exports = { enviarParaTodos };
