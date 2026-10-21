# GamePing

Protótipo de um site que reúne promoções ativas de jogos e jogos grátis. As ofertas de Steam, GOG e Epic Games Store são consultadas pela API pública CheapShark; os jogos grátis vêm da API GamerPower. O site atualiza os dados a cada cinco minutos, remove promoções que deixaram de estar ativas e ignora jogos grátis com prazo encerrado.

Os valores recebidos em dólares são convertidos para reais pela cotação USD/BRL, então são estimativas e não necessariamente os preços regionais cobrados pelas lojas. A busca fica ao lado da marca no cabeçalho, sugere somente jogos enquanto o usuário digita e verifica promoções ativas; quando não há desconto, mostra o preço normal informado pelas lojas consultadas. A busca também permite salvar jogos para acompanhar; os avisos do navegador comparam esses jogos e os alertas de preço com as promoções consultadas.

Lista de desejos, carrinho, preferências, recomendações e sessão de login de demonstração ficam salvos somente no navegador atual. As recomendações combinam acessos anteriores a jogos e lojas com o volume público de avaliações. Notificações do sistema exigem permissão do navegador e funcionam enquanto o site está aberto. O carrinho inclui links para as páginas das lojas e, quando existe um Steam App ID, um link para abrir o aplicativo Steam. Login real, sincronização entre dispositivos e avisos quando o site estiver fechado exigem um backend.

Favoritar, adicionar ao carrinho, criar alertas e seguir para uma loja pedem o login demonstrativo antes de concluir a ação. Categorias são estimadas a partir dos nomes dos jogos, pois as fontes atuais não fornecem gêneros consistentes. As imagens de jogos Steam são substituídas sob demanda pelas artes de maior resolução da Steam (capturas de tela no destaque e capa da loja nos cards), mantendo a imagem original como fallback. No destaque principal, a prévia começa depois de o mesmo jogo ficar exibido por três segundos e a imagem faz uma transição suave quando o vídeo começa. Nos cards de promoções e jogos grátis, a prévia é carregada quando o card se aproxima da tela e reproduzida ao passar o mouse. O GamePing tenta primeiro encontrar um trailer na Steam e usa gameplays do YouTube como alternativa, com busca restrita a vídeos incorporáveis que mencionem o título do jogo e termos como “gameplay”, “walkthrough” ou “let's play”. A reprodução Steam usa uma faixa HLS leve ou MP4; os vídeos do YouTube são reproduzidos em iframe sem controles. Para ativar o fallback do YouTube no desenvolvimento, crie `.env.local` na raiz (não envie nem compartilhe a chave) com `YOUTUBE_API_KEY=sua_chave` e reinicie o servidor Vite. Crie a chave no Google Cloud com YouTube Data API v3 habilitada. O endpoint local `/youtube-api/search` mantém a chave no servidor e armazena buscas em cache por 12 horas. Sem a variável configurada, as prévias Steam continuam funcionando, mas não é possível buscar vídeos no YouTube. O proxy local da Steam e do YouTube não é incluído no build estático: a hospedagem de produção precisa oferecer endpoints server-side equivalentes, mantendo a chave fora do frontend. Quando nenhuma fonte fornece uma prévia correspondente, nenhum vídeo de outro jogo é usado como substituto.

## Requisitos

- Node.js 22
- pnpm 10 (via Corepack)

## Desenvolvimento

Na raiz do repositório, instale as dependências e inicie o servidor:

```bash
corepack pnpm install
corepack pnpm dev
```

## Build e pré-visualização

```bash
corepack pnpm build
corepack pnpm preview
```
