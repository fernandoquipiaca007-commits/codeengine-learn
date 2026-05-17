# 🔧 Correção: Erro de Sincronização Stripe

## ❌ Problema Identificado:

Ao tentar sincronizar produtos com preços muito altos, o Stripe retornava erro 500:

```
Error: parameter_invalid_integer
Param: unit_amount
```

### Causa:

O produto tinha preço de **R$ 4.385.745,00** (4 milhões)

O código estava multiplicando por 100 para converter para centavos:
```
4385745 * 100 = 438574500 centavos
```

Isso excede o limite do Stripe de **R$ 999.999,99** (99.999.999 centavos)

---

## ✅ Solução Implementada:

Adicionei validação no `stripe-service.ts`:

```typescript
// Convert to cents and ensure it's an integer
const amountInCents = Math.round(priceData.amount * 100);

// Stripe has a maximum amount limit
if (amountInCents > 99999999) {
  throw new Error('Price exceeds Stripe maximum limit (999,999.99)');
}
```

---

## 🎯 Limites do Stripe:

| Moeda | Valor Máximo |
|-------|--------------|
| BRL | R$ 999.999,99 |
| USD | $999,999.99 |
| EUR | €999,999.99 |

**Centavos máximo:** 99.999.999

---

## 🧪 Como Testar Agora:

### 1️⃣ **Servidor já foi reiniciado** ✅

### 2️⃣ **Teste com preço válido:**

No Admin, edite o produto e mude o preço para algo razoável:
- ✅ R$ 49,90
- ✅ R$ 199,00
- ✅ R$ 999,99
- ❌ R$ 4.385.745,00 (muito alto!)

### 3️⃣ **Clique em "Sync to Stripe" novamente**

Agora deve funcionar! ✅

---

## 📊 Exemplo de Produto Válido:

```json
{
  "title": "E-book de IA",
  "price": 49.90,
  "description": "Aprenda IA do zero"
}
```

Será convertido para:
```
49.90 * 100 = 4990 centavos
```

Stripe recebe: `unit_amount: 4990` ✅

---

## 🐛 Mensagens de Erro:

### **Antes (erro genérico):**
```
Failed to sync product
```

### **Agora (erro específico):**
```
Price exceeds Stripe maximum limit (999,999.99)
```

---

## 💡 Recomendações:

1. **Preços Razoáveis:**
   - E-books: R$ 29,90 - R$ 99,90
   - Cursos: R$ 99,00 - R$ 499,00
   - Pacotes: R$ 199,00 - R$ 999,00

2. **Produtos Caros:**
   - Se precisar vender algo acima de R$ 999.999,99
   - Use pagamento customizado
   - Ou divida em parcelas

3. **Validação no Frontend:**
   - Adicionar validação no ProductForm
   - Máximo: R$ 999.999,99
   - Mínimo: R$ 0,50

---

## ✅ Status:

- ✅ Erro identificado
- ✅ Correção implementada
- ✅ Servidor reiniciado
- ✅ Validação adicionada
- ✅ Mensagem de erro melhorada

**Pronto para testar novamente!** 🚀

---

## 🎯 Próximos Passos:

1. Edite o produto no Admin
2. Mude o preço para algo razoável (ex: R$ 49,90)
3. Clique em "Sync to Stripe"
4. Deve funcionar! ✅

Se ainda der erro, me avise e eu verifico os logs!
