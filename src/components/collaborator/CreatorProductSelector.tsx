import { motion } from "motion/react";
import {
  BookOpen,
  PlayCircle,
  Layers,
  Music,
  Smartphone,
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export type CreatorProductType =
  | "ebook"
  | "course"
  | "template"
  | "music"
  | "app"
  | "service"
  | "affiliate";

interface ProductTypeCard {
  type: CreatorProductType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  glowColor: string;
  bgGradient: string;
  available: boolean;
  badge?: string;
}

const PRODUCT_TYPES: ProductTypeCard[] = [
  {
    type: "ebook",
    icon: <BookOpen size={28} />,
    label: "E-book",
    description: "Livro digital em PDF, EPUB ou outros formatos.",
    color: "text-violet-400",
    glowColor: "rgba(139,92,246,0.35)",
    bgGradient: "from-violet-500/15 to-purple-500/5",
    available: true,
  },
  {
    type: "course",
    icon: <PlayCircle size={28} />,
    label: "Curso Online",
    description: "Conteúdo em vídeo organizado em módulos e aulas.",
    color: "text-blue-400",
    glowColor: "rgba(59,130,246,0.35)",
    bgGradient: "from-blue-500/15 to-cyan-500/5",
    available: true,
    badge: "Popular",
  },
  {
    type: "template",
    icon: <Layers size={28} />,
    label: "Template",
    description: "Modelos, temas, kits de design ou presets.",
    color: "text-orange-400",
    glowColor: "rgba(249,115,22,0.35)",
    bgGradient: "from-orange-500/15 to-amber-500/5",
    available: true,
  },
  {
    type: "music",
    icon: <Music size={28} />,
    label: "Música",
    description: "Faixas de áudio, beats, trilhas ou pacotes de som.",
    color: "text-pink-400",
    glowColor: "rgba(236,72,153,0.35)",
    bgGradient: "from-pink-500/15 to-rose-500/5",
    available: true,
  },
  {
    type: "app",
    icon: <Smartphone size={28} />,
    label: "Aplicativo",
    description: "Software, aplicativo, plugin ou extensão.",
    color: "text-cyan-400",
    glowColor: "rgba(34,211,238,0.35)",
    bgGradient: "from-cyan-500/15 to-teal-500/5",
    available: true,
  },
  {
    type: "service",
    icon: <Briefcase size={28} />,
    label: "Serviço",
    description: "Consultoria, mentoria, freelance ou serviço digital.",
    color: "text-emerald-400",
    glowColor: "rgba(52,211,153,0.35)",
    bgGradient: "from-emerald-500/15 to-green-500/5",
    available: true,
  },
];

interface CreatorProductSelectorProps {
  displayName?: string;
  onSelectType: (type: CreatorProductType) => void;
  onGoToAffiliates: () => void;
}

export function CreatorProductSelector({
  displayName,
  onSelectType,
  onGoToAffiliates,
}: CreatorProductSelectorProps) {
  return (
    <div className="w-full">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8 relative"
      >
        {/* Glow background */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-48 h-24 bg-purple-500/8 rounded-full blur-3xl" />
        </div>

        <div className="flex items-start gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/15 border border-primary/25 shrink-0">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60 tracking-tight leading-tight">
              {displayName
                ? `${displayName}, o que queres criar hoje?`
                : "O que queres criar hoje?"}
            </h2>
            <p className="text-on-surface-variant text-sm mt-0.5 font-sans">
              Transforma o teu conhecimento em rendimento. Escolhe o tipo de produto para começar.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Product type grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {PRODUCT_TYPES.map((product, idx) => (
          <motion.button
            key={product.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 + idx * 0.06, ease: "easeOut" }}
            onClick={() => onSelectType(product.type)}
            className={`group relative text-left rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:-translate-y-0.5 active:scale-[0.98] overflow-hidden focus:outline-none`}
            style={{
              boxShadow: "0 1px 12px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${product.glowColor}, 0 1px 12px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 12px rgba(0,0,0,0.3)";
            }}
          >
            {/* Subtle gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${product.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none`} />

            {/* Badge */}
            {product.badge && (
              <span className="absolute top-3 right-3 text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                {product.badge}
              </span>
            )}

            {/* Icon */}
            <div className={`${product.color} mb-3 relative z-10 transition-transform duration-300 group-hover:scale-110`}>
              {product.icon}
            </div>

            {/* Label */}
            <h3 className="font-display font-bold text-white text-sm sm:text-base mb-1 relative z-10">
              {product.label}
            </h3>

            {/* Description */}
            <p className={`text-[11px] sm:text-xs leading-relaxed relative z-10 ${product.color} opacity-70 group-hover:opacity-90 transition-opacity`}>
              {product.description}
            </p>

            {/* Arrow indicator */}
            <div className={`absolute bottom-3 right-3 ${product.color} opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0`}>
              <ChevronRight size={14} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Affiliate CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/25 shrink-0">
            <Users size={16} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Preferes promover produtos de outros?</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Afilia-te a produtos existentes e ganha comissões sem criar nada.
            </p>
          </div>
        </div>
        <button
          onClick={onGoToAffiliates}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 text-xs font-bold hover:bg-yellow-500/25 transition-all shrink-0 whitespace-nowrap"
        >
          Ver Afiliados
          <ArrowRight size={12} />
        </button>
      </motion.div>
    </div>
  );
}
