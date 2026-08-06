// GET /api/listar-medicoes — retorna todas as medições

const { lerJSON } = require('./_lib/github');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }
  try {
    const { data: medicoes } = await lerJSON('medicoes.json', []);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicoes })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
