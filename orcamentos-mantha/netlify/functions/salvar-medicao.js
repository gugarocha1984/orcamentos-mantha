// POST /api/salvar-medicao — grava a medição do Arthur e dispara push

const { lerJSON, escreverJSON } = require('./_lib/github');
const { enviarParaTodos } = require('./_lib/push');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  if (!payload.cliente || !payload.data_visita || !Array.isArray(payload.pavimentos)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Payload incompleto' }) };
  }

  const medicao = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    criado_em: new Date().toISOString(),
    status: 'aguardando_precificacao',
    cliente: payload.cliente,
    contato: payload.contato || '',
    endereco: payload.endereco || '',
    data_visita: payload.data_visita,
    observacoes_gerais: payload.observacoes_gerais || '',
    medidor: payload.medidor || 'Arthur',
    pavimentos: payload.pavimentos
  };

  try {
    const { data: medicoes, sha } = await lerJSON('medicoes.json', []);
    medicoes.push(medicao);
    await escreverJSON('medicoes.json', medicoes, sha, `Nova medição: ${medicao.cliente}`);

    let pushInfo = null;
    try {
      pushInfo = await enviarParaTodos({
        title: 'Nova medição do Arthur',
        body: `${medicao.cliente} — aguardando precificação`,
        url: '/#precificar'
      });
    } catch (e) {
      console.warn('Falha ao disparar push:', e.message);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id: medicao.id, push: pushInfo })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
