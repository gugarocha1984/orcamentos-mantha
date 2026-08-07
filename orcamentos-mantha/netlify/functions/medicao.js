// /api/medicao — PATCH (status ou medição completa) e DELETE

const { lerJSON, escreverJSON } = require('./_lib/github');
const { enviarParaTodos } = require('./_lib/push');

exports.handler = async (event) => {
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

    // DELETE
    if (event.httpMethod === 'DELETE') {
      const removida = medicoes.splice(idx, 1)[0];
      await escreverJSON('medicoes.json', medicoes, sha, `Excluída: ${removida.cliente}`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true })
      };
    }

    // PATCH
    if (event.httpMethod === 'PATCH' || event.httpMethod === 'POST') {

      // Edição completa da medição
      if (payload.medicao && typeof payload.medicao === 'object') {
        const antiga = medicoes[idx];
        const nova = {
          ...payload.medicao,
          id: antiga.id,
          criado_em: antiga.criado_em,
          status: 'aguardando_precificacao',   // qualquer edição volta o fluxo
          precificacao: null,                   // limpa a precificação anterior
          atualizado_em: new Date().toISOString()
        };
        medicoes[idx] = nova;
        await escreverJSON('medicoes.json', medicoes, sha, `Editada: ${nova.cliente}`);

        try {
          await enviarParaTodos({
            title: 'Medição editada pelo Arthur',
            body: `${nova.cliente} — precisa ser precificada novamente`,
            url: '/#precificar'
          });
        } catch (e) {
          console.warn('Push falhou:', e.message);
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, medicao: nova })
        };
      }

      // Só status
      if (payload.status && ['aguardando_precificacao', 'aguardando_orcamento', 'orcado', 'pendente'].includes(payload.status)) {
        // Compatibilidade: 'pendente' antigo vira 'aguardando_precificacao'
        const novoStatus = payload.status === 'pendente' ? 'aguardando_precificacao' : payload.status;
        medicoes[idx].status = novoStatus;
        medicoes[idx].atualizado_em = new Date().toISOString();
        await escreverJSON('medicoes.json', medicoes, sha, `Status: ${medicoes[idx].cliente}`);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, medicao: medicoes[idx] })
        };
      }

      return { statusCode: 400, body: JSON.stringify({ error: 'Payload inválido' }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
