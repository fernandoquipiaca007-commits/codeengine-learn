// ============================================================
// Category Detection Utility
// Maps a DB category name to a strongly-typed form variant
// ============================================================

export type ProductFormType =
  | 'ebook'
  | 'course'
  | 'template'
  | 'music'
  | 'app'
  | 'service'
  | 'generic';

export function detectFormType(categoryName: string): ProductFormType {
  const name = categoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (
    name.includes('ebook') ||
    name.includes('e-book') ||
    name.includes('livro') ||
    name.includes('guia') ||
    name.includes('apostila') ||
    name.includes('pdf')
  ) return 'ebook';

  if (
    name.includes('curso') ||
    name.includes('course') ||
    name.includes('aula') ||
    name.includes('tutorial') ||
    name.includes('serie') ||
    name.includes('video') ||
    name.includes('treinamento') ||
    name.includes('training')
  ) return 'course';

  if (
    name.includes('template') ||
    name.includes('modelo') ||
    name.includes('tema') ||
    name.includes('theme') ||
    name.includes('pack') ||
    name.includes('kit') ||
    name.includes('preset')
  ) return 'template';

  if (
    name.includes('musica') ||
    name.includes('music') ||
    name.includes('audio') ||
    name.includes('beat') ||
    name.includes('som') ||
    name.includes('trilha') ||
    name.includes('track')
  ) return 'music';

  if (
    name.includes('app') ||
    name.includes('aplicativo') ||
    name.includes('software') ||
    name.includes('ferramenta') ||
    name.includes('plugin') ||
    name.includes('extensao') ||
    name.includes('tool')
  ) return 'app';

  if (
    name.includes('servico') ||
    name.includes('service') ||
    name.includes('freelance') ||
    name.includes('consultoria') ||
    name.includes('mentoria') ||
    name.includes('mentoring') ||
    name.includes('coaching')
  ) return 'service';

  return 'generic';
}

export interface ProductTypeDefinition {
  type: ProductFormType;
  label: string;
  description: string;
  iconName: string;
}

export const PRODUCT_TYPE_DEFINITIONS: ProductTypeDefinition[] = [
  {
    type: 'ebook',
    label: 'E-book',
    description: 'Livro digital em PDF, EPUB ou outros formatos de leitura.',
    iconName: 'BookOpen',
  },
  {
    type: 'course',
    label: 'Curso Online',
    description: 'Conteudo em video estruturado em modulos e aulas.',
    iconName: 'PlayCircle',
  },
  {
    type: 'template',
    label: 'Template',
    description: 'Modelos, temas, kits de design ou presets prontos para usar.',
    iconName: 'Layers',
  },
  {
    type: 'music',
    label: 'Musica',
    description: 'Faixas de audio, beats, trilhas sonoras ou pacotes de som.',
    iconName: 'Music',
  },
  {
    type: 'app',
    label: 'Aplicativo',
    description: 'Software, aplicativo, plugin ou extensao para instalacao.',
    iconName: 'Smartphone',
  },
  {
    type: 'service',
    label: 'Servico',
    description: 'Consultoria, mentoria, freelance ou servico digital personalizado.',
    iconName: 'Briefcase',
  },
];
