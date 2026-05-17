import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FavoriteButton({ isFavorite, onToggle, size = 'md', className = '' }: FavoriteButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center
        ${isFavorite 
          ? 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
          : 'bg-white/5 text-on-surface-variant hover:text-red-500'
        } 
        backdrop-blur-sm border border-white/10 transition-all ${className}`}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <motion.div
        initial={false}
        animate={isFavorite ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={`${iconSizes[size]} ${isFavorite ? 'fill-current' : ''} transition-all`}
        />
      </motion.div>
    </motion.button>
  );
}
