# 🔧 Guia de Troubleshooting

## Problema: Tela em Branco / Nada Aparece

### ✅ Soluções Aplicadas

1. **Corrigido imports de componentes**
   - Removido lazy loading que estava causando problemas
   - Voltado para imports diretos

2. **CSS restaurado**
   - Mantidas todas as classes utilitárias necessárias
   - Font loading otimizado

3. **Verificações realizadas**
   - ✅ TypeScript sem erros
   - ✅ Servidor rodando corretamente
   - ✅ Hot Module Replacement funcionando

---

## Como Verificar se Está Funcionando

### 1. Abra o navegador
Acesse: **http://localhost:3000/**

### 2. Abra o Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá para a aba "Console"
- Verifique se há erros em vermelho

### 3. Verifique a aba Network
- Abra DevTools > Network
- Recarregue a página (`Ctrl+R`)
- Verifique se os arquivos estão carregando:
  - `main.tsx` - ✅ deve estar 200 OK
  - `index.css` - ✅ deve estar 200 OK
  - Fontes do Google - ✅ devem carregar

---

## Problemas Comuns e Soluções

### ❌ Erro: "Cannot find module"
**Solução:**
```bash
npm install
```

### ❌ Erro: Porta 3000 já em uso
**Solução:**
```bash
# Pare o processo atual
# Pressione Ctrl+C no terminal

# Ou use outra porta
npm run dev -- --port 3001
```

### ❌ Tela preta mas sem erros
**Solução:**
1. Limpe o cache do navegador (`Ctrl+Shift+Delete`)
2. Recarregue com cache limpo (`Ctrl+F5`)
3. Tente em modo anônimo

### ❌ Fontes não carregam
**Solução:**
- Verifique sua conexão com internet
- As fontes vêm do Google Fonts
- Em caso de bloqueio, o site usará fontes do sistema

### ❌ Background 3D não aparece
**Solução:**
- Verifique se seu navegador suporta WebGL
- Teste em: https://get.webgl.org/
- Use um navegador moderno (Chrome, Firefox, Edge)

---

## Comandos Úteis

### Reiniciar o servidor
```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

### Limpar cache e reinstalar
```bash
# Limpar node_modules
rm -rf node_modules
rm package-lock.json

# Reinstalar
npm install
```

### Build de produção
```bash
npm run build
npm run preview
```

### Verificar erros TypeScript
```bash
npm run lint
```

---

## Otimizações Mantidas

Mesmo após corrigir o problema, estas otimizações continuam ativas:

✅ **Background 3D otimizado**
- Menos partículas (3000 em vez de 5000)
- Memoização de cálculos
- Performance degradation

✅ **Imagens otimizadas**
- Lazy loading
- Async decoding
- Preconnect para CDN

✅ **Fontes otimizadas**
- Font-display: swap
- Preconnect para Google Fonts

✅ **Build otimizado**
- Code splitting por vendor
- Minificação
- Chunks otimizados

✅ **HTML otimizado**
- Meta tags
- Preconnect
- DNS prefetch

---

## Status Atual

🟢 **Servidor:** Rodando em http://localhost:3000/
🟢 **TypeScript:** Sem erros
🟢 **Build:** Configurado e otimizado
🟢 **Performance:** Otimizações ativas

---

## Próximos Passos

1. **Teste no navegador**
   - Abra http://localhost:3000/
   - Navegue entre as páginas
   - Verifique se tudo está funcionando

2. **Teste de performance**
   ```bash
   npm run build
   npm run preview
   ```
   - Abra Chrome DevTools
   - Execute Lighthouse audit
   - Verifique os scores

3. **Deploy**
   - Quando estiver satisfeito, faça o build
   - Deploy para seu servidor/hosting preferido

---

**Última atualização:** 2026-05-12
