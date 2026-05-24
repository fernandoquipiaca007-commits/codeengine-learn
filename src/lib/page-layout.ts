/** Layout flags from admin ProductPageBuilder → store product page */

export interface SectionsEnabled {
  hero?: boolean;
  benefits?: boolean;
  features?: boolean;
  bonuses?: boolean;
  faq?: boolean;
  cta?: boolean;
  video?: boolean;
  campaign?: boolean;
  testimonials?: boolean;
  comparison?: boolean;
  [key: string]: boolean | undefined;
}

export interface PageLayoutConfig {
  sections_enabled?: SectionsEnabled;
  sections_order?: string[];
  hero_style?: string;
  cta_text?: string;
  cta_secondary_text?: string;
}

const DEFAULT_SECTIONS: SectionsEnabled = {
  hero: true,
  benefits: true,
  features: true,
  bonuses: true,
  faq: true,
  cta: true,
  video: true,
  campaign: true,
  testimonials: false,
  comparison: false,
};

export function parsePageLayoutConfig(raw: unknown): PageLayoutConfig {
  if (raw == null) return { sections_enabled: { ...DEFAULT_SECTIONS } };
  if (typeof raw === 'string') {
    try {
      return parsePageLayoutConfig(JSON.parse(raw));
    } catch {
      return { sections_enabled: { ...DEFAULT_SECTIONS } };
    }
  }
  if (typeof raw === 'object') return raw as PageLayoutConfig;
  return { sections_enabled: { ...DEFAULT_SECTIONS } };
}

export function isSectionEnabled(
  config: PageLayoutConfig | null | undefined,
  section: keyof SectionsEnabled
): boolean {
  const enabled = config?.sections_enabled;
  if (!enabled) return DEFAULT_SECTIONS[section] !== false;
  if (enabled[section] === undefined) return DEFAULT_SECTIONS[section] !== false;
  return Boolean(enabled[section]);
}
