# Design - Stripe Automation Improvements

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        ADMIN PANEL                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Create Product Form                                  │  │
│  │  - Title, Description, Price                         │  │
│  │  - Category, Tags                                    │  │
│  │  - Is Free? (checkbox)                               │  │
│  │  - Files (cover, preview, product)                   │  │
│  │  - NO Stripe ID inputs                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auto Stripe Sync                                     │  │
│  │  - Create Stripe Product                             │  │
│  │  - Create Stripe Price                               │  │
│  │  - Save IDs to Database                              │  │
│  │  - Update Product Record                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      STORE FRONTEND                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Product Page                                         │  │
│  │  - Check if user owns product                        │  │
│  │  - Show appropriate button:                          │  │
│  │    • "Comprar Agora" (not owned, paid)              │  │
│  │    • "Baixar Gratuitamente" (not owned, free)       │  │
│  │    • "Já adquirido" (owned)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Auto Stripe Sync Flow

### Create Product Flow
```
Admin submits form
    ↓
Backend receives data
    ↓
IF is_free = false:
    ↓
    Create Stripe Product
        ↓
    Create Stripe Price
        ↓
    Get stripe_product_id & stripe_price_id
        ↓
    Save to database
    ↓
ELSE:
    ↓
    Skip Stripe
    ↓
Save product to database
    ↓
Return success to Admin
```

### API Endpoint
```typescript
POST /api/products/create
{
  title: string
  description: string
  price: number
  is_free: boolean
  category_id: string
  // ... other fields
}

Response:
{
  success: boolean
  product: {
    id: string
    stripe_product_id?: string
    stripe_price_id?: string
    stripe_checkout_url?: string
  }
}
```

---

## 2. Purchase Detection Flow

### Product Page Load
```
User opens product page
    ↓
Check authentication
    ↓
IF authenticated:
    ↓
    Query purchases table
    WHERE user_id = current_user
    AND product_id = current_product
    ↓
    IF purchase exists:
        ↓
        Show "Já adquirido" button
        Show "Baixar novamente"
        Show "Ver na biblioteca"
    ELSE:
        ↓
        IF is_free:
            Show "Baixar Gratuitamente"
        ELSE:
            Show "Comprar Agora"
```

### Database Query
```sql
SELECT 
  p.id,
  p.product_id,
  p.payment_status,
  p.access_type,
  p.purchase_date
FROM purchases p
WHERE p.member_id = $1
  AND p.product_id = $2
  AND p.payment_status = 'completed'
LIMIT 1;
```

---

## 3. Free Products Flow

### Free Product Acquisition
```
User clicks "Baixar Gratuitamente"
    ↓
Create purchase record
    access_type = 'free'
    payment_status = 'completed'
    amount_paid = 0
    ↓
Create digital_delivery record
    ↓
Create notification
    ↓
Redirect to library
```

### API Endpoint
```typescript
POST /api/products/claim-free
{
  product_id: string
}

Response:
{
  success: boolean
  purchase_id: string
  access_token: string
}
```

---

## 4. Admin Analytics Design

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  ANALYTICS DASHBOARD                                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Total    │  │ Receita  │  │ Produtos │  │ Membros ││
│  │ Vendas   │  │ Total    │  │ Vendidos │  │ Ativos  ││
│  │  142     │  │ R$ 30.4k │  │    89    │  │   234   ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │  Receita Mensal (Chart)                            ││
│  │  ▁▂▃▅▇█▇▅▃▂▁                                       ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │  Últimas Compras                                   ││
│  │  ┌──────────┬────────┬──────────┬────────────────┐││
│  │  │ Produto  │ Cliente│ Valor    │ Data           │││
│  │  ├──────────┼────────┼──────────┼────────────────┤││
│  │  │ Curso X  │ João   │ R$ 214   │ 13/05 16:40   │││
│  │  │ Ebook Y  │ Maria  │ R$ 97    │ 13/05 15:22   │││
│  │  └──────────┴────────┴──────────┴────────────────┘││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Analytics Queries
```sql
-- Total Sales
SELECT COUNT(*) FROM purchases WHERE payment_status = 'completed';

-- Total Revenue
SELECT SUM(final_amount) FROM purchases WHERE payment_status = 'completed';

-- Products Sold
SELECT COUNT(DISTINCT product_id) FROM purchases WHERE payment_status = 'completed';

-- Active Members
SELECT COUNT(DISTINCT member_id) FROM purchases WHERE payment_status = 'completed';

-- Monthly Revenue
SELECT 
  DATE_TRUNC('month', purchase_date) as month,
  SUM(final_amount) as revenue
FROM purchases
WHERE payment_status = 'completed'
GROUP BY month
ORDER BY month DESC
LIMIT 12;

-- Top Products
SELECT 
  p.title,
  COUNT(*) as sales,
  SUM(pu.final_amount) as revenue
FROM purchases pu
JOIN products p ON pu.product_id = p.id
WHERE pu.payment_status = 'completed'
GROUP BY p.id, p.title
ORDER BY sales DESC
LIMIT 10;
```

---

## 5. Library System Design

### Member Library Page
```
┌─────────────────────────────────────────────────────────┐
│  MINHA BIBLIOTECA                                       │
├─────────────────────────────────────────────────────────┤
│  Filtros: [Todos] [Comprados] [Gratuitos] [Favoritos] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  [Cover]     │  │  [Cover]     │  │  [Cover]     │ │
│  │  Produto 1   │  │  Produto 2   │  │  Produto 3   │ │
│  │  Comprado em │  │  Gratuito    │  │  Comprado em │ │
│  │  13/05/2026  │  │              │  │  12/05/2026  │ │
│  │  ┌─────────┐ │  │  ┌─────────┐ │  │  ┌─────────┐ │ │
│  │  │ Baixar  │ │  │  │ Baixar  │ │  │  │ Baixar  │ │ │
│  │  └─────────┘ │  │  └─────────┘ │  │  └─────────┘ │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Database Schema Changes

### Products Table
```sql
ALTER TABLE products
ADD COLUMN is_free BOOLEAN DEFAULT false,
ADD COLUMN stripe_synced BOOLEAN DEFAULT false,
ADD COLUMN auto_sync_stripe BOOLEAN DEFAULT true;
```

### Purchases Table
```sql
ALTER TABLE purchases
ADD COLUMN access_type VARCHAR(20) DEFAULT 'paid',
ADD COLUMN download_count INTEGER DEFAULT 0,
ADD COLUMN last_downloaded_at TIMESTAMP;

-- access_type: 'paid', 'free', 'gift'
```

### Sales Analytics Table (New)
```sql
CREATE TABLE sales_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_analytics_date ON sales_analytics(date DESC);
```

---

## 7. Component Structure

### Admin Components
```
admin/src/
├── pages/
│   ├── Dashboard.tsx (NEW: with analytics)
│   ├── Products.tsx (UPDATED: remove Stripe ID inputs)
│   └── Sales.tsx (NEW: purchase history)
├── components/
│   ├── analytics/
│   │   ├── StatsCard.tsx
│   │   ├── RevenueChart.tsx
│   │   └── RecentSales.tsx
│   └── products/
│       └── ProductForm.tsx (UPDATED)
```

### Store Components
```
src/
├── pages/
│   ├── Product.tsx (UPDATED: purchase detection)
│   └── Library.tsx (NEW)
├── components/
│   ├── CheckoutButton.tsx (UPDATED: conditional rendering)
│   └── member/
│       └── LibraryGrid.tsx (NEW)
```

---

## 8. API Endpoints

### New Endpoints
```
POST   /api/products/create          - Create product + auto Stripe sync
POST   /api/products/claim-free      - Claim free product
GET    /api/analytics/dashboard      - Get dashboard stats
GET    /api/analytics/revenue        - Get revenue data
GET    /api/purchases/check/:id      - Check if user owns product
GET    /api/library                  - Get user's library
```

### Updated Endpoints
```
POST   /api/stripe/sync-product      - Now called automatically
GET    /api/products/:id             - Include ownership status
```

---

## Success Criteria

- ✅ Admin never types Stripe IDs manually
- ✅ Products sync to Stripe automatically
- ✅ Free products work without Stripe
- ✅ Users can't buy same product twice
- ✅ Analytics show real data
- ✅ Library shows all owned products
- ✅ Purchase detection works instantly
- ✅ UI states reflect ownership correctly
