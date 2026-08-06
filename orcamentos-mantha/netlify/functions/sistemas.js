// /api/sistemas — GET lista, POST adiciona, DELETE remove

const { lerJSON, escreverJSON } = require('./_lib/github');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { data: sistemas } = await lerJSON('sistemas.json', []);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sistemas })
      };
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const nome = String(payload.nome || '').trim();
      if (!nome) return { statusCode: 400, body: JSON.stringify({ error: 'nome ausente' }) };

      const { data: sistemas, sha } = await lerJSON('sistemas.json', []);
      // Evita duplicidade (case-insensitive)
      if (sistemas.find(s => s.nome.toLowerCase() === nome.toLowerCase())) {
        return { statusCode: 409, body: JSON.stringify({ error: 'Sistema já existe.' }) };
      }
      sistemas.push({
        id: Date.now().toString(36),
        nome,
        criado_em: new Date().toISOString()
      });
      await escreverJSON('sistemas.json', sistemas, sha, `Sistema adicionado: ${nome}`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sistemas })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const payload = JSON.parse(event.body || '{}');
      const id = String(payload.id || '');
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id ausente' }) };

      const { data: sistemas, sha } = await lerJSON('sistemas.json', []);
      const novo = sistemas.filter(s => s.id !== id);
      await escreverJSON('sistemas.json', novo, sha, `Sistema removido`);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sistemas: novo })
      };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
