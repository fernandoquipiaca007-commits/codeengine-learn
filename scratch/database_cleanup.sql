-- =====================================================================
-- 🏆 SCRIPT DE LIMPEZA RESILIENTE DE BASE DE DADOS (100% A PROVA DE ERROS)
-- Nível: Administrador / Produção (Executar no Editor SQL do Supabase)
-- =====================================================================
--
-- Este script realiza uma limpeza profunda na base de dados para remover 
-- dados de teste. Utiliza verificação dinâmica de tabelas (IF EXISTS)
-- para evitar erros de tabelas inexistentes no seu esquema atual.

DO $$ 
DECLARE
    t_name text;
    tables_to_clean text[] := ARRAY[
        -- Seção A: Dados Transacionais, Histórico, Logs e Membros de Teste
        'stripe_webhook_logs',
        'sales_analytics',
        'analytics',
        'downloads',
        'favorites',
        'recent_views',
        'notifications',
        'push_subscriptions',  -- Tabela de assinaturas Push corrigida
        'push_tokens',         -- Fallback alternativo
        'news_likes',
        'news_comments',
        'points_transactions',
        'points_balance',
        'member_coupons',
        'purchases',
        'member_grants',
        'fastpay_orders',
        'members'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_to_clean
    LOOP
        -- Verifica dinamicamente se a tabela existe no esquema public antes de executar o TRUNCATE
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = t_name
        ) THEN
            EXECUTE format('TRUNCATE TABLE public.%I CASCADE', t_name);
            RAISE NOTICE 'Tabela % limpa com sucesso.', t_name;
        ELSE
            RAISE NOTICE 'Tabela % não existe no esquema, ignorando...', t_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================================
-- 📦 SEÇÃO B: LIMPEZA DE PRODUTOS E CONTEÚDO (OPCIONAL)
-- =====================================================================
-- IMPORTANTE: Para apagar também toda a estrutura física de produtos
-- e notícias cadastrados atualmente, remova os traços (--) das linhas abaixo:

-- DO $$ 
-- DECLARE
--     t_name text;
--     catalog_to_clean text[] := ARRAY[
--         'product_videos',
--         'product_faqs',
--         'product_custom_sections',
--         'product_campaigns',
--         'product_coupons',
--         'product_bonuses',
--         'product_benefits',
--         'product_media',
--         'course_lessons',
--         'course_modules',
--         'products_translations',
--         'featured_products',
--         'products',
--         'subcategories',
--         'categories',
--         'news_translations',
--         'news'
--     ];
-- BEGIN
--     FOREACH t_name IN ARRAY catalog_to_clean
--     LOOP
--         IF EXISTS (
--             SELECT FROM information_schema.tables 
--             WHERE table_schema = 'public' 
--               AND table_name = t_name
--         ) THEN
--             EXECUTE format('TRUNCATE TABLE public.%I CASCADE', t_name);
--             RAISE NOTICE 'Tabela de catálogo % limpa.', t_name;
--         END IF;
--     END LOOP;
-- END $$;
