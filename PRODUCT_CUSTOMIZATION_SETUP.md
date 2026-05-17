# 🎨 PRODUCT PAGE CUSTOMIZATION SYSTEM - SETUP GUIDE

## 📋 OVERVIEW

Sistema completo de personalização de páginas de produto que transforma cada produto em uma landing page única e premium.

## 🎯 FEATURES

### ✅ Implementado no Database Schema

1. **FAQ System** - Perguntas e respostas ilimitadas por produto
2. **Video System** - YouTube, Instagram, Vimeo, uploads
3. **Benefits System** - Benefícios e diferenciais
4. **Bonuses System** - Bônus exclusivos com valores
5. **Coupons System** - Cupons de desconto com validação
6. **Campaigns System** - Black Friday, promoções, countdown
7. **Custom Sections** - Blocos personalizados dinâmicos
8. **Media Gallery** - Thumbnails, previews, screenshots, banners
9. **Layout Configuration** - Controle total da estrutura da página
10. **Custom Copy** - Textos personalizados por produto

## 🚀 STEP 1: Execute o SQL

```bash
# Copie o conteúdo de supabase/product-customization-system.sql
# Cole no Supabase SQL Editor
# Execute
```

## 📊 TABLES CREATED

```
✅ product_faqs              - FAQ por produto
✅ product_videos            - Vídeos (YouTube, Instagram, Vimeo, upload)
✅ product_benefits          - Benefícios e diferenciais
✅ product_bonuses           - Bônus exclusivos
✅ product_coupons           - Sistema de cupons
✅ product_campaigns         - Campanhas especiais
✅ product_custom_sections   - Seções customizadas
✅ product_media             - Galeria de mídia
```

## 🔧 STEP 2: Admin Panel Components

Precisamos criar no Admin:

### 1. Product Page Builder
- `admin/src/pages/ProductPageBuilder.tsx`
- Interface visual para editar layout do produto

### 2. FAQ Manager
- `admin/src/components/products/FAQManager.tsx`
- Adicionar/editar/remover perguntas

### 3. Video Manager
- `admin/src/components/products/VideoManager.tsx`
- Upload e embed de vídeos

### 4. Benefits Manager
- `admin/src/components/products/BenefitsManager.tsx`
- Gerenciar benefícios

### 5. Bonuses Manager
- `admin/src/components/products/BonusesManager.tsx`
- Gerenciar bônus

### 6. Coupons Manager
- `admin/src/components/products/CouponsManager.tsx`
- Criar e gerenciar cupons

### 7. Campaigns Manager
- `admin/src/components/products/CampaignsManager.tsx`
- Criar campanhas especiais

### 8. Custom Sections Manager
- `admin/src/components/products/CustomSectionsManager.tsx`
- Blocos personalizados

## 🎨 STEP 3: Store Frontend Components

Atualizar a página de produto:

### 1. Dynamic Product Page
- `src/pages/Product.tsx` (atualizar)
- Renderizar seções dinamicamente baseado na configuração

### 2. FAQ Component
- `src/components/product/ProductFAQ.tsx`
- Accordion com perguntas

### 3. Video Player Component
- `src/components/product/ProductVideo.tsx`
- Player universal (YouTube, Instagram, Vimeo, upload)

### 4. Benefits Section
- `src/components/product/ProductBenefits.tsx`
- Grid de benefícios

### 5. Bonuses Section
- `src/components/product/ProductBonuses.tsx`
- Cards de bônus com valores

### 6. Coupon Input
- `src/components/product/CouponInput.tsx`
- Input para aplicar cupom

### 7. Campaign Banner
- `src/components/product/CampaignBanner.tsx`
- Banner de campanha com countdown

### 8. Custom Sections Renderer
- `src/components/product/CustomSectionRenderer.tsx`
- Renderizar seções customizadas

## 📦 EXAMPLE DATA STRUCTURE

### Product with Full Customization

```json
{
  "product": {
    "id": "uuid",
    "title": "Produto Premium",
    "price": 2143423.00,
    "page_layout_config": {
      "sections_enabled": {
        "hero": true,
        "benefits": true,
        "bonuses": true,
        "faq": true,
        "video": true,
        "campaign": true
      },
      "sections_order": ["hero", "video", "campaign", "benefits", "bonuses", "faq", "cta"]
    },
    "custom_copy": {
      "hero_headline": "Domine a Arte do Desenvolvimento",
      "benefits_title": "O que você vai dominar"
    }
  },
  "faqs": [
    {
      "question": "Como funciona o acesso?",
      "answer": "Acesso vitalício imediato após a compra.",
      "is_highlighted": true
    }
  ],
  "videos": [
    {
      "video_type": "youtube",
      "video_url": "https://youtube.com/watch?v=...",
      "is_primary": true
    }
  ],
  "benefits": [
    {
      "icon": "Code",
      "title": "Conteúdo Premium",
      "description": "Material de alta qualidade"
    }
  ],
  "bonuses": [
    {
      "title": "Comunidade VIP",
      "description": "Acesso vitalício à comunidade",
      "original_value": 997.00
    }
  ],
  "coupons": [
    {
      "code": "BLACKFRIDAY",
      "discount_type": "percentage",
      "discount_value": 50,
      "valid_until": "2026-11-30"
    }
  ],
  "campaigns": [
    {
      "campaign_type": "black_friday",
      "title": "Black Friday 2026",
      "badge_text": "50% OFF",
      "countdown_enabled": true,
      "countdown_end_date": "2026-11-30T23:59:59Z"
    }
  ]
}
```

## 🎯 NEXT STEPS

1. ✅ Execute o SQL no Supabase
2. ⏳ Criar componentes do Admin Panel
3. ⏳ Atualizar página de produto no Store
4. ⏳ Testar sistema completo
5. ⏳ Adicionar dados de exemplo

## 🔥 BENEFITS

- ✅ Cada produto = Landing page única
- ✅ Controle total do Admin
- ✅ FAQ ilimitado
- ✅ Vídeos múltiplos
- ✅ Sistema de cupons
- ✅ Campanhas com countdown
- ✅ Bônus com valores
- ✅ Seções customizadas
- ✅ Layout dinâmico
- ✅ Copy personalizado

## 📝 NOTES

- Todas as tabelas têm RLS habilitado
- Admins têm controle total
- Membros veem apenas conteúdo ativo
- Sistema de cupons com validação automática
- Countdown timer para urgência
- Media gallery para múltiplas imagens
- Suporte a vídeos de múltiplas plataformas
