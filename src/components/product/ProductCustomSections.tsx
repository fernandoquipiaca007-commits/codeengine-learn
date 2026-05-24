import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CustomSection {
  id: string;
  section_type: string;
  title: string | null;
  content: string;
  image_url: string | null;
  style_config: Record<string, unknown> | null;
}

interface ProductCustomSectionsProps {
  productId: string;
  refreshKey?: number;
}

export function ProductCustomSections({ productId, refreshKey = 0 }: ProductCustomSectionsProps) {
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadSections();
  }, [productId, refreshKey]);

  async function loadSections() {
    try {
      const { data, error } = await supabase
        .from('product_custom_sections')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSections(data ?? []);
    } catch (err) {
      console.error('Error loading custom sections:', err);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading || sections.length === 0) return null;

  return (
    <div className="mt-24 space-y-12">
      {sections.map((section) => (
        <section key={section.id} className="glass-panel rounded-2xl p-6 sm:p-8 md:p-10">
          {section.title && (
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-on-surface mb-4">
              {section.title}
            </h2>
          )}

          {section.section_type === 'image' && section.image_url && (
            <img
              src={section.image_url}
              alt={section.title || 'Seção do produto'}
              className="w-full rounded-xl mb-6 object-cover max-h-[480px]"
            />
          )}

          {section.section_type === 'testimonial' ? (
            <blockquote className="border-l-4 border-primary pl-6">
              <p className="font-sans text-base sm:text-lg text-on-surface-variant italic whitespace-pre-line">
                {section.content ?? ''}
              </p>
            </blockquote>
          ) : section.section_type === 'warning' ? (
            <p className="font-sans text-sm sm:text-base text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 whitespace-pre-line">
              {section.content ?? ''}
            </p>
          ) : section.section_type === 'list' ? (
            <ul className="space-y-2">
              {String(section.content ?? '').split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="font-sans text-sm sm:text-base text-on-surface-variant flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{line.replace(/^[-*]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-sm sm:text-base text-on-surface-variant whitespace-pre-line">
              {section.content ?? ''}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
