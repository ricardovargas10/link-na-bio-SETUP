# Set Up | Página de links

Página de links da bio do Instagram da Set Up English School (@setup.english), com um painel privado para criar botões de promoção.

- Página pública: `/`
- Painel: `/admin-setup` (fixo no código, em `src/lib/session-token.ts`; não existe link para ele no site)

---

## Parte 1: para o desenvolvedor

### Tecnologias

Next.js 16 (App Router, Cache Components, `proxy.ts`), TypeScript, Tailwind CSS 4, Upstash Redis (`@upstash/redis`), `@upstash/ratelimit`, `bcryptjs`, `jose` (cookie assinado) e `zod`.

### Rodar no seu computador

```bash
npm install
cp .env.example .env.local   # e preencha (veja abaixo)
npm run dev
```

Abra http://localhost:3000. O painel fica em `http://localhost:3000/admin-setup`.

Sem as variáveis do Redis, o modo `dev` guarda as promoções **na memória** (somem ao reiniciar). Para testar o build de produção no seu computador sem Redis:

```bash
npm run build
LOCAL_MEMORY_STORE=1 npm start
```

(`LOCAL_MEMORY_STORE` é ignorado na Vercel; lá o Redis é obrigatório.)

### Gerar o hash da senha do painel

```bash
npm run hash-password
```

O script pede a senha sem mostrar na tela (mínimo de 10 caracteres). Se o terminal não aceitar a digitação escondida (acontece em alguns terminais do Windows), use `npm run hash-password -- --visivel` e limpe a tela depois com `cls`. Ele imprime:

- o hash puro, para colar na Vercel em `ADMIN_PASSWORD_HASH`;
- a linha para o `.env.local`, com os `$` protegidos (`\$`). Sem a proteção, o Next.js tenta ler `$2b`, `$12`… como variáveis.

### Gerar o `SESSION_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Use um segredo diferente em cada ambiente. Trocar o segredo derruba todas as sessões abertas.

### Publicar na Vercel

1. **Importar o repositório:** em vercel.com → *Add New → Project* → escolha este repositório. O `vercel.json` já define o framework como Next.js.
2. **Banco (Upstash Redis):** no projeto da Vercel → aba *Storage* (ou *Marketplace*) → *Upstash* → *Upstash for Redis* → plano gratuito → crie o banco e **conecte ao projeto** (marque Production, Preview e Development). A integração cria sozinha `KV_REST_API_URL`/`KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`). O código aceita os dois nomes.
3. **Variáveis:** em *Settings → Environment Variables*, cadastre:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`: o hash puro do `npm run hash-password`
   - `SESSION_SECRET`: 32 caracteres ou mais
4. **Redeploy:** *Deployments → … → Redeploy* para as variáveis valerem.
5. **Subdomínio (opcional):** *Settings → Domains → Add*, por exemplo `links.setupenglish.com.br`. No painel de DNS do domínio, crie um registro **CNAME** `links` → `cname.vercel-dns.com`. Se quiser, cadastre também `NEXT_PUBLIC_SITE_URL` com o endereço final (usado na imagem de compartilhamento).

### Como funciona por dentro

| Assunto | Onde |
|---|---|
| Botões fixos (formulário, WhatsApp, e-mail, Instagram) e texto "Sobre a Set Up" | `src/config/links.ts` |
| Link do formulário (editável no painel, chave `setup:settings`) | `src/lib/settings.ts` |
| Página pública | `src/app/page.tsx` (promoções em cache, refeitas a cada 60 s ou na hora em que o painel salva) |
| Botão de promoção e animações | `src/components/PromoButton.tsx` e `src/app/globals.css` |
| Endereço do painel, 404 no `/admin`, `X-Robots-Tag`, 401 em escrita sem sessão | `src/proxy.ts` |
| Login, sessão, rate limit | `src/lib/auth.ts`, `src/lib/session*.ts`, `src/lib/ratelimit.ts` |
| Banco (chave `setup:promos`) | `src/lib/promos.ts`, `src/lib/redis.ts` |
| Validação (zod) | `src/lib/promo-types.ts` |
| Painel | `src/app/admin/*` (só acessível por `/admin-setup`) |

Segurança em resumo:

- o painel só existe em `/admin-setup`, e `/admin` dá 404;
- toda página do painel tem `noindex, nofollow` na meta tag e no cabeçalho, nada sobre o painel no `robots.txt` e não há sitemap;
- a senha só existe como hash bcrypt;
- a comparação é em tempo constante, com mensagem de erro genérica;
- 5 tentativas a cada 15 min por IP;
- cookie `httpOnly`, `secure`, `sameSite=strict`, restrito ao caminho do painel, válido por 8 h;
- toda server action confere a sessão no servidor;
- links só `https://`, `wa.me` ou `mailto:`;
- o React escapa todo texto vindo do banco.

Se o banco estiver vazio ou fora do ar, a página pública mostra só os botões fixos.

---

## Parte 2: para quem vai usar o painel

### Entrar

1. Abra o endereço do site + `/admin-setup` (guarde nos favoritos do celular).
2. Digite o usuário e a senha e toque em **Entrar**.
3. A entrada vale por 8 horas. Depois disso, é só entrar de novo.
4. Se errar a senha 5 vezes, o painel bloqueia por 15 minutos. Espere e tente de novo.

### Criar uma promoção

1. Toque em **Nova promoção**.
2. Preencha:
   - **Título** (obrigatório): a frase principal do botão.
   - **Subtítulo** (opcional): uma frase menor embaixo.
   - **Selo** (opcional): uma etiqueta pequena no canto, como "Novo" ou "Vagas abertas".
   - **Cor do botão**: laranja, azul, lilás ou roxo.
   - **Link**: para onde o botão leva. Pode ser um site (`https://...`), um WhatsApp (`wa.me/55...`) ou um e-mail (`mailto:...`).
3. Em **Como vai ficar na página** você vê o botão do jeito que vai aparecer, com o brilho.
4. Toque em **Salvar**. A página muda na hora.

### Agendar datas

Em **Datas**, preencha **Começa em** e/ou **Termina em** (horário de Brasília).

- Antes da data de início, a promoção fica **Agendada** e não aparece.
- Depois da data de fim, fica **Encerrada** e some sozinha.
- Sem datas, ela fica no ar enquanto estiver ligada.

A troca acontece em até 1 minuto depois do horário marcado.

### Ligar e desligar

Na lista, toque no botão **Ligada / Desligada** de cada promoção. Desligada, ela não aparece na página, mesmo dentro das datas.

### Mudar a ordem

Use as setas **↑** e **↓** de cada promoção. A de cima aparece primeiro na página. Também dá para escolher a **Posição na página** dentro do formulário.

### Editar, duplicar e excluir

- **Editar**: abre o formulário com tudo preenchido.
- **Duplicar**: cria uma cópia **desligada**, boa para reaproveitar uma campanha.
- **Excluir**: pede confirmação. Depois de excluída, não dá para recuperar.

### Trocar o link do formulário

No fim da lista de promoções fica o quadro **Link do formulário**. Cole o link novo (por exemplo, do Google Forms) e toque em **Salvar link**. O botão "Preencha o formulário de interesse" da página passa a abrir esse link na hora.

### Sair

Toque em **Sair** no alto da lista, principalmente se estiver usando um aparelho que não é seu.
