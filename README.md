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

### Definir usuário e senha do painel

```bash
npm run definir-senha        # no Windows: npm.cmd run definir-senha
```

O comando pergunta o usuário e a senha e grava em `src/config/admin.ts` só o hash bcrypt (a senha nunca é salva). Depois é só fazer commit e push.

O segredo que assina o cookie de sessão é derivado sozinho da chave do Upstash Redis (`KV_REST_API_TOKEN`/`UPSTASH_REDIS_REST_TOKEN`), então não precisa cadastrar nada. Se quiser um segredo próprio, cadastre `SESSION_SECRET` (32+ caracteres) na Vercel; gere com:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

(As variáveis `ADMIN_USERNAME` e `ADMIN_PASSWORD_HASH` ainda funcionam, mas só quando `src/config/admin.ts` estiver vazio.)

### Publicar na Vercel

1. **Importar o repositório:** em vercel.com → *Add New → Project* → escolha este repositório. O `vercel.json` já define o framework como Next.js.
2. **Banco (Upstash Redis):** no projeto da Vercel → aba *Storage* (ou *Marketplace*) → *Upstash* → *Upstash for Redis* → plano gratuito → crie o banco e **conecte ao projeto** (marque Production, Preview e Development). A integração cria sozinha `KV_REST_API_URL`/`KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`). O código aceita os dois nomes.
3. **Variáveis:** nenhuma obrigatória além das do banco, que a integração cria sozinha.
4. **Subdomínio (opcional):** *Settings → Domains → Add*, por exemplo `links.setupenglish.com.br`. No painel de DNS do domínio, crie um registro **CNAME** `links` → `cname.vercel-dns.com`. Se quiser, cadastre também `NEXT_PUBLIC_SITE_URL` com o endereço final (usado na imagem de compartilhamento).

### Como funciona por dentro

| Assunto | Onde |
|---|---|
| Conteúdo editável (botões, redes, textos, logo, cliques) | `src/lib/content.ts`, `src/lib/content-types.ts` (chaves `setup:buttons`, `setup:socials`, `setup:page`, `setup:media:*`, `setup:clicks`) |
| Ícones da biblioteca | `src/lib/icon-names.ts`, `src/components/BrandIcon.tsx` (Tabler Icons) |
| Página pública | `src/app/page.tsx` (conteúdo em cache, refeito a cada 60 s ou na hora em que o painel salva) |
| Botão, estilos e animações | `src/components/LinkCard.tsx` e `src/app/globals.css` |
| Endereço do painel, 404 no `/admin`, `X-Robots-Tag`, 401 em escrita sem sessão | `src/proxy.ts` |
| Login, sessão, rate limit | `src/lib/auth.ts`, `src/lib/session*.ts`, `src/lib/ratelimit.ts` |
| Validação (zod) | `src/lib/content-types.ts` |
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

1. Abra **https://link-setup-english.vercel.app/admin-setup** (guarde nos favoritos do celular).
2. Digite o usuário e a senha e toque em **Entrar**. A entrada vale por 8 horas.
3. Se errar a senha 5 vezes, o painel bloqueia por 15 minutos.

O painel tem 3 abas: **Botões**, **Redes** e **Página**.

### Botões

- **Novo botão:** escreva o texto, cole o link (site com `https://`, WhatsApp com `wa.me/55...`, e-mail com `mailto:...`, telefone com `tel:...`), escolha o ícone, o estilo e a animação. A parte de cima mostra como vai ficar.
- **Ícone:** escolha um da lista (YouTube, Instagram, TikTok, Twitch, Kick, Threads, X, Discord, LivePix, WhatsApp...) ou toque em **Enviar imagem** para usar uma sua (PNG, JPG, WEBP ou SVG, até 600 KB).
- **Estilo:** branco (padrão) ou uma cor de destaque.
- **Animação:** brilho, pulso ou os dois, para destacar uma promoção ou novidade.
- **Selo:** etiqueta pequena no canto, como "Novo".
- **Datas:** o botão aparece e some sozinho no horário marcado (horário de Brasília).
- Na lista: **Ocultar/Mostrar** (sem apagar), **Editar**, **Duplicar** (a cópia nasce oculta), **Excluir** (pede confirmação) e as setas para mudar a ordem. Cada botão mostra quantos cliques recebeu.

### Redes

Ícones pequenos lado a lado, embaixo dos botões. Toque em **Nova rede**, escolha o ícone, cole o link e salve. Dá para ocultar, editar, excluir e mudar a ordem. Também mostram os cliques.

### Página

- **Logo:** escolha a imagem e toque em **Salvar este logo**. **Voltar ao logo original** desfaz.
- **Textos:** texto de cima, o trecho que fica na caixa azul (copie igualzinho do texto de cima), título e texto de baixo e rodapé. No rodapé, `{ano}` vira o ano atual.

Tudo que você salva aparece na página na hora.
