import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  PlayCircle,
  Layers,
  Music,
  Smartphone,
  Briefcase,
  X,
} from 'lucide-react';
import { ProductFormType } from '../../lib/categoryDetect';

interface Category {
  id: string;
  name: string;
}

interface ProductTypePickerProps {
  categories: Category[];
  onSelect: (categoryId: string, formType: ProductFormType) => void;
  onClose: () => void;
}

interface TypeCard {
  formType: ProductFormType;
  label: string;
  description: string;
  keywords: string[];
  Icon: React.ElementType;
}

const TYPE_CARDS: TypeCard[] = [
  {
    formType: 'ebook',
    label: 'E-book',
    description: 'Livro digital em PDF, EPUB ou outros formatos.',
    keywords: ['ebook', 'e-book', 'livro', 'guia', 'apostila', 'pdf'],
    Icon: BookOpen,
  },
  {
    formType: 'course',
    label: 'Curso Online',
    description: 'Conteudo em video organizado em modulos e aulas.',
    keywords: ['curso', 'course', 'aula', 'tutorial', 'serie', 'video', 'treinamento', 'training'],
    Icon: PlayCircle,
  },
  {
    formType: 'template',
    label: 'Template',
    description: 'Modelos, temas, kits de design ou presets.',
    keywords: ['template', 'modelo', 'tema', 'theme', 'pack', 'kit', 'preset'],
    Icon: Layers,
  },
  {
    formType: 'music',
    label: 'Musica',
    description: 'Faixas de audio, beats, trilhas ou pacotes de som.',
    keywords: ['musica', 'music', 'audio', 'beat', 'som', 'trilha', 'track'],
    Icon: Music,
  },
  {
    formType: 'app',
    label: 'Aplicativo',
    description: 'Software, aplicativo, plugin ou extensao.',
    keywords: ['app', 'aplicativo', 'software', 'ferramenta', 'plugin', 'extensao', 'tool'],
    Icon: Smartphone,
  },
  {
    formType: 'service',
    label: 'Servico',
    description: 'Consultoria, mentoria, freelance ou servico digital.',
    keywords: ['servico', 'service', 'freelance', 'consultoria', 'mentoria', 'mentoring', 'coaching'],
    Icon: Briefcase,
  },
];

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchCard(categoryName: string, card: TypeCard): boolean {
  const n = normalize(categoryName);
  return card.keywords.some((k) => n.includes(k));
}

export function ProductTypePicker({ categories, onSelect, onClose }: ProductTypePickerProps) {
  function handleCardClick(card: TypeCard) {
    const norm = normalize;
    // Find the first category that matches this card
    const matched = categories.find((c) => matchCard(c.name, card));
    if (matched) {
      onSelect(matched.id, card.formType);
    } else {
      // Fallback: use the first category and pass formType as generic
      onSelect(categories[0]?.id ?? '', card.formType);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-[#050505] flex flex-col overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col flex-grow"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Adicionar Novo Produto
            </h2>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              Selecione o tipo de produto que deseja publicar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-on-surface-variant hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Grid */}
        <div className="flex-grow flex items-center justify-center px-6 py-10 sm:py-16">
          <div className="w-full max-w-4xl">
            <div className="mb-8 text-center">
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Que tipo de produto voce vai publicar?
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant font-sans">
                Cada tipo possui um formulario personalizado com apenas os campos necessarios.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {TYPE_CARDS.map((card, idx) => (
                <motion.button
                  key={card.formType}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    delay: idx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() => handleCardClick(card)}
                  className="group relative flex flex-col items-start text-left rounded-2xl border border-white/10 bg-surface-container hover:bg-surface-high hover:border-white/20 transition-all duration-200 p-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  style={{ minHeight: '140px' }}
                >
                  {/* Icon area */}
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-200 shrink-0">
                    <card.Icon size={20} className="text-on-surface-variant group-hover:text-primary transition-colors duration-200" />
                  </div>

                  {/* Text */}
                  <span className="font-display text-sm font-bold text-white block mb-1">
                    {card.label}
                  </span>
                  <span className="font-sans text-[11px] text-on-surface-variant leading-relaxed">
                    {card.description}
                  </span>

                  {/* Hover accent line */}
                  <span className="absolute inset-x-0 bottom-0 h-px rounded-b-2xl bg-primary/0 group-hover:bg-primary/30 transition-all duration-300" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
