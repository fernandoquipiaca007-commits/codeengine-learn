import React from "react"
import { 
  BookOpen, 
  Play, 
  LayoutDashboard, 
  BookMarked, 
  Zap, 
  Headphones, 
  Sparkles, 
  Code2, 
  ArrowRight 
} from "lucide-react"
import { Warp } from "@paper-design/shaders-react"
import { cn } from "../../lib/utils"

interface CategoryConfig {
  key: string
  title: string
  description: string
  iconName: string
  shader: {
    proportion: number
    softness: number
    distortion: number
    swirl: number
    swirlIterations: number
    shape: "checks" | "dots"
    shapeScale: number
    colors: string[]
  }
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: "ebook",
    title: "E-books",
    description: "Biblioteca premium de conhecimento digital, negócios, IA e crescimento.",
    iconName: "BookOpen",
    shader: {
      proportion: 0.3,
      softness: 0.8,
      distortion: 0.15,
      swirl: 0.6,
      swirlIterations: 8,
      shape: "checks",
      shapeScale: 0.08,
      colors: ["hsl(280, 90%, 15%)", "hsl(300, 95%, 35%)", "hsl(320, 85%, 20%)", "hsl(290, 95%, 45%)"],
    }
  },
  {
    key: "curso",
    title: "Cursos Online",
    description: "Aprenda com cursos práticos de alta performance e vídeo integrado.",
    iconName: "Play",
    shader: {
      proportion: 0.4,
      softness: 1.2,
      distortion: 0.2,
      swirl: 0.9,
      swirlIterations: 12,
      shape: "dots",
      shapeScale: 0.12,
      colors: ["hsl(200, 90%, 12%)", "hsl(180, 95%, 35%)", "hsl(160, 85%, 15%)", "hsl(190, 95%, 40%)"],
    }
  },
  {
    key: "template",
    title: "Templates",
    description: "Acelere projetos e fluxos de trabalho com templates profissionais.",
    iconName: "LayoutDashboard",
    shader: {
      proportion: 0.35,
      softness: 0.9,
      distortion: 0.18,
      swirl: 0.7,
      swirlIterations: 10,
      shape: "checks",
      shapeScale: 0.1,
      colors: ["hsl(140, 90%, 12%)", "hsl(120, 95%, 30%)", "hsl(100, 85%, 15%)", "hsl(130, 95%, 40%)"],
    }
  },
  {
    key: "guias",
    title: "Guias e Tutoriais",
    description: "Tutoriais passo a passo e guias práticos para execução rápida.",
    iconName: "BookMarked",
    shader: {
      proportion: 0.45,
      softness: 1.1,
      distortion: 0.22,
      swirl: 0.8,
      swirlIterations: 15,
      shape: "dots",
      shapeScale: 0.09,
      colors: ["hsl(30, 90%, 15%)", "hsl(45, 95%, 35%)", "hsl(15, 85%, 15%)", "hsl(40, 95%, 40%)"],
    }
  },
  {
    key: "ferramentas",
    title: "Ferramentas & Softwares",
    description: "Soluções digitais prontas para automação e aumento de produtividade.",
    iconName: "Zap",
    shader: {
      proportion: 0.38,
      softness: 0.95,
      distortion: 0.16,
      swirl: 0.85,
      swirlIterations: 11,
      shape: "checks",
      shapeScale: 0.11,
      colors: ["hsl(250, 90%, 18%)", "hsl(270, 95%, 38%)", "hsl(260, 85%, 20%)", "hsl(265, 95%, 45%)"],
    }
  },
  {
    key: "audio",
    title: "Áudio & Música",
    description: "Faixas, efeitos sonoros e áudios premium para seus projetos.",
    iconName: "Headphones",
    shader: {
      proportion: 0.42,
      softness: 1.0,
      distortion: 0.19,
      swirl: 0.75,
      swirlIterations: 9,
      shape: "dots",
      shapeScale: 0.13,
      colors: ["hsl(330, 90%, 15%)", "hsl(350, 95%, 35%)", "hsl(340, 85%, 18%)", "hsl(345, 95%, 40%)"],
    }
  },
  {
    key: "design",
    title: "Design & Assets Gráficos",
    description: "Pacotes de design, ícones, fontes e recursos gráficos de elite.",
    iconName: "Sparkles",
    shader: {
      proportion: 0.36,
      softness: 0.9,
      distortion: 0.17,
      swirl: 0.78,
      swirlIterations: 10,
      shape: "checks",
      shapeScale: 0.1,
      colors: ["hsl(220, 90%, 15%)", "hsl(240, 95%, 38%)", "hsl(230, 85%, 20%)", "hsl(235, 95%, 45%)"],
    }
  },
  {
    key: "codigo",
    title: "Códigos Fonte & Scripts",
    description: "Scripts, snippets e códigos-fonte completos prontos para uso.",
    iconName: "Code2",
    shader: {
      proportion: 0.4,
      softness: 1.0,
      distortion: 0.18,
      swirl: 0.8,
      swirlIterations: 12,
      shape: "dots",
      shapeScale: 0.11,
      colors: ["hsl(170, 90%, 12%)", "hsl(190, 95%, 32%)", "hsl(180, 85%, 15%)", "hsl(185, 95%, 38%)"],
    }
  }
]

// Accents stripper helper
const normalizeString = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

// Icon getter
const getCategoryIconComponent = (iconName: string) => {
  switch (iconName) {
    case "BookOpen": return BookOpen
    case "Play": return Play
    case "LayoutDashboard": return LayoutDashboard
    case "BookMarked": return BookMarked
    case "Zap": return Zap
    case "Headphones": return Headphones
    case "Sparkles": return Sparkles
    case "Code2": return Code2
    default: return Code2
  }
}

export interface CategoryFeatureCardProps {
  config: CategoryConfig
  matchingCategoryId: string | null
  onClick: (categoryId: string | null) => void
}

export function CategoryFeatureCard({ config, matchingCategoryId, onClick }: CategoryFeatureCardProps) {
  const IconComponent = getCategoryIconComponent(config.iconName)

  return (
    <div 
      onClick={() => onClick(matchingCategoryId)}
      className="relative h-60 rounded-3xl overflow-hidden border border-white/5 bg-[#050508]/80 hover:bg-black/90 cursor-pointer group transition-all duration-300 hover:border-primary/20 shadow-xl"
    >
      {/* Absolute Shader Canvas Background */}
      <div className="absolute inset-0 z-0 opacity-45 mix-blend-screen pointer-events-none transition-opacity duration-300 group-hover:opacity-60">
        <Warp
          style={{ height: "100%", width: "100%" }}
          proportion={config.shader.proportion}
          softness={config.shader.softness}
          distortion={config.shader.distortion}
          swirl={config.shader.swirl}
          swirlIterations={config.shader.swirlIterations}
          shape={config.shader.shape}
          shapeScale={config.shader.shapeScale}
          scale={1}
          rotation={0}
          speed={0.4}
          colors={config.shader.colors}
        />
      </div>

      {/* Glass card panel border & bottom gradient */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050508] via-[#050508]/30 to-transparent pointer-events-none" />

      {/* Internal Content layout */}
      <div className="relative z-20 p-6 h-full flex flex-col justify-between items-start text-left">
        <div className="flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-primary/30">
            <IconComponent className="w-5 h-5 text-white/90 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-lg text-white group-hover:text-primary transition-colors">
              {config.title}
            </h3>
            <p className="font-sans text-xs text-on-surface-variant/90 leading-relaxed mt-1 line-clamp-3">
              {config.description}
            </p>
          </div>
        </div>

        <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all duration-300 group-hover:text-white group-hover:translate-x-1">
          <span className="mr-1">Explorar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}

export interface CategoryFeatureGridProps {
  dbCategories: any[]
  onCategorySelect: (categoryId: string | null) => void
}

export function CategoryFeatureGrid({ dbCategories, onCategorySelect }: CategoryFeatureGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {CATEGORY_CONFIGS.map((config) => {
        // Resolve dynamic DB Category ID based on accents stripped name matching
        const cleanTitle = normalizeString(config.title)
        const matched = dbCategories.find(c => {
          const cleanDbName = normalizeString(c.name)
          return cleanDbName.includes(cleanTitle) || cleanTitle.includes(cleanDbName)
        })
        const matchingId = matched ? matched.id : null

        return (
          <CategoryFeatureCard
            key={config.key}
            config={config}
            matchingCategoryId={matchingId}
            onClick={onCategorySelect}
          />
        )
      })}
    </div>
  )
}

export interface CategorySelectorProps {
  dbCategories: any[]
  onCategorySelect: (categoryId: string | null) => void
}

export function CategorySelector({ dbCategories, onCategorySelect }: CategorySelectorProps) {
  return (
    <section className="w-full flex flex-col gap-6 relative z-10 py-2">
      <div className="text-left">
        <h2 className="font-display font-black tracking-tight text-xl sm:text-2xl text-white">
          Categorias em Destaque
        </h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-xl mt-1">
          Selecione uma área abaixo para filtrar os materiais e acelerar seu desenvolvimento.
        </p>
      </div>
      <CategoryFeatureGrid 
        dbCategories={dbCategories} 
        onCategorySelect={onCategorySelect} 
      />
    </section>
  )
}
