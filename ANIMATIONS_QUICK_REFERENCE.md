# 🎬 Quick Reference — Animate.css no Seu Projeto

## Como Usar Animações em Novos Componentes

### **Opção 1: Classe Simples (Recomendado para Títulos)**
```jsx
import { motion } from 'motion/react';

<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
  className="animate__animated animate__fadeInDown"
>
  Meu Título
</motion.h1>
```

### **Opção 2: Staggered Grid (Para Cards/Listas)**
```jsx
<motion.div 
  className="grid grid-cols-3 gap-4"
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,      // Delay entre itens (100ms)
        delayChildren: 0.3,        // Delay antes de começar (300ms)
      },
    },
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="animate__animated animate__slideInUp"
    >
      {item.title}
    </motion.div>
  ))}
</motion.div>
```

---

## Animações Disponíveis

```
✨ FADE
  fadeIn, fadeInDown, fadeInUp, fadeInLeft, fadeInRight

↕️ SLIDE
  slideInDown, slideInUp, slideInLeft, slideInRight

🔍 ZOOM
  zoomIn, zoomInDown, zoomInUp

⚡ ATENÇÃO
  pulse (contínuo), bounce, rubberBand, shake, swing

🔄 ROTAÇÕES
  rotateIn, rotateInDownLeft, rotateInDownRight

🎭 FLIPS
  flipInX, flipInY
```

---

## Padrões Estratégicos por Tipo de Elemento

### **H1 Títulos Principais**
```jsx
animate__animated animate__fadeInDown
```
✓ Entrada clássica de topo  
✓ Garante destaque

---

### **H2 Seções**
```jsx
animate__animated animate__slideInLeft    // Esquerda
animate__animated animate__slideInRight   // Direita
animate__animated animate__slideInDown    // Baixo
```
✓ Movimento que guia olho  
✓ Diferencia seções

---

### **Cards em Grid**
```jsx
Staggered + animate__slideInUp
```
✓ Entrada sequencial elegante  
✓ Não sobrecarrega visual

---

### **CTA Buttons**
```jsx
animate__animated animate__pulse
```
✓ Atrai atenção  
✓ Sugere ação

---

### **Subtítulos/Descrições**
```jsx
animate__animated animate__fadeInUp
```
✓ Suave e refinada  
✓ Acompanha H1

---

## Delays Recomendados

| Elemento | Delay Base | Stagger |
|----------|-----------|---------|
| H1 | 0ms | — |
| Subtitle | 100ms | — |
| CTA Button | 200ms | — |
| Section H2 | 200ms | — |
| Cards Grid | 300ms | 100ms |
| Stat Boxes | 300ms | 100ms |

---

## Import Necessário em Todo Arquivo

```jsx
import { motion } from 'motion/react';
```

O Animate.css é automaticamente importado globalmente via `index.css`.

---

## Exemplo Completo: Nova Página

```jsx
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export function MinhaNovaPage() {
  const { t } = useTranslation();

  return (
    <div className="pt-40 pb-24 px-4 max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="animate__animated animate__fadeInDown text-5xl font-bold mb-4"
      >
        {t('page.title')}
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="animate__animated animate__fadeInUp text-xl text-on-surface-variant mb-12"
      >
        {t('page.subtitle')}
      </motion.p>

      {/* Cards Grid */}
      <motion.div 
        className="grid md:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 }
          }
        }}
      >
        {items.map((item) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="glass-panel rounded-xl p-6 animate__animated animate__slideInUp"
          >
            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p>{item.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
```

---

## Troubleshooting

❌ **Animação não aparece?**  
✓ Certifique-se que tem `animate__animated` + `animate__[nome]`  
✓ Verifique `@import "animate.css"` em `index.css`

❌ **Muito rápido/lento?**  
✓ Ajuste `transition={{ duration: 0.6 }}` (0.3 rápido, 1.0 lento)

❌ **Mobile lag?**  
✓ Reduza duração em mobile  
✓ Use apenas `opacity` e `transform`

---

## Performance Tips ⚡

✅ Sempre use `transform` + `opacity` (GPU optimized)  
✅ Evite animar: `width`, `height`, `position`  
✅ Stagger máx 100-150ms entre itens  
✅ Respei `prefers-reduced-motion` (já implementado)  

---

**Última atualização:** 22 de Maio de 2026  
**Status:** ✅ Pronto para uso
