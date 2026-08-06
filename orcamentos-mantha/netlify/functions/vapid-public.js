// GET /api/vapid-public — devolve a chave pública para o frontend

exports.handler = async () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'VAPID_PUBLIC_KEY não configurada.' })
    };
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey })
  };
};
