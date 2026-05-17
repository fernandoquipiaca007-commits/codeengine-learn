# 🎯 Store Consistency & Member Experience Rules

**Data**: 12 de Maio de 2026  
**Objetivo**: Diferenciar claramente visitantes vs membros e criar experiência premium contextual

---

## 🎭 VISITOR VS MEMBER CONSISTENCY

### Visitantes (Não Logados)
**Mostrar**:
- Entrar
- Tornar-se Membro
- Receber Novidades
- Ativar Notificações
- Criar Conta

**Objetivo**: Converter visitantes em membros

### Membros Logados
**Remover automaticamente**:
- ❌ "Tornar-se Membro"
- ❌ "Receber Novidades"
- ❌ "Ativar Notificações"

**Substituir por**:
- ✅ Meu Perfil
- ✅ Painel
- ✅ Favoritos
- ✅ Notificações (ícone com badge)
- ✅ Minha Biblioteca

---

## 🔔 NOTIFICATION SYSTEM

### Problema Atual
❌ Ao clicar em notificações, tela fica preta

### Solução
✅ Criar dropdown premium de notificações

### Notification Dropdown
**Conteúdo**:
- Novos ebooks
- Novos lançamentos
- Novidades
- Notícias
- Promoções
- Atualizações

**Cada notificação tem**:
- Thumbnail
- Título
- Descrição curta
- Data
- Categoria
- CTA

### Notification Redirect
Ao clicar: redirecionar para o conteúdo relacionado

---

## 📰 NEWS SYSTEM

### Nova Funcionalidade
**Criar sistema de notícias premium**

### Objetivo
Transformar a plataforma em:
- Hub de conhecimento
- Ecossistema vivo
- Plataforma ativa
- Ambiente tecnológico

### News Page
**Abas**:
- Notícias
- Publicações

**Acesso**: Apenas membros logados

### Tipos de Conteúdo
- Novidades de IA
- Lançamentos tecnológicos
- Automações
- Ferramentas novas
- Updates importantes
- Novidades do mercado
- Tendências
- Inovação
- Produtividade
- SaaS
- Programação

---

## 🗄️ DATABASE CHANGES

### Nova Tabela: news
```sql
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  category VARCHAR(50) NOT NULL,
  tags TEXT[],
  author VARCHAR(100),
  published_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Atualizar Tabela: notifications
```sql
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
```

---

## 🎨 IMPLEMENTATION CHECKLIST

### Phase 1: Fix Notifications
- [ ] Criar NotificationDropdown component
- [ ] Integrar com tabela notifications
- [ ] Adicionar thumbnails
- [ ] Adicionar redirect logic
- [ ] Remover tela preta

### Phase 2: Member Consistency
- [ ] Remover CTAs redundantes para membros
- [ ] Adicionar badge de notificações
- [ ] Mostrar contador de não lidas
- [ ] Auto-ativar notificações para membros

### Phase 3: News System
- [ ] Criar tabela news no banco
- [ ] Criar News page (Store)
- [ ] Criar News management (Admin)
- [ ] Integrar com notificações
- [ ] Member-only access

### Phase 4: Dynamic Behavior
- [ ] Store reage ao auth state
- [ ] Menus contextuais
- [ ] CTAs contextuais
- [ ] Mensagens contextuais
- [ ] Recomendações personalizadas

---

## 🎯 FINAL OBJECTIVE

A plataforma deve parecer:
- ✅ Inteligente
- ✅ Viva
- ✅ Contextual
- ✅ Premium
- ✅ Altamente profissional

Nada deve parecer:
- ❌ Estático
- ❌ Genérico
- ❌ Repetitivo
- ❌ Inconsistente

O sistema deve sempre reconhecer:
> **Quem está fora e quem já faz parte do ecossistema**

---

## 📊 FLOW

```
ADMIN
  ↓ Cria notícia/notificação
SUPABASE
  ↓ Armazena
STORE
  ↓ Exibe para membros
MEMBERS
  ↓ Recebem notificação
  ↓ Clicam
  ↓ Acessam conteúdo
```

---

**Próximo passo**: Implementar Phase 1 - Fix Notifications
