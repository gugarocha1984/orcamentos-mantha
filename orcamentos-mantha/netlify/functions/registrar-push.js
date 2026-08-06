// POST /api/registrar-push — salva subscription do orçamentista

const { lerJSON, escreverJSON } = require('./_lib/github');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  const sub = payload.subscription;
  if (!sub || !sub.endpoint) {
    return { statusCode: 400, body: JSON.stringify({ error: 'subscription ausente' }) };
  }

  try {
    const { data: subs, sha } = await lerJSON('subscriptions.json', []);

    // Se já existe uma subscription com o mesmo endpoint, ignora (idempotente)
    const jaTem = subs.find(s => s.subscription && s.subscription.endpoint === sub.endpoint);
    if (jaTem) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, existente: true }) };
    }

    subs.push({
      id: Date.now().toString(36),
      subscription: sub,
      criado_em: new Date().toISOString(),
      user_agent: (event.headers && event.headers['user-agent']) || ''
    });

    await escreverJSON('subscriptions.json', subs, sha, 'Nova subscription push');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
