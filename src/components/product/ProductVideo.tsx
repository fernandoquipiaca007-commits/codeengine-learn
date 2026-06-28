import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { queryCache } from '../../lib/queryCache';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../contexts/LocaleContext';
import { getPublicStorageUrl } from '../../lib/storage-path';

interface Video {
  id: string;
  video_type: 'youtube' | 'vimeo' | 'instagram' | 'upload' | 'google-drive';
  video_url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
}

interface ProductVideoProps {
  productId: string;
  refreshKey?: number;
}

export function ProductVideo({ productId, refreshKey = 0 }: ProductVideoProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('pages', { lng: locale });
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadVideos();
  }, [productId, refreshKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((err) => {
              console.log('[ProductVideo] Autoplay blocked or failed:', err);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
    };
  }, [activeVideo, loading]);

  async function loadVideos() {
    try {
      const fetcher = async () => {
        let { data, error } = await supabase
          .from('product_videos')
          .select('*')
          .eq('product_id', productId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          const fallback = await supabase
            .from('product_videos')
            .select('*')
            .eq('product_id', productId)
            .order('display_order', { ascending: true });
          data = fallback.data;
          error = fallback.error;
        }

        if (error) throw error;
        return data || [];
      };

      const cacheKey = `product-videos-${productId}`;
      const cachedData = await queryCache.get(cacheKey, fetcher);
      setVideos(cachedData);
      
      // Auto-play first video
      if (cachedData && cachedData.length > 0) {
        setActiveVideo(cachedData[0].id);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }

  function getEmbedUrl(video: Video): string {
    const url = video.video_url?.trim() || '';
    if (!url) return '';

    if (video.video_type === 'youtube') {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (video.video_type === 'vimeo') {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    if (video.video_type === 'instagram') {
      return url.replace('/p/', '/embed/p/');
    }

    if (video.video_type === 'google-drive') {
      // URL is already normalized to /file/d/ID/preview by the admin
      // But handle raw share links just in case
      if (url.includes('/preview')) return url;
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
      return url;
    }
    
    return url;
  }

  if (loading || videos.length === 0) return null;

  const activeVideoData = videos.find(v => v.id === activeVideo) || videos[0];

  return (
    <section className="mt-24">
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-4">
          {t('product.seeInAction')}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          {t('product.learnMoreVideos')}
        </p>
      </div>

      <div className="space-y-8">
        {/* Main Video Player */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <div className="aspect-video bg-surface-highest relative">
            {activeVideoData.video_type === 'upload' ? (
              <video
                ref={videoRef}
                src={getPublicStorageUrl(activeVideoData.video_url, 'product-videos')}
                controls
                preload="metadata"
                playsInline
                muted
                loop
                className="w-full h-full"
                poster={getPublicStorageUrl(activeVideoData.thumbnail_url, 'product-covers') || undefined}
              />
            ) : getEmbedUrl(activeVideoData) ? (
              <iframe
                src={getEmbedUrl(activeVideoData)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeVideoData.title || 'Video'}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">
                {t('product.videoUnavailable')}
              </div>
            )}
          </div>
          
          {(activeVideoData.title || activeVideoData.description) && (
            <div className="p-6">
              {activeVideoData.title && (
                <h3 className="font-display text-2xl font-semibold text-on-surface mb-2">
                  {activeVideoData.title}
                </h3>
              )}
              {activeVideoData.description && (
                <p className="font-sans text-base text-on-surface-variant">
                  {activeVideoData.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Video Thumbnails */}
        {videos.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => setActiveVideo(video.id)}
                className={`glass-panel rounded-xl overflow-hidden border transition-all ${
                  activeVideo === video.id
                    ? 'border-primary/50 ring-2 ring-primary/30'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="aspect-video bg-surface-highest relative group">
                  {video.thumbnail_url ? (
                    <img
                      src={getPublicStorageUrl(video.thumbnail_url, 'product-covers')}
                      alt={video.title || 'Miniatura do vídeo'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                </div>
                
                {video.title && (
                  <div className="p-3">
                    <p className="font-display text-xs font-semibold text-on-surface truncate">
                      {video.title}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
