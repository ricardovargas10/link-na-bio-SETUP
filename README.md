# Set Up | Página de links

Página de links da bio do Instagram da Set Up English School (@setup.english), com painel para trocar botões,
redes, textos e logo sem mexer em código.

Endereço: **https://links.setupenglish.com.br** · Painel: **https://links.setupenglish.com.br/admin-setup**

Roda na hospedagem **Hostinger (plano Premium)**: PHP + MySQL, sem Node.js no servidor.

---

## Para quem usa o painel (a Set Up)

1. Abra **links.setupenglish.com.br/admin-setup** e entre com o usuário e a senha que você recebeu.
2. Aba **Botões**: a lista está na mesma ordem da página.
   - **Novo botão**: texto, link, ícone, cor, subtítulo, selo (ex.: NOVO), animação e datas para entrar e sair do ar.
   - **Arraste** pela alça (⋮⋮) para mudar a ordem.
   - **Ocultar** tira da página sem apagar. **Duplicar** cria uma cópia oculta. **Excluir** pede confirmação.
   - **Começa um grupo aqui** abre um espaço e permite um título acima do botão; **Meia largura** põe dois
     botões lado a lado.
   - Cada botão mostra quantos cliques recebeu. No topo aparece quantas pessoas abriram a página.
3. Aba **Redes**: ícones das redes sociais que ficam abaixo dos botões.
4. Aba **Página**: texto de cima (e o trecho na caixa azul), texto "Sobre", rodapé e logo.
5. Tudo aparece na página assim que você salva.

Esqueceu a senha? Peça a quem cuida do site: a troca é feita em `/instalar.php` (precisa da senha do banco).

---

## Para quem cuida do site (desenvolvedor)

### Como funciona

| Parte | Onde está no projeto | O que vira na Hostinger |
| --- | --- | --- |
| Página pública | `php/index.php` + `php/api/lib/pagina.php` | HTML gerado pelo PHP a cada visita |
| Painel | `src/app/admin-setup/` (Next.js, exportado estático) | arquivos HTML/JS em `/admin-setup/` |
| API do painel | `php/api/` | `/api/?a=...` (PHP + MySQL) |
| Instalador | `php/instalar.php` | cria as tabelas e o usuário do painel |

`npm run build:hostinger` gera a pasta **`deploy/`** com tudo junto. Um GitHub Action
(`.github/workflows/hostinger.yml`) faz isso sozinho a cada push e guarda o resultado no ramo **`hostinger`**.

> `src/components/LinkCard.tsx` (prévia do painel) e `php/api/lib/pagina.php` (página) desenham o mesmo botão.
> Mudou um, mude o outro.

### Colocar no ar pela primeira vez (hPanel da Hostinger)

1. **Subdomínio**: *Domínios → Subdomínios* → crie `links` em `setupenglish.com.br`.
   Anote a pasta que ele cria (normalmente `public_html/links`).
2. **HTTPS**: *Segurança → SSL* → confira se `links.setupenglish.com.br` tem SSL ativo (instale o gratuito se não tiver).
3. **Banco de dados**: *Bancos de dados → Gerenciamento* → crie um banco MySQL e um usuário com senha.
   Anote o nome do banco, o usuário e a senha (o servidor é `localhost`).
4. **Git**: *Avançado → Git* →
   - Repositório: `https://github.com/ricardovargas10/link-na-bio-SETUP.git`
   - Ramo: `hostinger`
   - Diretório: `links` (a pasta do subdomínio, sem o `public_html/`)
   - Clique em **Criar**. A pasta precisa estar vazia: se a Hostinger criou um `default.php` nela, apague antes.
5. **Atualizar sozinho**: ainda em *Git*, clique em **Implantação automática** e copie o link (webhook).
   No GitHub: *Settings → Webhooks → Add webhook*, cole o link e salve.
   A partir daí, todo push publica o site em 1 ou 2 minutos.
6. **Instalar**: abra `https://links.setupenglish.com.br/instalar.php`, preencha o banco do passo 3 e crie o
   usuário e a senha do painel (mínimo 10 caracteres). O instalador grava a configuração **fora** da pasta pública
   e se tranca depois de usado.
7. Pronto: página em `https://links.setupenglish.com.br` e painel em `/admin-setup`.

Trocar a senha do painel depois: abra `/instalar.php` de novo (pede a senha do banco).

### Segurança

- Senhas só como hash bcrypt; sessão em cookie httpOnly, Secure, SameSite=Strict, 8 horas.
- 5 tentativas de login erradas em 15 minutos bloqueiam o IP por 15 minutos.
- Toda alteração exige sessão válida + token CSRF; tudo é validado de novo no PHP.
- Imagens enviadas: só PNG, JPG, WEBP ou SVG de verdade (conferido pelo conteúdo), até 600 KB,
  servidas com `Content-Security-Policy: sandbox`.
- `api/lib/` é bloqueada pela web; painel, API e instalador ficam fora do Google (`noindex`).
- A configuração com a senha do banco (`setup-config.php`) nunca vai para o GitHub.

### Rodar no computador

```bash
npm install
npm run dev              # só o painel, em http://localhost:3000/admin-setup (sem API)
npm run build:hostinger  # gera deploy/ igual ao que vai para a Hostinger
```

Para testar tudo junto é preciso PHP 8 e MySQL/MariaDB:
`php -S 127.0.0.1:8080 -t deploy scripts/servidor-local.php` e abra `http://127.0.0.1:8080/instalar.php`.

### Marca

`public/brand/`: `logo.png`, `icon.png` (favicon e imagem de compartilhamento) e o fundo (`background*.png/webp`).

### Tecnologias

Next.js 16 (painel, exportado estático), React 19, TypeScript, Tailwind CSS 4, fonte Bricolage Grotesque,
ícones Tabler e Lucide; PHP 8 + MySQL na Hostinger.
