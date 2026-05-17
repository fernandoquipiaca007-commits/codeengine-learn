# 📦 TODOS OS COMPONENTES - CÓDIGO COMPLETO

## 🎯 INSTRUÇÕES

Copie cada seção abaixo e crie os arquivos correspondentes.

---

## 1️⃣ ADMIN: VideoManager.tsx

**Caminho:** `admin/src/components/products/VideoManager.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Plus, Trash2, Video as VideoIcon } from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabase-admin';

interface Video {
  id: string;
  video_type: string;
  video_url: string | null;
  title: string | null;
  description: string | null;
  is_primary: boolean;
}

interface VideoManagerProps {
  productId: string;
}

export function VideoManager({ productId }: VideoManagerProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideo, setNewVideo] = useState({
    video_type: 'youtube',
    video_url: '',
    title: '',
  });

  useEffect(() => {
    loadVideos();
  }, [productId]);

  async function loadVideos() {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_videos')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addVideo() {
    if (!newVideo.video_url) return;

    try {
      const { error } = await supabaseAdmin.from('product_videos').insert({
        product_id: productId,
        video_type: newVideo.video_type,
        video_url: newVideo.video_url,
        title: newVideo.title,
        display_order: videos.length,
        is_primary: videos.length === 0,
      });

      if (error) throw error;
      setNewVideo({ video_type: 'youtube', video_url: '', title: '' });
      loadVideos();
    } catch (error) {
      console.error('Error adding video:', error);
    }
  }

  async function deleteVideo(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('product_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  }

  async function setPrimary(id: string) {
    try {
      await supabaseAdmin
        .from('product_videos')
        .update({ is_primary: false })
        .eq('product_id', productId);

      await supabaseAdmin
        .from('product_videos')
        .update({ is_primary: true })
        .eq('id', id);

      loadVideos();
    } catch (error) {
      console.error('Error setting primary:', error);
    }
  }

  if (loading) return <div className="text-center py-8">Carregando vídeos...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Vídeo</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Vídeo
            </label>
            <select
              value={newVideo.video_type}
              onChange={(e) => setNewVideo({ ...newVideo, video_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Vídeo
            </label>
            <input
              type="text"
              value={newVideo.video_url}
              onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título (opcional)
            </label>
            <input
              type="text"
              value={newVideo.title}
              onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
              placeholder="Ex: Vídeo Promocional"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={addVideo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Adicionar Vídeo
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Vídeos ({videos.length})</h3>

        {videos.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">Nenhum vídeo adicionado ainda.</p>
          </div>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
            >
              <div className="flex items-start gap-4">
                <VideoIcon className="w-8 h-8 text-blue-600" />

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {video.title || 'Sem título'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{video.video_url}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tipo: {video.video_type}
                  </p>

                  <div className="flex items-center gap-4 mt-3">
                    {video.is_primary ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Vídeo Principal
                      </span>
                    ) : (
                      <button
                        onClick={() => setPrimary(video.id)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Definir como principal
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Excluir este vídeo?')) deleteVideo(video.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 2️⃣ ADMIN: BenefitsManager.tsx

**Caminho:** `admin/src/components/products/BenefitsManager.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabase-admin';

interface Benefit {
  id: string;
  icon: string;
  title: string;
  description: string;
  display_order: number;
}

interface BenefitsManagerProps {
  productId: string;
}

export function BenefitsManager({ productId }: BenefitsManagerProps) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBenefit, setNewBenefit] = useState({
    icon: 'Code',
    title: '',
    description: '',
  });

  useEffect(() => {
    loadBenefits();
  }, [productId]);

  async function loadBenefits() {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_benefits')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBenefits(data || []);
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addBenefit() {
    if (!newBenefit.title || !newBenefit.description) return;

    try {
      const { error } = await supabaseAdmin.from('product_benefits').insert({
        product_id: productId,
        icon: newBenefit.icon,
        title: newBenefit.title,
        description: newBenefit.description,
        display_order: benefits.length,
      });

      if (error) throw error;
      setNewBenefit({ icon: 'Code', title: '', description: '' });
      loadBenefits();
    } catch (error) {
      console.error('Error adding benefit:', error);
    }
  }

  async function deleteBenefit(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('product_benefits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadBenefits();
    } catch (error) {
      console.error('Error deleting benefit:', error);
    }
  }

  if (loading) return <div className="text-center py-8">Carregando benefícios...</div>;

  const iconOptions = ['Code', 'Zap', 'Star', 'Award', 'Shield', 'Heart', 'Book', 'Users'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Benefício</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
            <select
              value={newBenefit.icon}
              onChange={(e) => setNewBenefit({ ...newBenefit, icon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {iconOptions.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
            <input
              type="text"
              value={newBenefit.title}
              onChange={(e) => setNewBenefit({ ...newBenefit, title: e.target.value })}
              placeholder="Ex: Conteúdo Premium"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              value={newBenefit.description}
              onChange={(e) => setNewBenefit({ ...newBenefit, description: e.target.value })}
              placeholder="Ex: Material de alta qualidade..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={addBenefit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Adicionar Benefício
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-2">Ícone: {benefit.icon}</div>
                <h4 className="font-semibold text-gray-900">{benefit.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{benefit.description}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Excluir este benefício?')) deleteBenefit(benefit.id);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 3️⃣ ADMIN: BonusesManager.tsx

**Caminho:** `admin/src/components/products/BonusesManager.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Plus, Trash2, Gift } from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabase-admin';

interface Bonus {
  id: string;
  title: string;
  description: string;
  original_value: number;
  is_active: boolean;
}

interface BonusesManagerProps {
  productId: string;
}

export function BonusesManager({ productId }: BonusesManagerProps) {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBonus, setNewBonus] = useState({
    title: '',
    description: '',
    original_value: 0,
  });

  useEffect(() => {
    loadBonuses();
  }, [productId]);

  async function loadBonuses() {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_bonuses')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBonuses(data || []);
    } catch (error) {
      console.error('Error loading bonuses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addBonus() {
    if (!newBonus.title || !newBonus.description) return;

    try {
      const { error } = await supabaseAdmin.from('product_bonuses').insert({
        product_id: productId,
        title: newBonus.title,
        description: newBonus.description,
        original_value: newBonus.original_value,
        display_order: bonuses.length,
        is_active: true,
      });

      if (error) throw error;
      setNewBonus({ title: '', description: '', original_value: 0 });
      loadBonuses();
    } catch (error) {
      console.error('Error adding bonus:', error);
    }
  }

  async function deleteBonus(id: string) {
    try {
      const { error } = await supabaseAdmin
        .from('product_bonuses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadBonuses();
    } catch (error) {
      console.error('Error deleting bonus:', error);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const { error } = await supabaseAdmin
        .from('product_bonuses')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      loadBonuses();
    } catch (error) {
      console.error('Error toggling bonus:', error);
    }
  }

  if (loading) return <div className="text-center py-8">Carregando bônus...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Bônus</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
            <input
              type="text"
              value={newBonus.title}
              onChange={(e) => setNewBonus({ ...newBonus, title: e.target.value })}
              placeholder="Ex: Comunidade VIP"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              value={newBonus.description}
              onChange={(e) => setNewBonus({ ...newBonus, description: e.target.value })}
              placeholder="Ex: Acesso vitalício à comunidade..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Original (R$)
            </label>
            <input
              type="number"
              value={newBonus.original_value}
              onChange={(e) =>
                setNewBonus({ ...newBonus, original_value: parseFloat(e.target.value) })
              }
              placeholder="997.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={addBonus}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Adicionar Bônus
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bonuses.map((bonus) => (
          <div
            key={bonus.id}
            className={`bg-white rounded-lg shadow-sm p-6 border ${
              bonus.is_active ? 'border-green-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <Gift className="w-8 h-8 text-purple-600" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{bonus.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{bonus.description}</p>
                <p className="text-sm font-semibold text-purple-600 mt-2">
                  Valor: R$ {bonus.original_value.toFixed(2)}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => toggleActive(bonus.id, bonus.is_active)}
                    className={`text-xs px-3 py-1 rounded ${
                      bonus.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {bonus.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Excluir este bônus?')) deleteBonus(bonus.id);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📝 CONTINUAÇÃO NO PRÓXIMO ARQUIVO

Devido ao tamanho, vou criar mais arquivos com os componentes restantes.
