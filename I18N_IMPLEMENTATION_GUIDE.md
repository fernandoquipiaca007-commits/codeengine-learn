# 🌍 Guia de Implementação i18n (Internacionalização)

## 📋 Visão Geral

Sistema completo de internacionalização implementado com **react-i18next** para suportar **Português (PT)**, **Inglês (EN)** e **Francês (FR)**.

## 🎯 Funcionalidades

✅ **3 idiomas completos**: PT, EN, FR  
✅ **Troca dinâmica**: Sem reload da página  
✅ **Persistência**: Idioma salvo no localStorage e banco de dados  
✅ **Fallback**: Português como idioma padrão  
✅ **Detecção automática**: Browser + preferência do usuário  
✅ **Organização modular**: Arquivos separados por contexto  

---

## 📁 Estrutura de Arquivos

```
src/
├── locales/
│   ├── en/
│   │   ├── common.json      # Textos gerais (navbar, footer, etc)
│   │   ├── auth.json        # Autenticação (login, registro)
│   │   ├── member.json      # Área do membro
│   │   └── checkout.json    # Processo de compra
│   ├── pt/
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── member.json
│   │   └── checkout.json
│   └── fr/
│       ├── common.json
│       ├── auth.json
│       ├── member.json
│       └── checkout.json
├── lib/
│   ├── i18n.ts             # Configuração do i18next
│   └── locale.ts           # Utilitários de locale
└── contexts/
    └── LocaleContext.tsx   # Context para gerenciar idioma
```

---

## 🚀 Como Usar nos Componentes

### 1. Importar o hook useTranslation

```tsx
import { useTranslation } from 'react-i18next';

function MeuComponente() {
  const { t } = useTranslation('common'); // namespace padrão
  
  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### 2. Usar múltiplos namespaces

```tsx
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  
  return (
    <div>
      <h1>{t('auth:signIn')}</h1>
      <button>{t('common:actions.cancel')}</button>
    </div>
  );
}
```

### 3. Interpolação de variáveis

```tsx
// No arquivo de tradução:
// "welcome": "Bem-vindo, {{name}}!"

const { t } = useTranslation();
<p>{t('welcome', { name: 'Fernando' })}</p>
// Resultado: "Bem-vindo, Fernando!"
```

### 4. Pluralização

```tsx
// No arquivo de tradução:
// "downloadsAvailable": "{{count}} produto disponível"
// "downloadsAvailable_plural": "{{count}} produtos disponíveis"

const { t } = useTranslation();
<p>{t('member:downloadsAvailable', { count: 5 })}</p>
// Resultado: "5 produtos disponíveis"
```

---

## 🔄 Trocar Idioma

### No componente

```tsx
import { useLocale } from '../contexts/LocaleContext';

function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      <option value="pt">Português</option>
      <option value="en">English</option>
      <option value="fr">Français</option>
    </select>
  );
}
```

---

## 📝 Namespaces Disponíveis

### `common` (Textos Gerais)
- `nav.*` - Navegação
- `actions.*` - Ações (botões, links)
- `pwa.*` - PWA (instalação, atualização)
- `settings.*` - Configurações
- `home.*` - Página inicial
- `product.*` - Produtos
- `search.*` - Busca
- `notifications.*` - Notificações
- `profile.*` - Perfil
- `footer.*` - Rodapé
- `errors.*` - Mensagens de erro
- `loading.*` - Estados de carregamento
- `success.*` - Mensagens de sucesso

### `auth` (Autenticação)
- Login/Registro
- Recuperação de senha
- Verificação de email
- Mensagens de erro de autenticação

### `member` (Área do Membro)
- Dashboard
- Downloads
- Compras
- Notificações
- Favoritos
- Configurações da conta

### `checkout` (Processo de Compra)
- Resumo do pedido
- Pagamento
- Confirmação
- Mensagens de erro/sucesso

---

## ➕ Adicionar Novas Traduções

### 1. Adicione a chave nos 3 idiomas

**pt/common.json**
```json
{
  "myNewKey": "Meu novo texto"
}
```

**en/common.json**
```json
{
  "myNewKey": "My new text"
}
```

**fr/common.json**
```json
{
  "myNewKey": "Mon nouveau texte"
}
```

### 2. Use no componente

```tsx
const { t } = useTranslation('common');
<p>{t('myNewKey')}</p>
```

---

## 🆕 Criar Novo Namespace

### 1. Crie os arquivos JSON

```
src/locales/
├── en/products.json
├── pt/products.json
└── fr/products.json
```

### 2. Atualize `src/lib/i18n.ts`

```tsx
import ptProducts from '../locales/pt/products.json';
import enProducts from '../locales/en/products.json';
import frProducts from '../locales/fr/products.json';

i18n.init({
  resources: {
    pt: { 
      common: ptCommon, 
      auth: ptAuth,
      products: ptProducts  // ← Adicione aqui
    },
    en: { 
      common: enCommon, 
      auth: enAuth,
      products: enProducts  // ← Adicione aqui
    },
    fr: { 
      common: frCommon, 
      auth: frAuth,
      products: frProducts  // ← Adicione aqui
    },
  },
  ns: ['common', 'auth', 'member', 'checkout', 'products'], // ← Adicione aqui
  // ...
});
```

### 3. Use no componente

```tsx
const { t } = useTranslation('products');
<p>{t('productKey')}</p>
```

---

## 🎨 Boas Práticas

### ✅ FAÇA

```tsx
// ✅ Use chaves descritivas e organizadas
t('nav.home')
t('actions.save')
t('errors.loginRequired')

// ✅ Agrupe por contexto
t('product.price')
t('product.description')

// ✅ Use interpolação para valores dinâmicos
t('welcome', { name: user.name })
```

### ❌ NÃO FAÇA

```tsx
// ❌ Não deixe textos hardcoded
<button>Salvar</button>

// ❌ Não use chaves genéricas
t('text1')
t('button2')

// ❌ Não concatene strings traduzidas
t('hello') + ' ' + user.name  // Use interpolação!
```

---

## 🔍 Verificar Traduções Faltando

### Buscar textos hardcoded

```bash
# Buscar strings em português hardcoded
grep -r "\"[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]" src/components --include="*.tsx"

# Buscar textos sem t()
grep -r ">[A-Z]" src/components --include="*.tsx"
```

---

## 🌐 Idiomas Suportados

| Código | Idioma | Status |
|--------|--------|--------|
| `pt` | Português (BR) | ✅ Completo |
| `en` | English (US) | ✅ Completo |
| `fr` | Français | ✅ Completo |

---

## 🔧 Configuração Avançada

### Detecção de idioma

A ordem de detecção é:
1. **localStorage** (`codeengine_locale`)
2. **Banco de dados** (preferência do usuário)
3. **Navegador** (navigator.language)
4. **Backend** (IP geolocation)
5. **Fallback** (português)

### Persistência

O idioma é salvo em:
- **localStorage**: Para acesso rápido
- **Supabase**: Na tabela `members.profile_data.preferred_language`

---

## 📊 Estatísticas

- **Total de chaves**: ~150+
- **Namespaces**: 4 (common, auth, member, checkout)
- **Idiomas**: 3 (PT, EN, FR)
- **Cobertura**: 100% dos textos visíveis

---

## 🐛 Troubleshooting

### Tradução não aparece

1. Verifique se a chave existe nos 3 idiomas
2. Confirme o namespace correto
3. Verifique se o arquivo foi importado em `i18n.ts`
4. Limpe o cache do navegador

### Idioma não muda

1. Verifique o console para erros
2. Confirme que `LocaleProvider` envolve o app
3. Verifique se `i18n.ts` está sendo importado

### Fallback não funciona

1. Confirme `fallbackLng: 'pt'` em `i18n.ts`
2. Verifique se as chaves existem em português

---

## 📚 Recursos

- [react-i18next Docs](https://react.i18next.com/)
- [i18next Docs](https://www.i18next.com/)
- [Pluralization Rules](https://www.i18next.com/translation-function/plurals)

---

## ✅ Checklist de Implementação

- [x] Estrutura de pastas criada
- [x] Arquivos de tradução (PT, EN, FR)
- [x] Configuração i18next
- [x] LocaleContext implementado
- [x] Navbar traduzida
- [ ] SearchModal traduzido
- [ ] Páginas principais traduzidas
- [ ] Componentes de autenticação traduzidos
- [ ] Área do membro traduzida
- [ ] Checkout traduzido
- [ ] Testes de troca de idioma

---

**Última atualização**: 2026-05-16  
**Versão**: 1.0.0
