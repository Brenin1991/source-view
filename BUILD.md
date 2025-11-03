# Como Gerar o Executável e Instalador

## Pré-requisitos

1. Certifique-se de que todas as dependências estão instaladas:
   ```bash
   npm install
   ```

2. **IMPORTANTE**: Crie um ícone para o aplicativo:
   - Windows: `assets/icon.png` (será convertido automaticamente)
   - macOS: `assets/icon.icns` (formato específico do macOS)
   - Linux: `assets/icon.png`
   - Tamanho recomendado: 256x256 ou 512x512 pixels

## Gerar o Executável e Instalador

### Para Windows:

```bash
npm run electron:build:win
```

Este comando irá:
1. Compilar o código React com Vite
2. Gerar o executável usando electron-builder
3. Criar arquivos na pasta `dist/`:
   - **Instalador NSIS**: `Catnip Secure Browser-1.0.0-x64-setup.exe` (instalador completo)
     - Permite escolher diretório de instalação
     - Cria atalhos na área de trabalho e no menu Iniciar
     - Opção de executar após instalação
     - Desinstalador incluído
   - **Portable**: `Catnip Secure Browser-1.0.0-x64-portable.exe` (executável portável, não precisa instalar)
   - **Versão 32-bit**: `Catnip Secure Browser-1.0.0-ia32-setup.exe` (se necessário)

**Recursos do Instalador Windows:**
- ✅ Instalador com interface gráfica (não é one-click)
- ✅ Permite escolher o diretório de instalação
- ✅ Cria atalho na área de trabalho
- ✅ Cria entrada no menu Iniciar
- ✅ Opção de executar o aplicativo após instalação
- ✅ Desinstalador incluído
- ✅ Categoria: Network (no menu Iniciar)

### Para macOS:

```bash
npm run electron:build:mac
```

Gera:
- **DMG**: `Catnip Secure Browser-1.0.0-x64.dmg` - Imagem de disco para instalação
- **ZIP**: `Catnip Secure Browser-1.0.0-x64.zip` - Versão compactada

### Para Linux:

**⚠️ IMPORTANTE**: Builds Linux devem ser feitos em um sistema Linux (ou WSL2 no Windows).

```bash
npm run electron:build:linux
```

Gera múltiplos formatos:
- **DEB**: `Catnip Secure Browser-1.0.0-amd64.deb` - Pacote Debian/Ubuntu
- **RPM**: `Catnip Secure Browser-1.0.0-x64.rpm` - Pacote Red Hat/Fedora

**Nota sobre builds no Windows:**
- Builds Linux no Windows requerem ferramentas específicas (fpm, Ruby) que podem não estar disponíveis
- Se você estiver no Windows, use WSL2 ou faça o build em uma máquina Linux

### Build genérico (todos os sistemas):

```bash
npm run electron:build
```

## Arquivos Gerados

Após a build, os arquivos estarão na pasta `dist/`:

- **Windows:**
  - `Catnip Secure Browser-1.0.0-x64-setup.exe` - Instalador completo (NSIS)
  - `Catnip Secure Browser-1.0.0-x64-portable.exe` - Versão portável
  - `Catnip Secure Browser-1.0.0-ia32-setup.exe` - Instalador 32-bit (se necessário)

- **macOS:**
  - `Catnip Secure Browser-1.0.0-x64.dmg` - Imagem de disco
  - `Catnip Secure Browser-1.0.0-x64.zip` - Versão compactada

- **Linux:**
  - `Catnip Secure Browser-1.0.0-x64.AppImage` - Executável universal
  - `Catnip Secure Browser-1.0.0-x64.deb` - Pacote Debian
  - `Catnip Secure Browser-1.0.0-x64.rpm` - Pacote RPM

## Notas Importantes

1. **Primeira vez pode demorar**: A primeira build baixa o Electron e ferramentas necessárias
2. **Tamanho do executável**: Aproximadamente 100-200 MB (inclui Chromium/Electron)
3. **Ícone**: Se você não criar o `icon.ico`, o electron-builder usará um ícone padrão

## Resolução de Problemas

### Erro de ícone não encontrado:
Crie o arquivo `assets/icon.ico` ou remova a referência ao ícone no `package.json`

### Erro de build:
- Verifique se o Vite build funcionou: `npm run build`
- Verifique se todas as dependências estão instaladas
- Limpe a pasta `dist` e tente novamente

