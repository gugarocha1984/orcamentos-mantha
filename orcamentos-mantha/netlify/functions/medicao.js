// PATCH /api/medicao — atualiza campos de uma medição (status)

const { lerJSON, escreverJSON } = require('./_lib/github');

exports.handler = async (event) => {
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  if (!payload.id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'id ausente' }) };
  }

  try {
    const { data: medicoes, sha } = await lerJSON('medicoes.json', []);
    const idx = medicoes.findIndex(m => m.id === payload.id);
    if (idx === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Medição não encontrada' }) };
    }

    // Campos permitidos de alteração
    if (payload.status && ['pendente', 'orcado'].includes(payload.status)) {
      medicoes[idx].status = payload.status;
    }
    medicoes[idx].atualizado_em = new Date().toISOString();

    await escreverJSON('medicoes.json', medicoes, sha, `Atualizada: ${medicoes[idx].cliente}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, medicao: medicoes[idx] })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
