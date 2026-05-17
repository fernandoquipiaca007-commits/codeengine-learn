# 🚀 GUIA RÁPIDO - Diagnóstico Passo a Passo

## 📋 EXECUTE APENAS ESTA QUERY

Copie e execute **APENAS** esta query no Supabase SQL Editor:

```sql
SELECT 
  'Total de Compras' as metrica,
  COUNT(*)::text as valor
FROM purchases
UNION ALL
SELECT 
  'Compras Completadas',
  COUNT(*)::text
FROM purchases
WHERE payment_status = 'completed'
UNION ALL
SELECT 
  'Compras Pendentes',
  COUNT(*)::text
FROM purchases
WHERE payment_status = 'pending'
UNION ALL
SELECT 
  'Compras sem member_id',
  COUNT(*)::text
FROM purchases
WHERE member_id IS NULL
UNION ALL
SELECT 
  'Usuários sem registro em members',
  COUNT(*)::text
FROM auth.users au
LEFT JOIN members m ON m.auth_id = au.id
WHERE m.id IS NULL
UNION ALL
SELECT 
  'Compras sem digital_delivery',
  COUNT(*)::text
FROM purchases p
LEFT JOIN digital_deliveries dd ON dd.purchase_id = p.id
WHERE p.payment_status = 'completed' AND dd.id IS NULL;
```

---

## 📊 VOCÊ VAI VER ALGO ASSIM:

```
┌─────────────────────────────────────┬────────┐
│ metrica                             │ valor  │
├─────────────────────────────────────┼────────┤
│ Total de Compras                    │ ???    │
│ Compras Completadas                 │ ???    │
│ Compras Pendentes                   │ ???    │
│ Compras sem member_id               │ ???    │
│ Usuários sem registro em members    │ ???    │
│ Compras sem digital_delivery        │ ???    │
└─────────────────────────────────────┴────────┘
```

---

## ✅ ANOTE OS NÚMEROS AQUI:

```
Total de Compras:                    [ ___ ]
Compras Completadas:                 [ ___ ]
Compras Pendentes:                   [ ___ ]
Compras sem member_id:               [ ___ ]
Usuários sem registro em members:    [ ___ ]
Compras sem digital_delivery:        [ ___ ]
```

---

## 🎯 DEPOIS DE ANOTAR

Compartilhe esses 6 números aqui na conversa!

---

**Isso é tudo que preciso para identificar o problema! 🎯**
