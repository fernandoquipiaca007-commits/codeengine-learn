import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { queryCache } from '../../lib/queryCache';
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
      const fetcher = async () => {
        const { data, error } = await supabase
          .from('product_custom_sections')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        return data || [];
      };

      const cacheKey = `product-custom-sections-${productId}`;
      const cachedData = await queryCache.get(cacheKey, fetcher);
      setSections(cachedData);
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

  const renderSectionContent = (section: CustomSection) => {
    if (section.section_type === 'testimonial') {
      return (
        <blockquote className="border-l-4 border-primary pl-6 my-2">
          <p className="font-sans text-base sm:text-lg text-on-surface-variant italic whitespace-pre-line leading-relaxed">
            {section.content ?? ''}
          </p>
        </blockquote>
      );
    }
    if (section.section_type === 'warning') {
      return (
        <p className="font-sans text-sm sm:text-base text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 whitespace-pre-line leading-relaxed">
          {section.content ?? ''}
        </p>
      );
    }
    if (section.section_type === 'list') {
      return (
        <ul className="space-y-3 my-2">
          {String(section.content ?? '').split('\n').filter(Boolean).map((line, i) => (
            <li key={i} className="font-sans text-sm sm:text-base text-on-surface-variant flex gap-2.5 items-start leading-relaxed">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>{line.replace(/^[-*]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p className="font-sans text-sm sm:text-base text-on-surface-variant/90 whitespace-pre-line leading-relaxed">
        {section.content ?? ''}
      </p>
    );
  };

  return (
    <div className="mt-24 space-y-16">
      {listToRender.map((section, index) => {
        const hasImage = section.section_type === 'image' && section.image_url;
        const isEven = index % 2 === 0;

        return (
          <section 
            key={section.id} 
            className="glass-panel rounded-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden transition-all duration-300 hover:border-primary/20 border border-white/5"
          >
            {/* Background glowing gradient card effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] via-transparent to-primary/[0.01] pointer-events-none" />
            
            {hasImage ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
                {/* Text Block */}
                <div className={`flex flex-col gap-4 min-w-0 w-full ${isEven ? 'md:order-1' : 'md:order-2'}`}>
                  {section.title && (
                    <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 leading-tight">
                      {section.title}
                    </h2>
                  )}
                  {renderSectionContent(section)}
                </div>

                {/* Image Block */}
                <div className={`w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl relative group ${isEven ? 'md:order-2' : 'md:order-1'}`}>
                  <img
                    src={section.image_url!}
                    alt={section.title || 'Imagem da seção'}
                    className="w-full h-auto object-cover max-h-[350px] md:max-h-[400px] hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
                </div>
              </div>
            ) : (
              // Text-only layout (centered and refined)
              <div className="max-w-3xl mx-auto flex flex-col gap-4 relative z-10">
                {section.title && (
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 leading-tight">
                    {section.title}
                  </h2>
                )}
                {renderSectionContent(section)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
