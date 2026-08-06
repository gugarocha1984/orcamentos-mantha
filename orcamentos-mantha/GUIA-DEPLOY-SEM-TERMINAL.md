# 🚀 Guia rápido de deploy (100% pelo navegador)

Este guia é para quem **não quer mexer com terminal, git ou npm**. Tudo aqui é feito pelo navegador. Tempo estimado: **30 a 40 minutos**.

---

## ✅ O que você já tem pronto

- Todos os arquivos do app (já dentro deste zip)
- As **VAPID keys** já geradas no arquivo `SUAS-CHAVES-VAPID.txt` (dentro deste zip)

Você só precisa fazer os cliques abaixo.

---

## 🎬 Antes de começar

1. Extraia este zip numa pasta do seu computador (clique com botão direito → "Extrair tudo").
2. Abra o arquivo `SUAS-CHAVES-VAPID.txt` num bloco de notas e deixa aberto — você vai usar mais tarde.
3. Tenha logins ativos em: **github.com** e **app.netlify.com**.

⚠️ **IMPORTANTE**: apague o arquivo `SUAS-CHAVES-VAPID.txt` da pasta antes de subir os arquivos pro GitHub. Ele não pode ficar em repositório público.

---

## FASE 1 — GITHUB (15 min)

### 1.1 Criar o repositório de **código**

1. Abra https://github.com/new
2. Preencha:
   - **Repository name**: `orcamentos-mantha`
   - **Description**: (opcional) `Sistema de orçamentos da Mantha`
   - **Public** ou **Private** — tanto faz (o código não tem senha, mas se preferir esconder do mundo, escolha Private)
   - Não marque nada em "Initialize this repository with" (deixa tudo desmarcado)
3. Clique em **Create repository**.

### 1.2 Subir os arquivos do app

Na tela do repositório recém-criado que abriu, você vai ver um texto grande "Quick setup". Ignore o `git` etc. Procure o link no meio da tela:

> **"uploading an existing file"** (é um link azul)

1. Clique nele.
2. Abra a pasta que você extraiu do zip.
3. **Apague o `SUAS-CHAVES-VAPID.txt` primeiro** (⚠️ importante — copie o conteúdo dele antes se ainda não copiou).
4. **Selecione TODOS os arquivos e pastas** dentro da pasta `orcamentos-mantha` (Ctrl+A) e **arraste tudo** para a área "Drag files here to add them to your repository".
5. Espere o upload terminar (a barra de progresso mostra).
6. Lá embaixo, no campo "Commit changes", pode deixar a mensagem padrão.
7. Clique em **Commit changes**.

Pronto — seu código está no GitHub.

### 1.3 Criar o repositório de **dados**

Agora um segundo repositório, este só pra guardar os JSONs.

1. Abra de novo: https://github.com/new
2. Preencha:
   - **Repository name**: `orcamentos-mantha-dados`
   - **Private** ✅ (esse tem que ser privado — vai ter dados de clientes)
   - **Marque** ✅ "Add a README file" (importante! Sem isso o repo fica vazio e a API do GitHub não consegue escrever nele na primeira vez)
3. Clique em **Create repository**.

### 1.4 Gerar o Personal Access Token

Este token vai deixar o Netlify escrever no repositório de dados.

1. Abra: https://github.com/settings/personal-access-tokens/new
   (Se pedir senha ou 2FA, faça o login.)

2. Preencha:
   - **Token name**: `orcamentos-mantha`
   - **Expiration**: `1 year` (o máximo)
   - **Resource owner**: seu próprio usuário
   - **Repository access**: clique em **"Only select repositories"** → no seletor que aparece, escolha **apenas** `orcamentos-mantha-dados`

3. Role até **"Permissions"** → abra a seção **"Repository permissions"**:
   - Procure **Contents** → mude de "No access" para **"Read and write"** ✅
   - **Metadata** já vem como "Read-only" (deixe assim)

4. Role até o final, clique em **Generate token**.

5. **⚠️ COPIE O TOKEN AGORA** (aparece uma vez só). Cole no mesmo bloco de notas onde estão as VAPID keys.

Anote também estas informações que vou pedir depois:
- **Seu usuário GitHub** (aparece na URL do seu perfil, ex: `gustavorocha`)
- **Nome do repositório de dados** que você criou (ex: `orcamentos-mantha-dados`)

---

## FASE 2 — NETLIFY (10 min)

### 2.1 Importar o projeto

1. Abra https://app.netlify.com
2. Clique em **Add new site** (canto superior direito) → **Import an existing project**.
3. Escolha **Deploy with GitHub**.
4. Autorize o Netlify a ver seus repositórios (se pedir).
5. Na lista, procure e clique em `orcamentos-mantha`.
6. Nas configurações que aparecem:
   - **Branch**: `main`
   - **Build command**: deixe vazio
   - **Publish directory**: `.` (só um pontinho)
7. Clique em **Deploy orcamentos-mantha**.

O primeiro deploy vai rodar. Vai dar "erro" nas Functions (é esperado — falta configurar as variáveis). Mas o site em si vai subir.

### 2.2 Configurar as variáveis de ambiente

Estas são 7 variáveis que o app precisa. Vou listar uma por uma.

1. No painel do seu site, vá em: **Site configuration** (menu lateral) → **Environment variables** → **Add a variable** → **Add a single variable**.

2. Adicione, **uma de cada vez** (repete o clique em "Add a variable" para cada uma):

| Chave (Key) | Valor (Value) |
|---|---|
| `GITHUB_TOKEN` | (o token que você copiou no passo 1.4) |
| `GITHUB_OWNER` | (seu usuário GitHub — ex: `gustavorocha`) |
| `GITHUB_REPO_DATA` | `orcamentos-mantha-dados` |
| `GITHUB_BRANCH` | `main` |
| `VAPID_PUBLIC_KEY` | (do arquivo `SUAS-CHAVES-VAPID.txt`) |
| `VAPID_PRIVATE_KEY` | (do arquivo `SUAS-CHAVES-VAPID.txt`) |
| `VAPID_SUBJECT` | `mailto:contato@manthaimper.com.br` |

3. Em cada variável, deixe **Scopes: All scopes** e **Values: Same value for all deploy contexts** (é o padrão, não precisa mudar nada).

### 2.3 Refazer o deploy

Depois de salvar todas as variáveis:

1. Vá no menu lateral em **Deploys**.
2. Clique no botão **Trigger deploy** → **Deploy site**.
3. Espere ~2 minutos até virar "Published" em verde.

### 2.4 Ver o site funcionando

1. Ainda em **Deploys**, clique no card do deploy mais recente.
2. Copie a URL que aparece no topo (algo tipo `https://random-nome-123.netlify.app`).
3. Abra essa URL no navegador — o app deve aparecer!

### 2.5 (Opcional) Trocar o nome do site

1. Vá em **Site configuration** → **General** → **Site details**.
2. Clique em **Change site name** e coloque algo tipo `orcamentos-mantha`.
3. A nova URL fica `https://orcamentos-mantha.netlify.app`.

---

## FASE 3 — TESTAR (5 min)

Com o site no ar, vamos ver se funciona ponta a ponta.

### 3.1 Cadastrar um sistema

1. Abra o site.
2. Clique em **Sistemas de impermeabilização**.
3. Digite um nome (ex: `Manta asfáltica 4mm`) e clique em **Adicionar**.
4. Cadastre 2 ou 3 mais para ter opções no dropdown.

### 3.2 Ativar notificações no dispositivo do orçamentista

Este passo tem que ser feito **no celular ou computador que o orçamentista vai usar**.

1. No dispositivo dele, abra o site.
2. Clique em **Medições recebidas**.
3. Vai aparecer um banner amarelo pedindo para ativar notificações. Clique em **Ativar**.
4. O navegador vai pedir permissão — clique em **Permitir**.
5. Aparece o toast "Notificações ativadas!".

**No celular Android**: clique nos três pontinhos do navegador → **Adicionar à tela inicial**.

**No celular iPhone**: clique no botão de compartilhar → **Adicionar à Tela de Início**. Depois use o app pelo ícone da tela inicial (não pelo Safari) — é obrigatório no iPhone pro push funcionar.

### 3.3 Enviar uma medição de teste

1. **De outro dispositivo** (seu computador, por exemplo, ou aba anônima), abra o site.
2. Clique em **Nova medição**.
3. Preencha cliente, data, adicione um pavimento com um ambiente qualquer com algumas medidas.
4. Clique em **Enviar para orçamento**.
5. O dispositivo do orçamentista deve receber a notificação em segundos.

Se chegou, deu certo! 🎉

---

## 🆘 Se algo não funcionar

**"Erro ao carregar" na tela do orçamentista**
→ Alguma variável de ambiente está errada. Vá em **Site configuration → Environment variables** no Netlify e confira se todas as 7 estão lá, sem espaços a mais no começo/fim.

**Adicionar sistema dá erro**
→ Provavelmente o token do GitHub está errado ou sem permissão de escrita. Refaça o passo 1.4 com atenção.

**Notificação não chega**
→ Confira se `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` estão no Netlify iguais ao arquivo `SUAS-CHAVES-VAPID.txt`. E se o orçamentista realmente clicou "Permitir" quando o navegador perguntou.

**Deu ruim e não sei o que fazer**
→ No Netlify, vá em **Logs → Functions** e olhe o erro. Me manda o print/texto que a gente resolve.

---

Parabéns! Se tudo funcionou, você acabou de subir um app PWA completo, com backend serverless e Web Push, sem escrever uma linha de código nem tocar num terminal. 👏
