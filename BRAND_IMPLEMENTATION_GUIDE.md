# 🎨 CODEENGINE LEARN - BRAND IMPLEMENTATION GUIDE

## 🎯 OBJETIVO

Este guia garante que **todos os componentes** da CodeEngine Learn sigam a **identidade premium** da marca.

---

## 🎨 DESIGN TOKENS

### Cores Oficiais
```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Background layers
        background: '#0a0a0f',
        'surface-lowest': '#12121a',
        'surface-low': '#1a1a24',
        surface: '#22222e',
        'surface-high': '#2a2a38',
        'surface-highest': '#323242',
        'surface-container': '#1e1e2a',
        
        // Brand colors
        primary: '#c0c1ff',
        secondary: '#ffd6a5',
        'tertiary-container': '#a8dadc',
        
        // Text colors
        'on-surface': '#e8e8f0',
        'on-surface-variant': '#b8b8c8',
        'on-primary': '#0a0a0f',
        
        // Borders
        outline: '#3a3a48',
      },
    },
  },
}
```

### Tipografia Oficial
```typescript
fontFamily: {
  display: ['Inter', 'sans-serif'],  // Headings
  sans: ['Inter', 'sans-serif'],     // Body
  mono: ['JetBrains Mono', 'monospace'], // Code
}
```

### Espaçamento Premium
```typescript
// Use múltiplos de 4px para consistência
spacing: {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
}
```

---

## 🎭 COMPONENTES PREMIUM

### Glass Panel (Padrão)
```tsx
// ✅ USE SEMPRE para cards e containers
<div className="glass-panel rounded-2xl p-8 border border-white/10 hover:border-primary/30 transition-all">
  {/* Conteúdo */}
</div>

// CSS (já está em index.css)
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

### Headings Premium
```tsx
// Hero Title (72px)
<h1 className="font-display text-[72px] leading-[1.1] tracking-[-0.04em] font-extrabold text-on-surface">
  Título Principal
</h1>

// Section Title (48px)
<h2 className="font-display text-5xl font-bold tracking-tight text-on-surface">
  Título de Seção
</h2>

// Card Title (24px)
<h3 className="font-display text-2xl font-semibold text-on-surface">
  Título de Card
</h3>
```

### Body Text Premium
```tsx
// Large body (18px)
<p className="font-sans text-lg text-on-surface-variant">
  Texto principal
</p>

// Regular body (16px)
<p className="font-sans text-base text-on-surface-variant">
  Texto secundário
</p>

// Small text (14px)
<p className="font-sans text-sm text-on-surface-variant">
  Texto pequeno
</p>
```

### Buttons Premium
```tsx
// Primary Button
<button className="bg-on-surface text-background font-display text-xl font-bold px-8 py-4 rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(192,193,255,0.3)] group">
  Comprar Agora
  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
</button>

// Secondary Button
<button className="secondary-btn px-6 py-3 rounded-full font-display text-sm font-semibold tracking-widest uppercase">
  Ver Mais
</button>

// CSS (já está em index.css)
.secondary-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}
.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary);
}
```

### Input Fields Premium
```tsx
<input
  type="text"
  placeholder="Digite aqui..."
  className="w-full px-4 py-3 bg-surface-container border border-outline/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface placeholder-on-surface-variant/50 transition-all"
/>
```

### Badges Premium
```tsx
// Status badge
<span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-primary/30">
  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
  <span className="font-display text-xs font-semibold tracking-widest uppercase text-primary">
    Produto Premium
  </span>
</span>
```

---

## ✨ ANIMAÇÕES PREMIUM

### Hover Effects
```tsx
// Card hover
<div className="glass-panel hover:bg-surface-high/50 transition-colors group">
  <div className="group-hover:scale-110 transition-transform">
    {/* Conteúdo */}
  </div>
</div>

// Button hover
<button className="hover:translate-y-[-2px] hover:shadow-lg transition-all">
  Clique aqui
</button>
```

### Framer Motion (Recomendado)
```tsx
import { motion } from 'motion/react';

// Fade in
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Conteúdo */}
</motion.div>

// Stagger children
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.1 } }
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## 🎨 EFEITOS VISUAIS PREMIUM

### Gradients
```tsx
// Text gradient
<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
  Texto com Gradiente
</span>

// Background gradient
<div className="bg-gradient-to-br from-primary/20 to-secondary/20">
  {/* Conteúdo */}
</div>
```

### Glow Effects
```tsx
// Text glow
<h1 className="text-primary drop-shadow-[0_0_12px_rgba(192,193,255,0.4)]">
  Título Brilhante
</h1>

// Box glow
<div className="shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(192,193,255,0.3)]">
  {/* Conteúdo */}
</div>
```

### Blur Effects
```tsx
// Background blur
<div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full mix-blend-screen z-0 pointer-events-none"></div>
```

---

## 📐 LAYOUT PATTERNS

### Container Premium
```tsx
<div className="pt-40 pb-24 px-6 md:px-16 max-w-[1280px] mx-auto min-h-screen">
  {/* Conteúdo */}
</div>
```

### Section Premium
```tsx
<section className="mt-24">
  <div className="text-center mb-16">
    <h2 className="font-display text-5xl font-bold tracking-tight text-on-surface mb-4">
      Título da Seção
    </h2>
    <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
      Descrição da seção
    </p>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Cards */}
  </div>
</section>
```

### Grid Premium
```tsx
// 3 colunas responsivo
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {items.map((item) => (
    <div key={item.id} className="glass-panel p-6 rounded-2xl">
      {/* Card content */}
    </div>
  ))}
</div>

// 2 colunas responsivo
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  {/* Conteúdo */}
</div>
```

---

## 🎯 MENSAGENS PREMIUM

### Success Messages
```tsx
<div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
  <p className="font-sans text-sm text-green-500">
    ✅ Operação realizada com sucesso!
  </p>
</div>
```

### Error Messages
```tsx
<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
  <p className="font-sans text-sm text-red-500">
    ❌ Erro ao processar. Tente novamente.
  </p>
</div>
```

### Info Messages
```tsx
<div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
  <p className="font-sans text-sm text-blue-500">
    💡 Dica: Use cupons para descontos exclusivos!
  </p>
</div>
```

---

## 🚫 O QUE EVITAR

### ❌ NÃO USE:
```tsx
// Cores genéricas
className="bg-white text-black"
className="bg-gray-100 text-gray-900"

// Bordas simples
className="border border-gray-300"

// Sombras básicas
className="shadow-md"

// Tipografia genérica
className="text-xl font-bold"

// Espaçamento inconsistente
className="p-3 m-2"
```

### ✅ USE:
```tsx
// Cores da marca
className="bg-surface-container text-on-surface"
className="glass-panel text-on-surface"

// Bordas premium
className="border border-white/10"
className="border border-primary/30"

// Sombras cinematográficas
className="shadow-[0_0_20px_rgba(255,255,255,0.1)]"

// Tipografia premium
className="font-display text-2xl font-semibold"

// Espaçamento consistente
className="p-6 md:p-8"
```

---

## 📋 CHECKLIST DE QUALIDADE

Antes de criar um novo componente, verifique:

### Design
- [ ] Usa glass-panel para containers
- [ ] Usa cores oficiais da marca
- [ ] Usa tipografia Inter (display/sans)
- [ ] Tem bordas arredondadas (rounded-xl ou rounded-2xl)
- [ ] Tem hover effects suaves
- [ ] Tem transições animadas

### Conteúdo
- [ ] Textos em português claro
- [ ] Mensagens elegantes e premium
- [ ] Evita linguagem genérica
- [ ] Transmite exclusividade

### Responsividade
- [ ] Funciona em mobile (320px+)
- [ ] Funciona em tablet (768px+)
- [ ] Funciona em desktop (1280px+)
- [ ] Grid adapta colunas

### Performance
- [ ] Imagens otimizadas
- [ ] Lazy loading quando necessário
- [ ] Animações 60fps
- [ ] Sem re-renders desnecessários

### Acessibilidade
- [ ] Contraste adequado
- [ ] ARIA labels quando necessário
- [ ] Navegação por teclado
- [ ] Focus states visíveis

---

## 🎨 EXEMPLOS COMPLETOS

### Card Premium Completo
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-primary/30 hover:bg-surface-high/50 transition-all group relative overflow-hidden"
>
  {/* Glow effect */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50"></div>
  
  {/* Icon */}
  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-white/10 text-primary mb-6 relative z-10">
    <Terminal className="w-6 h-6" />
  </div>
  
  {/* Content */}
  <div className="relative z-10">
    <h3 className="font-display text-2xl font-semibold text-on-surface mb-2">
      Título do Card
    </h3>
    <p className="font-sans text-base text-on-surface-variant">
      Descrição elegante e premium do conteúdo.
    </p>
  </div>
</motion.div>
```

### Form Premium Completo
```tsx
<form className="space-y-6">
  <div>
    <label className="block font-display text-sm font-medium text-on-surface mb-2">
      Nome Completo
    </label>
    <input
      type="text"
      placeholder="Digite seu nome"
      className="w-full px-4 py-3 bg-surface-container border border-outline/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface placeholder-on-surface-variant/50 transition-all"
    />
  </div>
  
  <button
    type="submit"
    className="w-full bg-on-surface text-background font-display text-lg font-bold px-8 py-4 rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(192,193,255,0.3)]"
  >
    Enviar
  </button>
</form>
```

---

## 🚀 PRÓXIMOS PASSOS

### Para manter a consistência:
1. ✅ Use este guia como referência
2. ✅ Copie componentes existentes como base
3. ✅ Teste em múltiplos dispositivos
4. ✅ Peça feedback sobre a experiência
5. ✅ Itere baseado em dados reais

---

## 📞 SUPORTE

Dúvidas sobre implementação?
- Email: codeengine2@gmail.com
- WhatsApp: +244 957 459 336

---

**CodeEngine Learn - Premium Digital Knowledge Ecosystem**
**Desenvolvido seguindo os mais altos padrões de design e tecnologia**
