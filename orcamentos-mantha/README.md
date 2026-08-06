# Orçamentos Mantha

Sistema interno da Mantha Impermeabilização para o fluxo **medidor → orçamentista**.

- **Arthur (medidor)** digita os dados da visita técnica no app (celular ou desktop).
- **Orçamentista** recebe uma notificação push instantânea e abre a solicitação para elaborar a proposta.

Stack: HTML + JS puro (SPA) · CSS puro · PWA · Web Push · Netlify Functions · JSON no GitHub como banco.

---

## 📁 Estrutura

```
orcamentos-mantha/
├── index.html
├── manifest.json
├── service-worker.js
├── netlify.toml
├── package.json
├── css/style.css
├── js/
│   ├── app.js
│   ├── utils.js
│   ├── push.js
│   ├── sistemas.js
│   ├── medidor.js
│   └── orcamentista.js
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── favicon.png
└── netlify/functions/
    ├── _lib/
    │   ├── github.js       (helper GitHub)
    │   └── push.js         (helper Web Push)
    ├── salvar-medicao.js
    ├── listar-medicoes.js
    ├── medicao.js          (PATCH: mudar status)
    ├── registrar-push.js
    ├── sistemas.js         (GET/POST/DELETE)
    └── vapid-public.js
```

---

## 🚀 Deploy passo a passo

Siga a ordem exatamente como está.

### 1. Criar dois repositórios no GitHub

Você precisa de **dois** repositórios:

- **`orcamentos-mantha`** (público ou privado) — o código deste projeto, que a Netlify vai buildar.
- **`orcamentos-mantha-dados`** (**PRIVADO** — importante) — vai guardar `medicoes.json`, `sistemas.json` e `subscriptions.json`.

Crie os dois vazios no GitHub. Você pode chamar o segundo do jeito que quiser — só anote o nome.

### 2. Subir o código para o repositório de código

No terminal, dentro da pasta `orcamentos-mantha` que você recebeu:

```bash
git init
git add .
git commit -m "Setup inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/orcamentos-mantha.git
git push -u origin main
```

### 3. Gerar um Personal Access Token do GitHub

O Netlify vai usar esse token para ler/escrever nos arquivos JSON do repositório de dados.

1. Acesse: https://github.com/settings/tokens?type=beta
2. Clique em **"Generate new token"** → **Fine-grained personal access token**
3. Configure:
   - **Token name**: `orcamentos-mantha`
   - **Expiration**: 1 year (ou o máximo permitido)
   - **Repository access**: **Only select repositories** → escolha `orcamentos-mantha-dados`
   - **Repository permissions**:
     - **Contents**: Read and write ✅
     - **Metadata**: Read-only ✅ (já vem marcado)
4. Clique em **Generate token** e **COPIE O TOKEN AGORA** (ele não aparece de novo).

### 4. Gerar as VAPID keys (Web Push)

VAPID é um par de chaves que identifica seu servidor para o navegador dos usuários. Você gera **UMA vez**, e usa para sempre.

Instale as dependências localmente e gere:

```bash
npm install
npm run gerar-vapid
```

Você verá algo como:

```
VAPID_PUBLIC_KEY= BFvdX8yZ...
VAPID_PRIVATE_KEY= abc123XYZ...
```

**Guarde essas duas chaves.** Elas vão para o Netlify.

### 5. Deploy no Netlify

1. Acesse https://app.netlify.com e clique em **"Add new site" → "Import an existing project"**.
2. Conecte com o GitHub e selecione o repositório **`orcamentos-mantha`**.
3. Configurações de build (deve preencher sozinho, mas confirme):
   - **Branch**: `main`
   - **Build command**: (deixar vazio)
   - **Publish directory**: `.`
4. Clique em **Deploy site**. Vai falhar as functions até você configurar as variáveis (próximo passo), mas o site vai subir.

### 6. Configurar as variáveis de ambiente no Netlify

Vá em **Site settings → Environment variables → Add a variable**. Adicione **todas** estas:

| Chave | Valor |
|---|---|
| `GITHUB_TOKEN` | O token que você copiou no passo 3 |
| `GITHUB_OWNER` | Seu usuário/organização do GitHub (ex: `gustavorocha`) |
| `GITHUB_REPO_DATA` | Nome do repositório de dados (ex: `orcamentos-mantha-dados`) |
| `GITHUB_BRANCH` | `main` (ou o nome da sua branch principal) |
| `VAPID_PUBLIC_KEY` | A chave pública gerada no passo 4 |
| `VAPID_PRIVATE_KEY` | A chave privada gerada no passo 4 |
| `VAPID_SUBJECT` | `mailto:contato@manthaimper.com.br` (ou outro e-mail) |

Depois clique em **Deploys → Trigger deploy → Deploy site** para as variáveis entrarem em vigor.

### 7. Personalizar o domínio (opcional)

Em **Domain management** você pode:
- Renomear o subdomínio Netlify (ex: `orcamentos-mantha.netlify.app`).
- Configurar um subdomínio próprio (ex: `orcamentos.manthaimper.com.br`).

### 8. Adicionar o atalho na Mantha Suite

Depois de tudo funcionando, adicione um card na Mantha Suite apontando para a URL do app.

---

## ✅ Como testar

1. **Cadastre pelo menos um sistema** em "Sistemas de impermeabilização" (ex: "Manta asfáltica 4mm").
2. **Abra o app no celular** que o **orçamentista** vai usar. Vá em "Medições recebidas" → clique em "Ativar" no banner amarelo de notificações. Aceite a permissão do navegador.
3. **Instale como PWA** (Chrome/Safari: "Adicionar à tela inicial"). Isso é importante no celular do orçamentista para as notificações funcionarem sempre.
4. **De outro dispositivo** (ou aba anônima), abra o app e vá em "Nova medição". Preencha e envie.
5. O orçamentista deve receber a notificação em segundos.

> ⚠️ **Web Push no iOS**: no iPhone, o Web Push só funciona se o app estiver instalado como PWA (adicionado à tela inicial) — não funciona no Safari comum. É uma restrição da Apple.

---

## 🧩 Como o app funciona (para você entender)

### Fluxo de uma nova medição

```
Arthur preenche o formulário
        ↓
POST /api/salvar-medicao
        ↓
Netlify Function grava em medicoes.json (no repo de dados)
        ↓
Netlify Function lê subscriptions.json e envia push a cada uma
        ↓
Service Worker do orçamentista mostra a notificação
        ↓
Orçamentista clica → abre o app na tela "Medições recebidas"
```

### Cálculo automático de m²

Para cada ambiente, o app calcula:

```
piso_m2  +  soma(parede.comprimento × parede.altura)  = subtotal
subtotal  +  (subtotal × sobreposicao_pct / 100)      = total
```

### Onde ficam os dados

Tudo no repositório de dados privado, em três arquivos:
- `medicoes.json` — todas as medições enviadas pelo Arthur
- `sistemas.json` — sistemas cadastrados
- `subscriptions.json` — dispositivos que devem receber push

---

## 🛠️ Como evoluir o app

Ideias de próximos passos, quando fizer sentido:

- **Login por senha** para separar Arthur/orçamentista (hoje qualquer um vê tudo).
- **Campos do orçamentista** — depois que ele fecha o orçamento, gravar preço unitário por sistema, desconto, valor total, e gerar PDF da proposta comercial pronta pro cliente.
- **Integração com [OBRAcalc]** — quando o orçamento é fechado, exportar o levantamento pronto.
- **Histórico por cliente** — agrupar medições pelo mesmo cliente para consultar depois.
- **Fotos** — se você mudar de ideia, dá pra subir para Cloudinary (plano gratuito bom) e guardar só a URL no JSON.

---

## 🐛 Se der problema

- **"GITHUB_TOKEN não configurado"** nas functions → conferir se todas as variáveis foram salvas no Netlify e se você fez um novo deploy depois.
- **Notificação não chega** → conferir se `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` estão configuradas e se o orçamentista realmente clicou em "Ativar notificações" e deu permissão ao navegador.
- **"Sistema já existe"** ao cadastrar → é só uma checagem de duplicidade, ignore ou use outro nome.
- **Push chega uma vez e para** → subscriptions podem expirar. Peça ao orçamentista para clicar em "Ativar" de novo. O app já remove automaticamente subscriptions que retornam 404/410.

---

Feito para a Mantha 🏗️
