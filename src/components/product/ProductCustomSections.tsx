import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLocale } from '../../contexts/LocaleContext';

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

const DEFAULT_SECTIONS: Record<string, { title: string; content: string; section_type: string }[]> = {
  pt: [
    {
      title: 'Conteúdo Ricamente Detalhado e Estruturado',
      content: 'Este produto digital contém materiais completos desenvolvidos com o máximo rigor técnico, trazendo exemplos práticos do mundo real, ilustrações explicativas passo a passo e códigos-fonte prontos para uso. O conteúdo foi minuciosamente organizado para acelerar sua curva de aprendizado e fornecer um guia prático que você possa consultar no seu dia a dia profissional.',
      section_type: 'text'
    },
    {
      title: 'O que está incluído no pacote:',
      content: 'Acesso completo ao e-book e/ou videoaulas em alta resolução.\nProjetos de exemplo e templates prontos para rodar.\nChecklists práticos de implementação rápida.\nAtualizações futuras gratuitas vitalícias.',
      section_type: 'list'
    }
  ],
  en: [
    {
      title: 'Richly Detailed and Structured Content',
      content: 'This digital product contains complete materials developed with the highest technical rigor, featuring real-world practical examples, step-by-step explanatory illustrations, and ready-to-use source code. The content has been meticulously organized to accelerate your learning curve and provide a practical guide you can consult in your daily professional life.',
      section_type: 'text'
    },
    {
      title: 'What is included in the package:',
      content: 'Full access to the high-resolution e-book and/or video classes.\nExample projects and ready-to-run templates.\nPractical checklists for quick implementation.\nLifetime free future updates.',
      section_type: 'list'
    }
  ],
  fr: [
    {
      title: 'Contenu Richement Détaillé et Structuré',
      content: "Ce produit numérique contient des supports complets développés avec la plus grande rigueur technique, avec des exemples pratiques du monde réel, des illustrations explicatives étape par étape et des codes sources prêts à l'emploi. Le contenu a été méticuleusement organisé pour accélérer votre courbe d'apprentissage et vous fournir un guide pratique que vous pourrez consulter au quotidien dans votre vie professionnelle.",
      section_type: 'text'
    },
    {
      title: 'Ce qui est inclus dans le pack :',
      content: "Accès complet à l'e-book et/ou aux cours vidéo en haute résolution.\nProjets d'exemple et modèles prêts à l'emploi.\nListes de contrôle pratiques pour une mise en œuvre rapide.\nMises à jour futures gratuites à vie.",
      section_type: 'list'
    }
  ]
};

export function ProductCustomSections({ productId, refreshKey = 0 }: ProductCustomSectionsProps) {
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocale();

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

  if (loading) return null;

  const activeLang = (locale === 'en' || locale === 'fr') ? locale : 'pt';
  const defaults = DEFAULT_SECTIONS[activeLang];
  const listToRender = sections.length > 0 ? sections : defaults.map((sec, idx) => ({
    id: `default-section-${idx}`,
    section_type: sec.section_type,
    title: sec.title,
    content: sec.content,
    image_url: null,
    style_config: null
  }));

  return (
    <div className="mt-24 space-y-12">
      {listToRender.map((section) => (
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
