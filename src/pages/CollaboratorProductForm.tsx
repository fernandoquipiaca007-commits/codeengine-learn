import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, X, FileText, Image, Video, Globe, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CollaboratorProductFormProps {
  productId?: string | null;
  onClose: () => void;
  onSaveSuccess: () => void;
  collaboratorPlan: 'ebook_creator' | 'course_creator';
}

interface Category {
  id: string;
  name_pt?: string;
  name_en?: string;
  name_fr?: string;
}

export function CollaboratorProductForm({
  productId,
  onClose,
  onSaveSuccess,
  collaboratorPlan
}: CollaboratorProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'AOA'>('USD');
  const [coverUrl, setCoverUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [storageUrl, setStorageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [ctaText, setCtaText] = useState('Comprar Agora');

  // Licensing state
  const [licenseType, setLicenseType] = useState<'personal' | 'commercial'>('personal');
  const [isLifetime, setIsLifetime] = useState(true);
  const [durationDays, setDurationDays] = useState('365');

  // Upload progress/status
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProductDetails(productId);
    }
  }, [productId]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_pt, name_en, name_fr')
        .order('display_order', { ascending: true });

      if (!error && data) {
        setCategories(data);
        if (data.length > 0 && !categoryId) {
          setCategoryId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  async function fetchProductDetails(id: string) {
    setFetchingProduct(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${BACKEND_URL}/api/collaborators/products`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();

      if (data.success && data.products) {
        const prod = data.products.find((p: any) => p.id === id);
        if (prod) {
          setTitle(prod.title || '');
          setDescription(prod.description || '');
          setCategoryId(prod.category_id || '');
          setCoverUrl(prod.cover_url || '');
          setPreviewUrl(prod.preview_url || '');
          setVideoUrl(prod.video_url || '');
          setStorageUrl(prod.storage_url || '');
          setTagsInput(prod.tags ? prod.tags.join(', ') : '');
          setCtaText(prod.cta_text || 'Comprar Agora');

          // Price and Currency
          if (prod.aoa_price && Number(prod.aoa_price) > 0) {
            setPrice(String(prod.aoa_price));
            setCurrency('AOA');
          } else {
            setPrice(String(prod.price || ''));
            setCurrency('USD');
          }

          // Licensing
          const lic = prod.licensing_info || {};
          setLicenseType(lic.type === 'commercial' ? 'commercial' : 'personal');
          setIsLifetime(lic.lifetime !== false);
          setDurationDays(String(lic.duration_days || '365'));
        }
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setFormError('Erro ao carregar os detalhes do produto.');
    } finally {
      setFetchingProduct(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, bucket: string, fieldSetter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = bucket;
    setUploadProgress(prev => ({ ...prev, [key]: 'Fazendo upload...' }));
    setFormError(null);

    // Free plan file validation
    if (collaboratorPlan === 'ebook_creator' && bucket === 'ebooks-private') {
      const allowedExts = ['pdf', 'epub', 'docx', 'zip'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExts.includes(ext)) {
        setUploadProgress(prev => ({ ...prev, [key]: '' }));
        setFormError(`Formatos de arquivos para seu plano grátis são limitados a: ${allowedExts.join(', ').toUpperCase()}.`);
        return;
      }
      
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setUploadProgress(prev => ({ ...prev, [key]: '' }));
        setFormError('O tamanho máximo do arquivo de ebook é 50MB no plano grátis.');
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado.');

      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      if (bucket === 'ebooks-private') {
        // For private files, store the path in database
        fieldSetter(data.path);
        setUploadProgress(prev => ({ ...prev, [key]: 'Concluído! (Arquivo privado salvo)' }));
      } else {
        // For public buckets (covers, previews, videos)
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        fieldSetter(urlData.publicUrl);
        setUploadProgress(prev => ({ ...prev, [key]: 'Concluído!' }));
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadProgress(prev => ({ ...prev, [key]: '' }));
      setFormError(`Erro ao fazer upload do ficheiro: ${err.message || err}`);
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    if (!title || !description || !categoryId || !price || !coverUrl || !storageUrl) {
      setFormError('Por favor preencha todos os campos obrigatórios e envie os arquivos necessários.');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFormError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const licensingInfo = {
        type: licenseType,
        lifetime: isLifetime,
        duration_days: isLifetime ? null : Number(durationDays)
      };

      const payload = {
        title,
        description,
        categoryId,
        price: Number(price),
        currency,
        coverUrl,
        previewUrl,
        videoUrl: collaboratorPlan === 'course_creator' ? videoUrl : '',
        storageUrl,
        tags,
        ctaText,
        licensingInfo
      };

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const url = productId 
        ? `${BACKEND_URL}/api/collaborators/products/${productId}`
        : `${BACKEND_URL}/api/collaborators/products`;
      
      const method = productId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        onSaveSuccess();
      } else {
        setFormError(data.error || 'Erro ao guardar o produto.');
      }
    } catch (err: any) {
      setFormError('Erro de conexão ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/95 backdrop-blur-xl p-8 max-w-4xl mx-auto shadow-2xl overlay-premium text-white font-sans">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">
            {productId ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Os produtos salvos serão enviados como rascunhos para aprovação da administração.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-on-surface-variant hover:bg-white/5 hover:text-white transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {formError && (
        <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Lado Esquerdo: Metadados */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Título do Produto *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Guia Completo de CSS Flexbox & Grid"
                className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Descrição Detalhada *</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva detalhadamente o conteúdo, o que o aluno irá aprender e os requisitos."
                className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Categoria *</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="bg-surface-high text-white">
                      {c.name_pt || c.name_en || c.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="flexbox, css, design"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Preço *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Moeda *</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as 'USD' | 'AOA')}
                  className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                >
                  <option value="USD" className="bg-surface-high text-white">USD ($)</option>
                  <option value="AOA" className="bg-surface-high text-white">AOA (Kz)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Texto do Botão CTA (Compra)</label>
              <input
                type="text"
                value={ctaText}
                onChange={e => setCtaText(e.target.value)}
                placeholder="Comprar Agora"
                className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Lado Direito: Arquivos & Licenciamento */}
          <div className="space-y-5">
            {/* Upload Capa */}
            <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/5">
              <span className="block text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                <Image size={16} className="text-on-surface-variant" /> Imagem de Capa (PNG/JPG) *
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => handleFileUpload(e, 'product-covers', setCoverUrl)}
                className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
              />
              {uploadProgress['product-covers'] && (
                <span className="text-xs text-primary mt-1 block font-medium font-mono">{uploadProgress['product-covers']}</span>
              )}
              {coverUrl && (
                <div className="mt-3 relative w-32 h-20 rounded-lg overflow-hidden border border-white/10">
                  <img src={coverUrl} className="w-full h-full object-cover" alt="Preview Capa" />
                </div>
              )}
            </div>

            {/* Upload Ficheiro do Produto */}
            <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/5">
              <span className="block text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                <FileText size={16} className="text-on-surface-variant" /> Arquivo do Produto (Download Seguro) *
              </span>
              <span className="block text-xs text-on-surface-variant mb-2 font-sans">
                {collaboratorPlan === 'ebook_creator' 
                  ? 'Limitação do plano grátis: Apenas PDF, EPUB, DOCX, ZIP (Máx. 50MB)'
                  : 'Qualquer formato de arquivo permitido (Máx. 2GB)'}
              </span>
              <input
                type="file"
                onChange={e => handleFileUpload(e, 'ebooks-private', setStorageUrl)}
                className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
              />
              {uploadProgress['ebooks-private'] && (
                <span className="text-xs text-primary mt-1 block font-medium font-mono">{uploadProgress['ebooks-private']}</span>
              )}
              {storageUrl && (
                <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                  <ShieldCheck size={14} /> Arquivo carregado com sucesso.
                </div>
              )}
            </div>

            {/* Upload Preview (Opcional) */}
            <div className="rounded-xl border border-dashed border-white/10 p-4 bg-white/5">
              <span className="block text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                <Globe size={16} className="text-on-surface-variant" /> Ficheiro de Amostra/Preview (PDF/Imagem - Opcional)
              </span>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={e => handleFileUpload(e, 'product-previews', setPreviewUrl)}
                className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
              />
              {uploadProgress['product-previews'] && (
                <span className="text-xs text-primary mt-1 block font-medium font-mono">{uploadProgress['product-previews']}</span>
              )}
              {previewUrl && (
                <div className="mt-2 text-xs text-on-surface-variant truncate">
                  URL pública da amostra gerada.
                </div>
              )}
            </div>

            {/* Vídeo de Apresentação (Premium Apenas) */}
            <div className={`rounded-xl border border-dashed p-4 ${
              collaboratorPlan === 'course_creator' 
                ? 'border-white/10 bg-white/5' 
                : 'border-yellow-500/20 bg-yellow-500/5 opacity-75'
            }`}>
              <span className="block text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                <Video size={16} className="text-on-surface-variant" /> Vídeo de Introdução (Opcional - Premium)
              </span>
              {collaboratorPlan !== 'course_creator' ? (
                <div className="text-xs text-yellow-300 flex items-start gap-1 mt-1.5">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Vídeos de introdução e streaming estão disponíveis apenas para criadores do plano <strong>Course Creator</strong>.
                  </span>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={e => handleFileUpload(e, 'product-videos', setVideoUrl)}
                    className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer mt-2"
                  />
                  {uploadProgress['product-videos'] && (
                    <span className="text-xs text-primary mt-1 block font-medium font-mono">{uploadProgress['product-videos']}</span>
                  )}
                </>
              )}
            </div>

            {/* Painel de Licenciamento */}
            <div className="rounded-xl border border-white/10 p-4 bg-white/5">
              <span className="block text-sm font-bold text-white mb-3 font-display">Opções de Licenciamento</span>
              
              <div className="space-y-3">
                {/* Tipo de Licença */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Permissões de Uso</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLicenseType('personal')}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                        licenseType === 'personal'
                          ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                          : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Uso Pessoal
                    </button>
                    <button
                      type="button"
                      onClick={() => setLicenseType('commercial')}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                        licenseType === 'commercial'
                          ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                          : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Uso Comercial
                    </button>
                  </div>
                </div>

                {/* Duração */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Duração do Acesso</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setIsLifetime(true)}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                        isLifetime
                          ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                          : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Acesso Vitalício
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLifetime(false)}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                        !isLifetime
                          ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(192,193,255,0.1)]'
                          : 'border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Tempo Limitado
                    </button>
                  </div>

                  {!isLifetime && (
                    <input
                      type="number"
                      value={durationDays}
                      onChange={e => setDurationDays(e.target.value)}
                      placeholder="Dias de acesso (Ex: 365)"
                      className="w-full rounded-xl bg-surface-high border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 font-mono"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-on-surface hover:bg-white/10 transition-all text-sm font-display uppercase tracking-widest text-xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-on-surface px-6 py-3 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm disabled:opacity-50 font-display uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(192,193,255,0.4)]"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
            ) : <Save size={18} />}
            Guardar Rascunho
          </button>
        </div>
      </form>
    </div>
  );
}
