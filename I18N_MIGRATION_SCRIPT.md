# 🔄 Script de Migração i18n - Traduções Pendentes

## 📊 Status Atual

### ✅ Componentes Traduzidos
- [x] Navbar.tsx (parcial)
- [x] SearchModal.tsx
- [x] UpdatePrompt.tsx
- [x] PwaInstallBanner.tsx
- [x] PushPermissionPrompt.tsx

### ⏳ Componentes Pendentes

#### 🔴 ALTA PRIORIDADE (Páginas Principais)

1. **src/pages/Terms.tsx**
   - Textos: "Termos de Uso", "Termos e Condições", "Uso Permitido", etc.
   - Namespace: `pages:terms.*`

2. **src/pages/Success.tsx**
   - Textos: "Pagamento Confirmado!", "Verifique seu Email", etc.
   - Namespace: `pages:success.*`

3. **src/pages/Cancel.tsx**
   - Textos: "Compra Cancelada", etc.
   - Namespace: `pages:cancel.*`

4. **src/pages/Settings.tsx**
   - Textos: "Configurações", "Informações Pessoais", etc.
   - Namespace: `pages:settings.*`

5. **src/pages/Contact.tsx**
   - Textos: "Contato", "Nome", "Email", "Mensagem", etc.
   - Namespace: `pages:contact.*`

6. **src/pages/About.tsx**
   - Textos: "Sobre", "Nossa Missão", etc.
   - Namespace: `pages:about.*`

7. **src/pages/Licensing.tsx**
   - Textos: "Licenciamento", "Uso Pessoal", etc.
   - Namespace: `pages:licensing.*`

#### 🟡 MÉDIA PRIORIDADE (Componentes de Membro)

8. **src/components/member/DownloadList.tsx**
   - Textos: "Meus Downloads", "Baixar", etc.
   - Namespace: `member:*`

9. **src/components/NotificationDropdown.tsx**
   - Textos: "Notificações", "Marcar como lida", etc.
   - Namespace: `common:notifications.*`

10. **src/pages/MemberArea.tsx**
    - Textos: "Área do Membro", "Dashboard", etc.
    - Namespace: `member:*`

#### 🟢 BAIXA PRIORIDADE (Outros)

11. **src/pages/Home.tsx**
    - Textos: Hero, categorias, etc.
    - Namespace: `common:home.*`

12. **src/pages/Library.tsx**
    - Textos: "Biblioteca", filtros, etc.
    - Namespace: `common:*`

13. **src/pages/Releases.tsx**
    - Textos: "Lançamentos", etc.
    - Namespace: `common:*`

14. **src/pages/News.tsx**
    - Textos: "Notícias", etc.
    - Namespace: `common:*`

15. **src/pages/ProductDetail.tsx**
    - Textos: detalhes do produto
    - Namespace: `common:product.*`

---

## 🛠️ Comandos de Busca

### Encontrar textos hardcoded em português
```bash
# Buscar textos em português (maiúsculas)
grep -r "\"[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]" src/pages --include="*.tsx" | grep -v "className"

# Buscar textos entre tags JSX
grep -r ">[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]" src/pages --include="*.tsx"

# Buscar placeholders
grep -r "placeholder=\"" src --include="*.tsx"

# Buscar títulos
grep -r "title=\"" src --include="*.tsx"
```

---

## 📝 Template de Conversão

### Antes (Hardcoded)
```tsx
<h1>Termos e Condições</h1>
<p>Ao utilizar a CodeEngine Learn...</p>
<button>Fale Conosco</button>
```

### Depois (Traduzido)
```tsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation('pages');
  
  return (
    <>
      <h1>{t('terms.heading')}</h1>
      <p>{t('terms.description')}</p>
      <button>{t('terms.contactUs')}</button>
    </>
  );
}
```

---

## 🎯 Próximos Passos

### Fase 1: Páginas Principais (URGENTE)
```bash
# 1. Terms.tsx
# 2. Success.tsx
# 3. Cancel.tsx
# 4. Settings.tsx
# 5. Contact.tsx
```

### Fase 2: Área do Membro
```bash
# 6. DownloadList.tsx
# 7. NotificationDropdown.tsx
# 8. MemberArea.tsx
```

### Fase 3: Páginas Secundárias
```bash
# 9. Home.tsx
# 10. Library.tsx
# 11. Releases.tsx
# 12. ProductDetail.tsx
```

---

## 🔍 Checklist de Verificação

Para cada componente traduzido:

- [ ] Importar `useTranslation`
- [ ] Definir namespace correto
- [ ] Substituir TODOS os textos hardcoded
- [ ] Testar em PT, EN e FR
- [ ] Verificar interpolação de variáveis
- [ ] Verificar pluralização (se aplicável)
- [ ] Testar responsividade
- [ ] Commit com mensagem descritiva

---

## 📈 Progresso Estimado

- **Total de componentes**: ~30
- **Traduzidos**: ~5 (17%)
- **Pendentes**: ~25 (83%)
- **Tempo estimado**: 4-6 horas

---

## 🚀 Automação Sugerida

### Script para encontrar todos os textos hardcoded:

```bash
# Criar lista de todos os textos para traduzir
find src -name "*.tsx" -exec grep -H ">[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][^<]*<" {} \; > hardcoded-texts.txt
```

### Priorização:
1. Páginas acessadas por usuários não logados (Home, About, Contact)
2. Páginas de checkout e sucesso (críticas para conversão)
3. Área do membro (alta frequência de uso)
4. Componentes auxiliares

---

**Última atualização**: 2026-05-16  
**Responsável**: Sistema i18n CodeEngine Learn
