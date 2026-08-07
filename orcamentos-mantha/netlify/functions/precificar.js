// POST /api/precificar — salva a precificação do Gustavo e dispara push para Anne

const { lerJSON, escreverJSON } = require('./_lib/github');
const { enviarParaTodos } = require('./_lib/push');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) }; }

  if (!payload.id || !payload.precificacao) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Payload incompleto' }) };
  }

  try {
    const { data: medicoes, sha } = await lerJSON('medicoes.json', []);
    const idx = medicoes.findIndex(m => m.id === payload.id);
    if (idx === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Medição não encontrada' }) };
    }

    medicoes[idx].precificacao = payload.precificacao;
    medicoes[idx].status = 'aguardando_orcamento';
    medicoes[idx].atualizado_em = new Date().toISOString();

    await escreverJSON('medicoes.json', medicoes, sha, `Precificada: ${medicoes[idx].cliente}`);

    let pushInfo = null;
    try {
      const valorFormatado = (payload.precificacao.valor_total || 0).toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL'
      });
      pushInfo = await enviarParaTodos({
        title: 'Medição precificada — pronta para orçamento',
        body: `${medicoes[idx].cliente} — ${valorFormatado}`,
        url: '/#orcamentista'
      });
    } catch (e) {
      console.warn('Push falhou:', e.message);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, medicao: medicoes[idx], push: pushInfo })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
