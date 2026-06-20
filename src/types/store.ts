// Store Frontend Types

export interface Product {
  id: string;
  title: string;
  description: string;
  category_id: string;
  price: number;
  stripe_price_id: string;
  // Legacy URL columns (may contain full URL or path)
  cover_url: string;
  preview_url: string | null;
  video_url: string | null;
  storage_url: string;
  // New storage path columns (preferred — always relative paths)
  cover_storage_path?: string | null;
  preview_storage_path?: string | null;
  video_storage_path?: string | null;
  file_storage_path?: string | null;
  tags: string[];
  cta_text: string;
  status: 'draft' | 'active' | 'archived';
  is_free?: boolean;
  product_type?: 'file' | 'course' | 'ebook';
  aoa_price?: number | null;
  fastpay_link?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface ProductWithCategory extends Product {
  category: Category;
}
