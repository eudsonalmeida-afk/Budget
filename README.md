# Contaê — PWA

Aplicativo de controle financeiro pessoal com gastos, salários, cartões e compras parceladas. Esta versão pode ser instalada no computador ou celular e abre em janela própria, sem a barra comum do navegador.

## Arquivos

```text
Contae-PWA/
├── index.html
├── style.css
├── script.js
├── manifest.webmanifest
├── service-worker.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Antes de publicar

No Supabase, abra **SQL Editor** e execute o arquivo SQL de parcelamentos usado pela versão atual do Contaê, caso essa tabela ainda não tenha sido criada.

Confira também a constante `SITE_URL` no início de `script.js`. Ela precisa corresponder ao endereço definitivo do GitHub Pages, pois é usada no redirecionamento de confirmação de e-mail.

## Publicar no GitHub Pages

1. Descompacte o ZIP.
2. Envie todos os arquivos e a pasta `icons` para a raiz do repositório.
3. No GitHub, abra **Settings → Pages**.
4. Em **Build and deployment**, selecione a branch publicada e a pasta raiz.
5. Ative **Enforce HTTPS**, quando a opção estiver disponível.
6. Aguarde a publicação e abra o endereço do aplicativo.

Os caminhos do manifesto, service worker e ícones são relativos, portanto funcionam quando o projeto é publicado em uma subpasta como `usuario.github.io/Budget/`.

## Instalar no computador

### Microsoft Edge

1. Abra o Contaê publicado.
2. Clique nos três pontos.
3. Abra **Aplicativos**.
4. Escolha **Instalar Contaê**.

### Google Chrome

1. Abra o Contaê publicado.
2. Clique no ícone de instalação da barra de endereço ou abra o menu.
3. Escolha **Instalar página como app**.

Ao iniciar pelo ícone instalado, o app abre no modo `standalone`.

## Instalar no celular

### Android

Abra o site no Chrome ou Edge, acesse o menu e escolha **Instalar aplicativo** ou **Adicionar à tela inicial**.

### iPhone/iPad

Abra o site no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**.

## Validar a PWA

No Chrome ou Edge:

1. pressione `F12`;
2. abra **Aplicativo → Manifesto**;
3. confirme nome, cores e ícones;
4. abra **Aplicativo → Service workers**;
5. confirme que `service-worker.js` está ativado e em execução.

Para testar o cache, carregue o app uma vez conectado e depois marque **Offline** no painel do service worker. A interface deve continuar abrindo; recursos remotos e a sincronização com o Supabase continuam dependendo de internet.

## Atualizações

Quando publicar uma mudança importante, altere em `service-worker.js`:

```js
const CACHE_NAME = "contae-pwa-v2";
```

Use `v3`, `v4` e assim por diante nas versões futuras. Isso remove o cache anterior na ativação.

## Observações importantes

- A estratégia do service worker é **network-first**: tenta buscar a versão atual e usa o cache quando a rede falha.
- A autenticação e a sincronização do Supabase continuam funcionando como antes quando há conexão.
- O cache permite abrir a estrutura do app sem internet, mas não transforma operações remotas em operações offline.
- Não limpe os dados do site sem necessidade, pois isso pode remover sessão e preferências locais.
