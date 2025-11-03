# Catnip Secure Browser

Um navegador web totalmente focado em privacidade e segurança, construído com Electron.

<div align="center">
  <img src="docs/nico.JPEG" alt="Nico protegendo sua privacidade" width="600" />
  <p><em>Nico aqui, garantindo que ninguém rastreie você pela internet. Sério, ele não deixa passar nada.</em></p>
</div>

## Recursos

### Recursos de Privacidade

- **Bloqueio de Rastreadores** - Bloqueia automaticamente scripts e requisições de rastreamento
- **Bloqueio de Anúncios** - Remove anúncios e scripts publicitários
- **Proteção contra Fingerprinting** - Modifica APIs do navegador para prevenir identificação única
- **Bloqueio de Cookies de Terceiros** - Impede que sites de terceiros armazenem cookies
- **Bloqueio de Scripts de Terceiros** - Opção para bloquear todos os scripts externos
- **HTTPS Only Mode** - Redireciona automaticamente conexões HTTP para HTTPS
- **Do Not Track** - Envia cabeçalho DNT para todos os sites
- **Limpeza Automática** - Remove cookies e cache ao fechar o navegador
- **Proteção WebGL/Canvas/WebAudio** - Proteção adicional contra fingerprinting
- **Bloqueio de Notificações** - Bloqueia todas as solicitações de notificações
- **Bloqueio de Geolocalização** - Bloqueia todas as solicitações de geolocalização

### Interface

- Interface moderna e escura
- Sistema de abas múltiplas
- Barra de endereço inteligente com busca integrada
- Estatísticas de privacidade em tempo real
- Painel de configurações de privacidade completo

## Instalação

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

### Passos

1. Clone ou baixe este repositório
2. Instale as dependências:

```bash
npm install
```

3. Execute o navegador em modo desenvolvimento:

```bash
npm run electron:dev
```

Este comando inicia o servidor Vite (React) e o Electron simultaneamente.

## Build

Para criar um executável, primeiro faça o build do React e depois do Electron:

### Windows
```bash
npm run electron:build:win
```

### macOS
```bash
npm run electron:build:mac
```

### Linux
```bash
npm run electron:build:linux
```

Os executáveis estarão na pasta `dist/`.

## Como Usar

### Navegação Básica

- Digite um endereço na barra de endereço e pressione Enter
- Digite uma busca sem protocolo para pesquisar no DuckDuckGo
- Use os botões Voltar/Avançar para navegar no histórico
- Clique no botão de Recarregar para atualizar a página

### Gerenciamento de Abas

- Clique no botão "+" para criar uma nova aba
- Clique no "×" em uma aba para fechá-la
- Clique no título de uma aba para alternar entre abas

### Configurações de Privacidade

1. Clique no ícone de cadeado na barra de endereço
2. Ajuste as configurações conforme desejado
3. Clique em "Salvar Configurações"

**Nota:** Algumas configurações requerem recarregamento do navegador para serem aplicadas.

## Configurações Disponíveis

| Configuração | Descrição |
|-------------|-----------|
| **Bloquear Rastreadores** | Bloqueia scripts e requisições de rastreamento conhecidos |
| **Bloquear Anúncios** | Remove anúncios e scripts publicitários |
| **Proteção contra Fingerprinting** | Modifica APIs para prevenir identificação única |
| **Bloquear Cookies de Terceiros** | Impede cookies de domínios externos |
| **Bloquear Scripts de Terceiros** | Bloqueia todos os scripts externos (pode quebrar alguns sites) |
| **HTTPS Apenas** | Redireciona HTTP para HTTPS automaticamente |
| **Enviar Do Not Track** | Adiciona cabeçalho DNT em todas as requisições |
| **Limpar Dados ao Fechar** | Remove cookies e cache ao fechar o navegador |
| **Proteger WebGL** | Modifica informações do WebGL |
| **Proteger Canvas** | Bloqueia técnicas de fingerprinting via Canvas |
| **Proteger Web Audio** | Protege contra fingerprinting via Web Audio API |
| **Bloquear Notificações** | Bloqueia todas as solicitações de notificações |
| **Bloquear Geolocalização** | Bloqueia todas as solicitações de geolocalização |

## Segurança

Este navegador implementa várias camadas de segurança:

- **Context Isolation** - Isola o código Node.js do código da página web
- **Sandbox** - Executa páginas web em ambiente isolado
- **No Node Integration** - Previne acesso direto ao Node.js
- **Web Security** - Habilita todas as proteções de segurança do Chromium
- **Content Security Policy** - Política de segurança de conteúdo

## Notas Importantes

- Algumas configurações agressivas (como bloquear scripts de terceiros) podem quebrar alguns sites
- O bloqueio de Canvas pode afetar sites que usam gráficos
- As estatísticas de privacidade são contadores locais e são resetadas ao recarregar

## Tecnologias

- **Electron** - Framework para aplicações desktop
- **React** - Biblioteca JavaScript para interfaces de usuário
- **Vite** - Build tool moderna e rápida
- **Node.js** - Runtime JavaScript
- **Chromium** - Engine de renderização (via Electron)

## Licença

MIT

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Aviso

Este navegador é um projeto de código aberto focado em privacidade. Use por sua conta e risco.

---

**Desenvolvido com foco em privacidade e segurança**
