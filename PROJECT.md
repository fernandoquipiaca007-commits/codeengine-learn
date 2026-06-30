# Project: UI Density, Mobile responsive, Members area navigation, and Themes Optimization

## Architecture
- **Storefront Frontend (`src/`)**: A Vite + React + TypeScript web app. Interacts with Supabase backend and features rich UI animations, course viewing, downloads, and custom theme presets.
- **Admin Frontend (`admin/src/`)**: A separate Vite + React + TypeScript web app located in the `admin` folder for admin panel operations.
- **Database (Supabase)**: Houses the `products`, `featured_products`, and `ad_campaigns` tables.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | UI Density Optimizations (100vh) | Comcompress inputs, buttons, margins, card paddings in forms, dashboard grids, banners to fit single viewports (100vh) without vertical scrolling. | None | IN_PROGRESS (Conv: 35444a52) |
| 2 | Mobile responsive design (Native app style) | Reduce font sizes, buttons, and card sizes on mobile; refactor filters/analysis panel to fit small viewports densly. | M1 | IN_PROGRESS (Conv: 35444a52) |
| 3 | Admin Featured Products & Deduplication | Enable deduplication between manually highlighted products and active sponsored ads in circular 3D carousel. | None | PLANNED |
| 4 | Members Tab Navigation Restoration | Revert Members Area tabs and wrappers to exact padding, margins, rounding, and sizing styles of the main branch. | None | IN_PROGRESS (Conv: 35444a52) |
| 5 | Themes Preview & ScrollTiedBackground | Fix React reference crashes on product background preview, clarify settings labels, ensure smooth scroll performance. | M1 | IN_PROGRESS (Conv: 35444a52) |
| 6 | Verification & Build Validation | Verify typescript compilation, clean lint status, and execute build targets across root and admin workspaces. | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts
### Home Storefront ↔ useFeaturedProducts
- `useFeaturedProducts` retrieves active highlights from the `featured_products` table.
- Home filters duplicates: if a product is highlighted manually AND has an active ad (placement: `featured_3d`), it is shown only once using the ad's sponsored styling.
