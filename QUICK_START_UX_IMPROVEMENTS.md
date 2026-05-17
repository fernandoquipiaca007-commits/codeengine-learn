# 🚀 Guia Rápido - Melhorias de UX

## ⚡ Instalação em 3 Passos

### 1️⃣ Executar Script SQL (2 minutos)

Abra o **Supabase SQL Editor** e execute:

```bash
supabase/ux-improvements-progress.sql
```

Ou via terminal:
```bash
# Substitua com suas credenciais
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/ux-improvements-progress.sql
```

**O que isso faz:**
- ✅ Cria tabela `learning_progress`
- ✅ Cria tabela `user_preferences`
- ✅ Cria tabelas `lessons` e `lesson_modules`
- ✅ Configura RLS (segurança)
- ✅ Cria funções auxiliares

---

### 2️⃣ Verificar Backend (5 minutos)

Certifique-se de que estas rotas existem no backend:

```javascript
// backend/routes/learning.js (ou similar)

// Stream de vídeo
GET /api/lessons/:lessonId/stream
// Retorna: { url: "https://..." }

// URL do e-book
GET /api/ebooks/:productId/read?lang=pt
// Retorna: { url: "https://...", format: "pdf" }

// Salvar progresso
PUT /api/progress
// Body: { product_id, lesson_id?, progress_type, position_seconds?, page_number?, ... }

// Obter progresso
GET /api/progress/:productId
// Retorna: { product, lessons, progress, lastProgress }
```

**Se não existirem**, crie-as seguindo o padrão do projeto.

---

### 3️⃣ Testar! (1 minuto)

Os componentes já estão integrados automaticamente! 

```tsx
// Já funciona automaticamente em:
// - src/components/member/MyLibrary.tsx
// - src/components/member/LearningHub.tsx
// - Qualquer lugar que use EbookReader ou CoursePlayer

import { EbookReader } from '@/components/member/EbookReader';
import { CoursePlayer } from '@/components/member/CoursePlayer';

// Usar normalmente - agora são as versões Pro!
<EbookReader productId={productId} onBack={() => navigate(-1)} />
<CoursePlayer productId={productId} onBack={() => navigate(-1)} />
```

---

## ✅ Checklist de Verificação

Após a instalação, verifique:

### Banco de Dados:
- [ ] Tabela `learning_progress` existe
- [ ] Tabela `user_preferences` existe
- [ ] Tabela `lessons` existe
- [ ] Tabela `lesson_modules` existe
- [ ] RLS policies ativas

**Verificar no Supabase:**
```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('learning_progress', 'user_preferences', 'lessons', 'lesson_modules');

-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('learning_progress', 'user_preferences');
```

### Frontend:
- [ ] Componentes `EbookReaderPro.tsx` e `CoursePlayerPro.tsx` existem
- [ ] Dependências instaladas (`react-pdf`, `pdfjs-dist`)
- [ ] Sem erros no console do navegador

### Backend:
- [ ] Rotas de learning API funcionando
- [ ] CORS configurado para storage
- [ ] Autenticação funcionando

---

## 🎯 Teste Rápido

### Teste 1: Leitor de E-books

1. Acesse um produto do tipo e-book
2. Clique para ler
3. Navegue entre páginas (← →)
4. Teste zoom (+ -)
5. Mude o tema (☀️ 🌙)
6. Feche e reabra (deve retomar da mesma página)

### Teste 2: Player de Vídeo

1. Acesse um curso em vídeo
2. Reproduza uma aula
3. Pause e avance 10s (→)
4. Mude a velocidade (Settings)
5. Navegue para próxima aula
6. Feche e reabra (deve retomar do mesmo ponto)

---

## 🐛 Problemas Comuns

### ❌ "PDF não carrega"

**Causa**: Worker do PDF.js não configurado

**Solução**: Já está configurado em `EbookReaderPro.tsx`:
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

---

### ❌ "Vídeo não reproduz"

**Causas possíveis:**
1. URL do vídeo inválida
2. CORS não configurado
3. Formato não suportado

**Solução**:
```sql
-- Verificar storage CORS no Supabase
-- Storage > Configuration > CORS
-- Adicionar: https://seu-dominio.com
```

---

### ❌ "Progresso não salva"

**Causas possíveis:**
1. Tabela não existe
2. RLS bloqueando
3. Backend não responde

**Solução**:
```sql
-- Verificar se tabela existe
SELECT COUNT(*) FROM learning_progress;

-- Verificar RLS
SELECT * FROM pg_policies WHERE tablename = 'learning_progress';

-- Testar manualmente
INSERT INTO learning_progress (member_id, product_id, progress_type, status)
VALUES ('seu-member-id', 'seu-product-id', 'video', 'in_progress');
```

---

## 📊 Monitoramento

### Ver progresso de um usuário:

```sql
SELECT 
  p.title as produto,
  lp.progress_type as tipo,
  lp.position_percent as progresso,
  lp.status,
  lp.last_accessed_at as ultimo_acesso
FROM learning_progress lp
JOIN products p ON lp.product_id = p.id
WHERE lp.member_id = 'SEU-MEMBER-ID'
ORDER BY lp.last_accessed_at DESC;
```

### Ver estatísticas gerais:

```sql
SELECT 
  progress_type,
  status,
  COUNT(*) as total
FROM learning_progress
GROUP BY progress_type, status
ORDER BY progress_type, status;
```

---

## 🎨 Personalização

### Mudar cores do tema:

Edite `src/components/member/EbookReaderPro.tsx`:

```typescript
const themeClasses = {
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 text-white',
  sepia: 'bg-[#f4ecd8] text-[#5c4a3a]',
  // Adicione seu tema aqui:
  custom: 'bg-blue-50 text-blue-900',
};
```

### Mudar velocidades do player:

Edite `src/components/member/CoursePlayerPro.tsx`:

```typescript
// Linha ~300
{[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
  // Adicione mais velocidades aqui
))}
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- **`UX_IMPROVEMENTS_IMPLEMENTATION.md`** - Documentação completa
- **`supabase/ux-improvements-progress.sql`** - Schema do banco
- **`src/components/member/EbookReaderPro.tsx`** - Código do leitor
- **`src/components/member/CoursePlayerPro.tsx`** - Código do player

---

## 🎉 Pronto!

Sua plataforma agora tem:
- ✅ Leitor de PDF profissional com zoom, temas e marcadores
- ✅ Player de vídeo moderno com controles avançados
- ✅ Sistema de progresso automático
- ✅ Retomar de onde parou
- ✅ Interface responsiva e acessível

**Aproveite! 🚀**

---

**Dúvidas?** Consulte `UX_IMPROVEMENTS_IMPLEMENTATION.md`
