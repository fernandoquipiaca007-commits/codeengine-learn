## 2026-07-10T18:23:05Z
1. Simplified Creator Registration Flow:
   - Identify where creator application frontend lives (e.g. CollaboratorApply.tsx).
   - Identify how registration submissions are processed by backend or frontend.
   - Find where the role 'criador' is set, how profile status is updated to 'approved', and how collaborator_balances is initialized.
   - Locate where screens/states for "Candidatura em Análise" (pending) and "Candidatura Recusada" (rejected) exist.
2. Auto-Publishing and Scheduling:
   - Identify how products are created, how status and approval_status are initialized, and where scheduling is implemented or needs to be.
   - Find Stripe product/price sync logic.
   - Identify how backend notifies admin when a new product is published.
   - Find product editing endpoints/logic and where approval status might be reset.
3. UI/UX Bug Fixes:
   - Locate "Erro ao carregar análise. Tente novamente" in creator dashboard/analytics.
   - Locate "Access denied. Approved collaborator account required." in product management.
   - Locate About page (About.tsx/About.html etc.) and investigate contrast/scrollbar issues.
