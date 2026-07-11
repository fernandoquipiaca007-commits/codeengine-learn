import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Image,
  UploadCloud,
  FileText,
  DollarSign,
  Users,
  Sparkles,
  Calendar,
  Eye,
  Settings,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://codeengine-api-production-cb0c.up.railway.app";

interface CreatorProductWizardProps {
  type: "ebook" | "course" | "template" | "music" | "app" | "service";
  onClose: () => void;
  onGoToAdvancedForm: (productId: string) => void;
  setScreen: (screen: string) => void;
  displayName?: string;
  isAngola?: boolean;
}

export function CreatorProductWizard({
  type,
  onClose,
  onGoToAdvancedForm,
  setScreen,
  displayName,
  isAngola = false,
}: CreatorProductWizardProps) {
  // We only support E-book full wizard for now (Phase 1)
  const isEbook = type === "ebook";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Categories list for auto-tagging
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Product Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [storageUrl, setStorageUrl] = useState(""); // Ebook PDF path
  const [priceUSD, setPriceUSD] = useState("");
  const [priceAOA, setPriceAOA] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [affiliateEnabled, setAffiliateEnabled] = useState(false);
  const [affiliateCommissionPct, setAffiliateCommissionPct] = useState("30");

  // File objects for uploading
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [ebookProgress, setEbookProgress] = useState<number | null>(null);

  // Review / Schedule State
  const [scheduledDate, setScheduledDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  // Exchange rate USD -> AOA (approx 900 Kz per USD)
  const exchangeRate = 900;

  // Auto-calculate AOA price when USD changes
  useEffect(() => {
    if (priceUSD && !isNaN(Number(priceUSD))) {
      setPriceAOA(Math.round(Number(priceUSD) * exchangeRate).toString());
    } else {
      setPriceAOA("");
    }
  }, [priceUSD]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await supabase
          .from("categories")
          .select("id, name")
          .order("display_order", { ascending: true });
        if (data && data.length > 0) {
          setCategories(data);
          // Try to find a category related to E-books or digital products
          const found = data.find((c) =>
            c.name.toLowerCase().includes("ebook") || c.name.toLowerCase().includes("livro")
          );
          setSelectedCategoryId(found ? found.id : data[0].id);
        }
      } catch (e) {
        console.error("Error loading categories in wizard:", e);
      }
    }
    loadCategories();
  }, []);

  // Generic File Upload Handler (presigned upload with Supabase fallback)
  const uploadFile = async (
    file: File,
    bucket: string,
    setProgress: (p: number | null) => void
  ): Promise<string> => {
    setProgress(5);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    const userId = session?.user?.id;
    if (!userId || !token) throw new Error("Usuário não autenticado.");

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${userId}/${Date.now()}_${sanitizedName}`;

    setProgress(20);
    try {
      // 1. Try Presigned R2 Upload
      const presignedResponse = await fetch(
        `${BACKEND_URL}/api/admin/storage/presigned-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bucketName: bucket,
            filePath: fileName,
            contentType: file.type || "application/octet-stream",
          }),
        }
      );

      if (presignedResponse.ok) {
        const { uploadUrl, dbPath } = await presignedResponse.json();
        setProgress(50);

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (putRes.ok) {
          setProgress(100);
          return dbPath;
        }
      }
    } catch (r2Err) {
      console.warn("R2 upload failed in wizard, falling back to Supabase:", r2Err);
    }

    // 2. Fallback to Supabase Storage
    setProgress(40);
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    setProgress(90);

    if (bucket === "ebooks-private") {
      setProgress(100);
      return data.path;
    } else {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      setProgress(100);
      return urlData.publicUrl;
    }
  };

  // Upload Cover Image
  const handleCoverUpload = async (file: File) => {
    setErrorMsg(null);
    setCoverFile(file);
    try {
      const url = await uploadFile(file, "product-covers", setCoverProgress);
      setCoverUrl(url);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro ao carregar a capa: ${err.message || err}`);
      setCoverFile(null);
      setCoverProgress(null);
    }
  };

  // Upload Ebook File
  const handleEbookUpload = async (file: File) => {
    setErrorMsg(null);
    setEbookFile(file);
    try {
      const path = await uploadFile(file, "ebooks-private", setEbookProgress);
      setStorageUrl(path);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro ao carregar o arquivo: ${err.message || err}`);
      setEbookFile(null);
      setEbookProgress(null);
    }
  };

  // Save Product as Draft/Publish
  const saveProduct = async (status: "draft" | "published" | "scheduled") => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      const payload = {
        title,
        description,
        categoryId: selectedCategoryId,
        product_type: "ebook",
        price: isFree ? 0 : Number(priceUSD),
        aoaPrice: isFree ? 0 : Number(priceAOA),
        basePrice: isFree ? 0 : Number(priceUSD),
        baseCurrency: "USD",
        convertedPrice: isFree ? 0 : Number(priceAOA),
        exchangeRateUsed: exchangeRate,
        isFree,
        coverUrl,
        storageUrl,
        affiliateEnabled,
        affiliateCommissionPct: Number(affiliateCommissionPct) || 0,
        visibility: status === "published" ? "visible" : "hidden",
        status: status === "published" ? "approved" : "draft", // draft or approved
        scheduled_at: status === "scheduled" && scheduledDate ? new Date(scheduledDate).toISOString() : null,
      };

      const url = createdProductId
        ? `${BACKEND_URL}/api/collaborators/products/${createdProductId}`
        : `${BACKEND_URL}/api/collaborators/products`;

      const method = createdProductId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Erro ao salvar o produto.");
      }

      setCreatedProductId(data.productId || createdProductId);

      if (status === "published") {
        alert("E-book publicado com sucesso!");
        onClose();
        setScreen("colaborador-produtos");
      } else if (status === "scheduled") {
        alert("Publicação agendada com sucesso!");
        onClose();
        setScreen("colaborador-produtos");
      } else {
        // Draft saved successfully
        return data.productId || createdProductId;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro de conexão ao salvar produto.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && !title.trim()) {
      setErrorMsg("O título é obrigatório.");
      return;
    }
    if (step === 2 && !coverUrl) {
      setErrorMsg("Carregue a capa do e-book para continuar.");
      return;
    }
    if (step === 3 && !storageUrl) {
      setErrorMsg("Envie o arquivo PDF/EPUB do e-book para continuar.");
      return;
    }
    if (step === 4 && !isFree && (!priceUSD || isNaN(Number(priceUSD)) || Number(priceUSD) <= 0)) {
      setErrorMsg("Defina um preço válido maior que zero.");
      return;
    }

    setErrorMsg(null);
    if (step < 6) {
      // Auto-save draft in background when moving past cover/files
      if (step === 3 || step === 4 || step === 5) {
        saveProduct("draft");
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const handleCustomize = async () => {
    // Save current state as draft first
    const prodId = createdProductId || (await saveProduct("draft"));
    if (prodId) {
      onGoToAdvancedForm(prodId);
    }
  };

  const handlePreview = () => {
    if (createdProductId) {
      // Open product view page in a new window/tab in preview mode
      window.open(`/?preview=true&productId=${createdProductId}`, "_blank");
    } else {
      alert("Por favor, avance e salve o rascunho primeiro para visualizar.");
    }
  };

  // If type is not ebook, show a modern "Coming soon" friendly message that redirects to advanced form
  if (!isEbook) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0d14] p-6 text-center shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto mb-4">
            <Sparkles size={24} />
          </div>

          <h3 className="font-display font-extrabold text-white text-lg">
            Assistente Simplificado para {type === "course" ? "Curso" : type === "template" ? "Template" : type === "music" ? "Música" : type === "app" ? "Aplicativo" : "Serviço"}
          </h3>
          <p className="text-on-surface-variant text-xs mt-2 leading-relaxed font-sans">
            O assistente passo a passo rápido para este tipo de produto estará disponível em breve. Mas não te preocupes! Podes criar este produto agora mesmo usando o nosso editor avançado.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => onGoToAdvancedForm("")}
              className="w-full py-2.5 rounded-full bg-primary font-bold text-white hover:bg-primary-high transition-all text-xs flex items-center justify-center gap-1.5"
            >
              <Settings size={14} />
              Ir para Editor Avançado
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full border border-white/10 text-on-surface font-bold hover:bg-white/5 transition-all text-xs"
            >
              Voltar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#090a10] shadow-2xl overflow-hidden font-sans my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-violet-400" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">
              Criar E-book
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Wizard Progress Bar */}
        <div className="px-6 pt-5">
          <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant mb-2">
            <span>PASSO {step} DE 6</span>
            <span className="text-white font-mono">
              {Math.round((step / 6) * 100)}% CONCLUÍDO
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[260px]">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  1. Informações Básicas
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Introduz o título do teu e-book e uma descrição curta para cativar os leitores.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Título do E-book
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Guia Prático de Programação Web"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:border-violet-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Descrição / Resumo
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreve resumidamente o que os leitores vão aprender no teu e-book..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:border-violet-500 focus:outline-none transition-colors resize-none"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  2. Upload da Capa
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Envia a imagem de capa. Uma boa capa aumenta as vendas em até 3x.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-2xl p-6 bg-white/[0.01] transition-colors relative">
                {coverUrl ? (
                  <div className="text-center">
                    <img
                      src={coverUrl}
                      alt="Cover Preview"
                      className="w-28 h-36 object-cover rounded-lg shadow-lg mx-auto mb-2 border border-white/10"
                    />
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle size={10} /> Capa salva
                    </p>
                    <button
                      onClick={() => {
                        setCoverUrl("");
                        setCoverFile(null);
                        setCoverProgress(null);
                      }}
                      className="mt-2 text-[10px] text-red-400 font-bold hover:underline"
                    >
                      Remover e escolher outra
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleCoverUpload(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                      {coverProgress !== null ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                          <span className="text-xs font-bold text-white">{coverProgress}%</span>
                        </div>
                      ) : (
                        <>
                          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                            <Image size={20} className="text-violet-400" />
                          </div>
                          <span className="text-xs font-bold text-white">Carrega a capa do e-book</span>
                          <span className="text-[10px] text-on-surface-variant mt-1">
                            Recomendado: formato vertical (800x1200px) · JPG/PNG
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  3. Upload do Arquivo
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Envia o arquivo PDF ou EPUB do e-book. Ele será armazenado de forma segura e privada.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-2xl p-6 bg-white/[0.01] transition-colors relative">
                {storageUrl ? (
                  <div className="text-center">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-2">
                      <FileText size={20} className="text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-white truncate max-w-[200px]">
                      {ebookFile?.name || "Ebook salvo"}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
                      <CheckCircle size={10} /> Arquivo seguro salvo
                    </p>
                    <button
                      onClick={() => {
                        setStorageUrl("");
                        setEbookFile(null);
                        setEbookProgress(null);
                      }}
                      className="mt-2 text-[10px] text-red-400 font-bold hover:underline"
                    >
                      Substituir arquivo
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept=".pdf,.epub"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleEbookUpload(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                      {ebookProgress !== null ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                          <span className="text-xs font-bold text-white">{ebookProgress}%</span>
                        </div>
                      ) : (
                        <>
                          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                            <UploadCloud size={20} className="text-violet-400" />
                          </div>
                          <span className="text-xs font-bold text-white">Carrega o arquivo do e-book</span>
                          <span className="text-[10px] text-on-surface-variant mt-1">
                            PDF ou EPUB · máx. 50MB
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  4. Preço
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Define o valor de venda do teu e-book ou disponibiliza-o gratuitamente.
                </p>
              </div>

              <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit mb-4">
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !isFree ? "bg-violet-500 text-white" : "text-on-surface-variant hover:text-white"
                  }`}
                >
                  Pago
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isFree ? "bg-violet-500 text-white" : "text-on-surface-variant hover:text-white"
                  }`}
                >
                  Gratuito (Free)
                </button>
              </div>

              {!isFree && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Preço em USD
                      </label>
                      <div className="relative">
                        <DollarSign
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                        />
                        <input
                          type="text"
                          value={priceUSD}
                          onChange={(e) => setPriceUSD(e.target.value)}
                          placeholder="9.99"
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:border-violet-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Conversão Automática (AOA)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[10px] font-bold">
                          Kz
                        </span>
                        <input
                          type="text"
                          value={priceAOA}
                          onChange={(e) => setPriceAOA(e.target.value)}
                          placeholder="8991"
                          disabled={!isAngola}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:border-violet-500 focus:outline-none transition-colors disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
                    * A taxa de câmbio estimada da plataforma é de 1 USD = {exchangeRate} Kz.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  5. Programa de Afiliados
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Permite que outros vendedores promovam o teu e-book em troca de uma comissão por venda.
                </p>
              </div>

              {isFree ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Produtos gratuitos não suportam programa de afiliados por não gerarem comissões monetárias. Avance para o passo final.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                    <button
                      type="button"
                      onClick={() => setAffiliateEnabled(true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        affiliateEnabled ? "bg-violet-500 text-white" : "text-on-surface-variant hover:text-white"
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setAffiliateEnabled(false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !affiliateEnabled ? "bg-violet-500 text-white" : "text-on-surface-variant hover:text-white"
                      }`}
                    >
                      Não
                    </button>
                  </div>

                  {affiliateEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3"
                    >
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span>Comissão do Afiliado</span>
                        <span className="text-violet-400">{affiliateCommissionPct}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="70"
                        step="5"
                        value={affiliateCommissionPct}
                        onChange={(e) => setAffiliateCommissionPct(e.target.value)}
                        className="w-full accent-violet-500 bg-white/10 rounded-lg appearance-none h-1.5"
                      />
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        Recomendado: 30% a 50% para incentivar afiliados profissionais a promoverem o teu e-book.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  6. Revisão e Publicação
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tudo pronto! Escolha como deseja publicar o e-book na plataforma.
                </p>
              </div>

              {/* Product mini card summary */}
              <div className="flex gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Cover"
                    className="w-14 h-18 object-cover rounded-lg border border-white/10 shadow shrink-0"
                  />
                ) : (
                  <div className="w-14 h-18 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-violet-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-white truncate">{title || "Sem título"}</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2 leading-relaxed">
                    {description || "Sem descrição"}
                  </p>
                  <span className="inline-block mt-1 text-xs font-bold text-violet-400 font-mono">
                    {isFree ? "Gratuito" : `$${priceUSD} USD`}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={() => saveProduct("published")}
                  disabled={loading}
                  className="w-full py-2.5 rounded-full bg-violet-600 font-extrabold text-white hover:bg-violet-700 transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/10 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Publicar Instantaneamente
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="flex-1 py-2.5 rounded-full border border-white/10 font-bold text-white hover:bg-white/5 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={14} className="text-violet-400" />
                    Agendar Publicação
                  </button>

                  <button
                    onClick={handlePreview}
                    className="flex-1 py-2.5 rounded-full border border-white/10 font-bold text-white hover:bg-white/5 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} className="text-violet-400" />
                    Revisar
                  </button>
                </div>

                {showDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 p-3 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Escolha Data e Hora
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white text-xs font-semibold focus:outline-none"
                    />
                    <button
                      onClick={() => saveProduct("scheduled")}
                      disabled={!scheduledDate}
                      className="w-full py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Confirmar Agendamento
                    </button>
                  </motion.div>
                )}

                <div className="border-t border-white/5 pt-3 mt-1 text-center">
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Desejas configurar bônus, páginas dinâmicas ou recursos avançados?
                  </p>
                  <button
                    onClick={handleCustomize}
                    className="mt-1 text-xs font-bold text-violet-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Settings size={12} />
                    Personalizar no editor avançado
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-bold text-on-surface hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>

          {step < 6 && (
            <button
              onClick={handleNext}
              className="flex items-center gap-1 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors py-1.5 px-4 rounded-full shadow-md hover:shadow-lg hover:shadow-violet-600/10"
            >
              Avançar
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
