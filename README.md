# Set Up | Página de links

Página de links da bio do Instagram da Set Up English School (@setup.english).
Página estática: sem banco de dados e sem painel.

No ar em: https://link-setup-english.vercel.app

## Mudar textos e links

Tudo fica em **`src/config/site.ts`**:

- `headline`: texto de cima; `highlight`: o trecho dele que vai na caixa azul.
- `buttons`: os botões, na ordem da página (texto, link e ícone).
- `aboutTitle` e `aboutText`: texto de baixo.
- `footer`: rodapé (`{ano}` vira o ano atual).

Os ícones disponíveis estão em `src/lib/icon-names.ts` (formulário, WhatsApp, e-mail, Instagram, YouTube, TikTok, Twitch, Kick, Threads, X, Discord, LivePix e outros).

Depois de editar, faça commit e push: a Vercel publica sozinha.

## Rodar no computador

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Marca

`public/brand/`: `logo.png`, `icon.png` (favicon e imagem de compartilhamento) e `background.png` (textura do fundo).

## Tecnologias

Next.js 16 (App Router), TypeScript, Tailwind CSS 4, fonte Bricolage Grotesque e ícones Tabler (licença MIT).
