# 🚀 GUIA RÁPIDO - Sistema de Customização de Produtos

## ✅ O QUE FOI FEITO

Implementamos um sistema completo de customização de produtos com:
- ✅ 8 gerenciadores no Admin Panel
- ✅ 5 componentes dinâmicos no Store Frontend
- ✅ Sistema de cupons de desconto
- ✅ Campanhas com countdown
- ✅ FAQ, vídeos, bônus, mídia
- ✅ Textos personalizados por produto

---

## 🎯 TESTE AGORA (5 MINUTOS)

### 1️⃣ Abrir Admin Panel
```bash
cd admin
npm run dev
```
Acesse: http://localhost:5174

### 2️⃣ Customizar um Produto
1. Vá em **Products**
2. Clique em **Customize** em qualquer produto
3. Você verá 8 tabs:
   - **Layout**: Ativar/desativar seções
   - **Textos**: Editar títulos
   - **Vídeos**: Adicionar vídeos do YouTube
   - **FAQ**: Criar perguntas
   - **Bônus**: Adicionar bônus
   - **Cupons**: Criar cupons (ex: `PROMO10`)
   - **Campanhas**: Criar campanha com countdown
   - **Mídia**: Adicionar imagens

### 3️⃣ Exemplo Rápido - Criar FAQ
1. Na tab **FAQ**
2. Preencha:
   - **Pergunta**: "Como funciona o acesso?"
   - **Resposta**: "O acesso é vitalício e imediato após a compra."
3. Clique em **Adicionar FAQ**
4. Clique em **Salvar** (botão azul no topo)

### 4️⃣ Exemplo Rápido - Criar Cupom
1. Na tab **Cupons**
2. Preencha:
   - **Código**: `PROMO10` (ou clique em "Gerar")
   - **Tipo**: Porcentagem
   - **Valor**: 10
3. Clique em **Criar Cupom**
4. Clique em **Salvar** (botão azul no topo)

### 5️⃣ Ver no Store Frontend
```bash
# Em outro terminal, na raiz do projeto
npm run dev
```
Acesse: http://localhost:3000

1. Navegue até o produto que você customizou
2. Você verá:
   - ✅ FAQ aparecendo na página
   - ✅ Campo de cupom funcionando
   - ✅ Textos personalizados
   - ✅ Todos os componentes dinâmicos

### 6️⃣ Testar Cupom
1. No Store, na página do produto
2. Digite `PROMO10` no campo de cupom
3. Clique em **Aplicar**
4. Veja o desconto aplicado no preço! 🎉

---

## 📋 COMPONENTES DISPONÍVEIS

### Admin Panel (8 Gerenciadores)
| Componente | Função | Localização |
|------------|--------|-------------|
| FAQManager | Perguntas frequentes | Tab "FAQ" |
| VideoManager | Vídeos (YouTube, Vimeo, etc) | Tab "Vídeos" |
| BenefitsManager | Benefícios do produto | Tab "Layout" |
| BonusesManager | Bônus exclusivos | Tab "Bônus" |
| CouponsManager | Cupons de desconto | Tab "Cupons" |
| CampaignsManager | Campanhas com countdown | Tab "Campanhas" |
| CustomSectionsManager | Seções customizadas | Tab "Layout" |
| MediaGallery | Galeria de mídia | Tab "Mídia" |

### Store Frontend (5 Componentes)
| Componente | Função | Aparece Quando |
|------------|--------|----------------|
| ProductFAQ | Accordion de perguntas | Tem FAQs cadastradas |
| ProductBonuses | Grid de bônus | Tem bônus cadastrados |
| ProductVideo | Player de vídeos | Tem vídeos cadastrados |
| CouponInput | Campo de cupom | Sempre visível |
| CampaignBanner | Banner com countdown | Campanha ativa |

---

## 🎨 EXEMPLOS DE USO

### Criar uma Campanha Black Friday
1. Admin → Products → Customize
2. Tab **Campanhas**
3. Preencha:
   - Nome: "Black Friday 2026"
   - Banner: "🔥 BLACK FRIDAY: 50% OFF - Termina em:"
   - Preço Especial: 197.00
   - Data Início: 2026-11-25 00:00
   - Data Fim: 2026-11-30 23:59
   - ✅ Mostrar countdown
4. Salvar
5. No Store, verá banner no topo com countdown!

### Adicionar Vídeo do YouTube
1. Admin → Products → Customize
2. Tab **Vídeos**
3. Preencha:
   - Tipo: YouTube
   - URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Título: "Demonstração do Produto"
4. Adicionar Vídeo
5. Salvar
6. No Store, verá player de vídeo integrado!

### Personalizar Textos
1. Admin → Products → Customize
2. Tab **Textos**
3. Edite:
   - Título Principal: "Domine React em 30 Dias"
   - Subtítulo: "O curso mais completo do mercado"
   - Título de Benefícios: "O que você vai aprender"
4. Salvar
5. No Store, verá os textos atualizados!

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### Checklist Rápido
- [ ] Admin Panel abre sem erros
- [ ] Consigo acessar ProductPageBuilder
- [ ] Vejo as 8 tabs
- [ ] Consigo adicionar um FAQ
- [ ] Consigo criar um cupom
- [ ] Botão "Salvar" funciona
- [ ] Store Frontend abre sem erros
- [ ] FAQ aparece na página do produto
- [ ] Campo de cupom está visível
- [ ] Cupom aplica desconto corretamente

### Se algo não funcionar
1. Verifique se o SQL foi executado:
   - `supabase/product-customization-system.sql`
2. Verifique se está usando `supabaseAdmin` no Admin
3. Veja o console do navegador (F12)
4. Veja os logs do terminal

---

## 📊 ESTRUTURA DO BANCO DE DADOS

### Tabelas Criadas
```
product_faqs              → Perguntas frequentes
product_videos            → Vídeos do produto
product_benefits          → Benefícios
product_bonuses           → Bônus exclusivos
product_coupons           → Cupons de desconto
product_campaigns         → Campanhas promocionais
product_custom_sections   → Seções customizadas
product_media             → Galeria de mídia
```

### Colunas Adicionadas em `products`
```
page_layout_config (JSONB) → Configuração de layout
custom_copy (JSONB)        → Textos personalizados
```

---

## 💡 DICAS

### Admin Panel
- Use o botão "Gerar" para criar códigos de cupom aleatórios
- Arraste FAQs para reordenar
- Use "Destacar" para FAQs importantes
- Preview abre em nova aba

### Store Frontend
- Cupons são validados em tempo real
- Campanhas aparecem automaticamente quando ativas
- Componentes só aparecem se tiverem dados
- Design preserva o tema cinematográfico

### Performance
- Componentes carregam dados apenas quando necessário
- Imagens têm fallback automático
- Vídeos usam lazy loading
- Animações são otimizadas

---

## 🆘 PROBLEMAS COMUNS

### "Produto não salva"
- ✅ Verifique se está usando `supabaseAdmin` no Admin
- ✅ Verifique RLS policies no Supabase
- ✅ Veja console do navegador (F12)

### "Cupom não aplica"
- ✅ Verifique se cupom está ativo
- ✅ Verifique data de validade
- ✅ Verifique limite de usos
- ✅ Código deve estar em MAIÚSCULAS

### "Campanha não aparece"
- ✅ Verifique se está ativa
- ✅ Verifique data início/fim
- ✅ Verifique se está no período correto

### "FAQ não aparece no Store"
- ✅ Verifique se salvou no Admin
- ✅ Verifique se tem FAQs cadastradas
- ✅ Recarregue a página do Store

---

## 📞 PRÓXIMOS PASSOS

### Agora você pode:
1. ✅ Customizar cada produto individualmente
2. ✅ Criar campanhas promocionais
3. ✅ Gerenciar cupons de desconto
4. ✅ Adicionar FAQs, vídeos, bônus
5. ✅ Personalizar textos e layout

### Melhorias Futuras (Opcional):
- Upload direto de arquivos
- Editor WYSIWYG
- Analytics de cupons
- A/B testing
- Templates de páginas

---

## 🎉 CONCLUSÃO

Sistema 100% funcional e pronto para uso!

**Teste agora:**
1. Abra o Admin
2. Customize um produto
3. Veja no Store
4. Aplique um cupom

**Tudo funcionando!** 🚀

---

**Dúvidas?** Veja `PRODUCT_CUSTOMIZATION_COMPLETE.md` para documentação completa.
