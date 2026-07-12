import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  X,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
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
  Lock,
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
  collaboratorPlan?: 'ebook_creator' | 'course_creator';
}

export function CreatorProductWizard({
  type,
  onClose,
  onGoToAdvancedForm,
  setScreen,
  displayName,
  isAngola = false,
  collaboratorPlan = 'ebook_creator',
}: CreatorProductWizardProps) {
  const isEbook = type === "ebook";
  const isCourse = type === "course";

  // Course Specific Form State (Step 3: First Lesson)
  const [lessonTitle, setLessonTitle] = useState("Aula 1: Introdução");
  const [lessonSourceType, setLessonSourceType] = useState<"upload" | "link">("link");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [lessonUploadProgress, setLessonUploadProgress] = useState<number | null>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Categories list for auto-tagging
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [visibility, setVisibility] = useState<"public" | "hidden">("public");

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

  // Load subcategories when category changes
  useEffect(() => {
    async function loadSubcategories() {
      if (!selectedCategoryId) {
        setSubcategories([]);
        setSelectedSubcategoryId("");
        return;
      }
      try {
        const { data } = await supabase
          .from("subcategories")
          .select("id, category_id, name")
          .eq("category_id", selectedCategoryId)
          .order("display_order", { ascending: true });
        if (data) {
          setSubcategories(data);
          const exists = data.some((s) => s.id === selectedSubcategoryId);
          if (!exists) {
            setSelectedSubcategoryId("");
          }
        }
      } catch (e) {
        console.error("Error loading subcategories in wizard:", e);
      }
    }
    loadSubcategories();
  }, [selectedCategoryId]);

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
          // Try to find a category related to E-books or Courses depending on the wizard type
          let found;
          if (type === "course") {
            found = data.find((c) =>
              c.name.toLowerCase().includes("curso") || c.name.toLowerCase().includes("course")
            );
          } else {
            found = data.find((c) =>
              c.name.toLowerCase().includes("ebook") || c.name.toLowerCase().includes("livro")
            );
          }
          setSelectedCategoryId(found ? found.id : data[0].id);
        }
      } catch (e) {
        console.error("Error loading categories in wizard:", e);
      }
    }
    loadCategories();
  }, []);

  // Load wizard state from localStorage on mount if returning from preview/advanced form
  useEffect(() => {
    const savedStep = localStorage.getItem("wizard_active_step");
    if (savedStep) {
      setStep(Number(savedStep));
      setTitle(localStorage.getItem("wizard_form_title") || "");
      setDescription(localStorage.getItem("wizard_form_description") || "");
      setCoverUrl(localStorage.getItem("wizard_form_coverUrl") || "");
      setStorageUrl(localStorage.getItem("wizard_form_storageUrl") || "");
      setPriceUSD(localStorage.getItem("wizard_form_priceUSD") || "");
      setPriceAOA(localStorage.getItem("wizard_form_priceAOA") || "");
      setIsFree(localStorage.getItem("wizard_form_isFree") === "true");
      setAffiliateEnabled(localStorage.getItem("wizard_form_affiliateEnabled") === "true");
      setAffiliateCommissionPct(localStorage.getItem("wizard_form_affiliateCommissionPct") || "30");
      setCreatedProductId(localStorage.getItem("open_creator_product_id") || null);

      setLessonTitle(localStorage.getItem("wizard_form_lessonTitle") || "Aula 1: Introdução");
      setLessonSourceType((localStorage.getItem("wizard_form_lessonSourceType") as any) || "link");
      setLessonVideoUrl(localStorage.getItem("wizard_form_lessonVideoUrl") || "");

      const savedCatId = localStorage.getItem("wizard_form_categoryId");
      if (savedCatId) setSelectedCategoryId(savedCatId);
      const savedSubcatId = localStorage.getItem("wizard_form_subcategoryId");
      if (savedSubcatId) setSelectedSubcategoryId(savedSubcatId);
      const savedVis = localStorage.getItem("wizard_form_visibility");
      if (savedVis) setVisibility(savedVis as "public" | "hidden");

      // Clear them so next fresh wizard starts from clean state
      localStorage.removeItem("wizard_active_step");
      localStorage.removeItem("wizard_active_type");
      localStorage.removeItem("wizard_form_title");
      localStorage.removeItem("wizard_form_description");
      localStorage.removeItem("wizard_form_coverUrl");
      localStorage.removeItem("wizard_form_storageUrl");
      localStorage.removeItem("wizard_form_priceUSD");
      localStorage.removeItem("wizard_form_priceAOA");
      localStorage.removeItem("wizard_form_isFree");
      localStorage.removeItem("wizard_form_affiliateEnabled");
      localStorage.removeItem("wizard_form_affiliateCommissionPct");
      localStorage.removeItem("wizard_form_categoryId");
      localStorage.removeItem("wizard_form_subcategoryId");
      localStorage.removeItem("wizard_form_visibility");
      localStorage.removeItem("wizard_form_lessonTitle");
      localStorage.removeItem("wizard_form_lessonSourceType");
      localStorage.removeItem("wizard_form_lessonVideoUrl");
    }
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

  const [lessonVideoStoragePath, setLessonVideoStoragePath] = useState("");

  const handleLessonVideoUpload = async (file: File) => {
    setErrorMsg(null);
    setLessonFile(file);
    try {
      const path = await uploadFile(file, "ebooks-private", setLessonUploadProgress);
      setLessonVideoStoragePath(path);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Erro ao carregar o vídeo da aula: ${err.message || err}`);
      setLessonFile(null);
      setLessonUploadProgress(null);
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
        subcategoryId: selectedSubcategoryId || null,
        product_type: isCourse ? "course" : "ebook",
        price: isFree ? 0 : Number(priceUSD),
        aoaPrice: isFree ? 0 : Number(priceAOA),
        basePrice: isFree ? 0 : Number(priceUSD),
        baseCurrency: "USD",
        convertedPrice: isFree ? 0 : Number(priceAOA),
        exchangeRateUsed: exchangeRate,
        isFree,
        coverUrl,
        storageUrl: isCourse ? null : storageUrl,
        affiliateEnabled,
        affiliateCommissionPct: Number(affiliateCommissionPct) || 0,
        visibility,
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

      const pId = data.product?.id || data.productId || createdProductId;
      setCreatedProductId(pId);

      // If it is a course, let's create the default module and first lesson
      if (isCourse && pId) {
        // 1. Check if module already exists to prevent duplicate insertion on updates
        const { data: existingModules } = await supabase
          .from("course_modules")
          .select("id")
          .eq("product_id", pId)
          .limit(1);

        let moduleId = "";
        if (existingModules && existingModules.length > 0) {
          moduleId = existingModules[0].id;
        } else {
          // Create new module
          const { data: newMod, error: modError } = await supabase
            .from("course_modules")
            .insert({
              product_id: pId,
              title: "Módulo 1: Introdução",
              description: "Módulo inicial do curso.",
              display_order: 0,
            })
            .select()
            .single();

          if (modError) {
            console.error("Error creating module in wizard:", modError);
          } else if (newMod) {
            moduleId = newMod.id;
          }
        }

        if (moduleId) {
          // 2. Check if lesson already exists
          const { data: existingLessons } = await supabase
            .from("course_lessons")
            .select("id")
            .eq("product_id", pId)
            .eq("module_id", moduleId)
            .limit(1);

          if (!existingLessons || existingLessons.length === 0) {
            // Create new lesson
            const { error: lessonError } = await supabase
              .from("course_lessons")
              .insert({
                product_id: pId,
                module_id: moduleId,
                title: lessonTitle || "Aula 1: Introdução",
                description: "Primeira aula do curso.",
                display_order: 0,
                lesson_type: "video",
                video_storage_path: lessonSourceType === "upload" ? lessonVideoStoragePath : null,
                external_url: lessonSourceType === "link" ? lessonVideoUrl : null,
                is_preview: false,
                is_active: true,
              });

            if (lessonError) {
              console.error("Error creating lesson in wizard:", lessonError);
            }
          } else {
            // Update existing lesson video/URL
            const { error: lessonUpdateError } = await supabase
              .from("course_lessons")
              .update({
                title: lessonTitle || "Aula 1: Introdução",
                video_storage_path: lessonSourceType === "upload" ? lessonVideoStoragePath : null,
                external_url: lessonSourceType === "link" ? lessonVideoUrl : null,
              })
              .eq("id", existingLessons[0].id);

            if (lessonUpdateError) {
              console.error("Error updating lesson in wizard:", lessonUpdateError);
            }
          }
        }
      }

      if (status === "published") {
        alert(isCourse ? "Curso publicado com sucesso!" : "E-book publicado com sucesso!");
        onClose();
        setScreen("colaborador-produtos");
      } else if (status === "scheduled") {
        alert(isCourse ? "Publicação do curso agendada com sucesso!" : "Publicação agendada com sucesso!");
        onClose();
        setScreen("colaborador-produtos");
      } else {
        // Draft saved successfully
        return pId;
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
      setErrorMsg(isCourse ? "Carregue a capa do curso para continuar." : "Carregue a capa do e-book para continuar.");
      return;
    }
    if (step === 3) {
      if (isEbook && !storageUrl) {
        setErrorMsg("Envie o arquivo PDF/EPUB do e-book para continuar.");
        return;
      }
      if (isCourse) {
        if (!lessonTitle.trim()) {
          setErrorMsg("O título da primeira aula é obrigatório.");
          return;
        }
        if (lessonSourceType === "upload" && !lessonVideoStoragePath) {
          setErrorMsg("Carregue o arquivo de vídeo da primeira aula para continuar.");
          return;
        }
        if (lessonSourceType === "link" && !lessonVideoUrl.trim()) {
          setErrorMsg("Insira o link do vídeo da primeira aula para continuar.");
          return;
        }
      }
    }
    if (step === 4 && !isFree && (!priceUSD || isNaN(Number(priceUSD)) || Number(priceUSD) <= 0)) {
      setErrorMsg("Defina um preço válido maior que zero.");
      return;
    }

    setErrorMsg(null);
    if (step < 6) {
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
      localStorage.setItem("wizard_active_step", "6");
      localStorage.setItem("wizard_active_type", type);
      localStorage.setItem("wizard_form_title", title);
      localStorage.setItem("wizard_form_description", description);
      localStorage.setItem("wizard_form_coverUrl", coverUrl);
      localStorage.setItem("wizard_form_storageUrl", storageUrl);
      localStorage.setItem("wizard_form_priceUSD", priceUSD);
      localStorage.setItem("wizard_form_priceAOA", priceAOA);
      localStorage.setItem("wizard_form_isFree", isFree ? "true" : "false");
      localStorage.setItem("wizard_form_affiliateEnabled", affiliateEnabled ? "true" : "false");
      localStorage.setItem("wizard_form_affiliateCommissionPct", affiliateCommissionPct);
      localStorage.setItem("wizard_form_categoryId", selectedCategoryId);
      localStorage.setItem("wizard_form_subcategoryId", selectedSubcategoryId);
      localStorage.setItem("wizard_form_visibility", visibility);
      localStorage.setItem("wizard_form_lessonTitle", lessonTitle);
      localStorage.setItem("wizard_form_lessonSourceType", lessonSourceType);
      localStorage.setItem("wizard_form_lessonVideoUrl", lessonVideoUrl);
      localStorage.setItem("open_creator_product_id", prodId);
      onGoToAdvancedForm(prodId);
    }
  };

  const handlePreview = async () => {
    const prodId = createdProductId || (await saveProduct("draft"));
    if (prodId) {
      // Save wizard state to localStorage so we can resume later!
      localStorage.setItem("wizard_active_step", "6");
      localStorage.setItem("wizard_active_type", type);
      localStorage.setItem("wizard_form_title", title);
      localStorage.setItem("wizard_form_description", description);
      localStorage.setItem("wizard_form_coverUrl", coverUrl);
      localStorage.setItem("wizard_form_storageUrl", storageUrl);
      localStorage.setItem("wizard_form_priceUSD", priceUSD);
      localStorage.setItem("wizard_form_priceAOA", priceAOA);
      localStorage.setItem("wizard_form_isFree", isFree ? "true" : "false");
      localStorage.setItem("wizard_form_affiliateEnabled", affiliateEnabled ? "true" : "false");
      localStorage.setItem("wizard_form_affiliateCommissionPct", affiliateCommissionPct);
      localStorage.setItem("wizard_form_categoryId", selectedCategoryId);
      localStorage.setItem("wizard_form_subcategoryId", selectedSubcategoryId);
      localStorage.setItem("wizard_form_visibility", visibility);
      localStorage.setItem("wizard_form_lessonTitle", lessonTitle);
      localStorage.setItem("wizard_form_lessonSourceType", lessonSourceType);
      localStorage.setItem("wizard_form_lessonVideoUrl", lessonVideoUrl);
      localStorage.setItem("open_creator_product_id", prodId);
      localStorage.setItem("open_creator_product_review", "true");

      onGoToAdvancedForm(prodId);
    }
  };

  // If type is not ebook or course, show a modern "Coming soon" friendly message that redirects to advanced form
  if (!isEbook && !isCourse) {
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
            {isCourse ? (
              <GraduationCap size={16} className="text-violet-400" />
            ) : (
              <BookOpen size={16} className="text-violet-400" />
            )}
            <span className="text-xs font-bold text-white font-mono uppercase tracking-widest">
              {isCourse ? "Criar Curso" : "Criar E-book"}
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
                  {isCourse ? "Introduz o título do teu curso e uma descrição curta para cativar os alunos." : "Introduz o título do teu e-book e uma descrição curta para cativar os leitores."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {isCourse ? "Título do Curso" : "Título do E-book"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isCourse ? "Ex: Curso Completo de Programação Web" : "Ex: Guia Prático de Programação Web"}
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
                  placeholder={isCourse ? "Descreve resumidamente o que os alunos vão aprender no teu curso..." : "Descreve resumidamente o que os leitores vão aprender no teu e-book..."}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:border-violet-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Subcategoria
                </label>
                <select
                  value={selectedSubcategoryId}
                  onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                  disabled={subcategories.length === 0}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:border-violet-500 focus:outline-none transition-colors disabled:opacity-50"
                >
                  <option value="" className="bg-neutral-950 text-white">
                    Selecionar subcategoria (opcional)
                  </option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id} className="bg-neutral-950 text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Visibilidade do Produto
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                      visibility === "public"
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold">Público</span>
                    <span className="text-[9px] opacity-70 mt-0.5">Visível no catálogo geral da biblioteca</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("hidden")}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                      visibility === "hidden"
                        ? "border-violet-500 bg-violet-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold">Oculto</span>
                    <span className="text-[9px] opacity-70 mt-0.5">Apenas acessível via link direto</span>
                  </button>
                </div>
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
                          <span className="text-xs font-bold text-white">
                            {isCourse ? "Carrega a capa do curso" : "Carrega a capa do e-book"}
                          </span>
                          <span className="text-[10px] text-on-surface-variant mt-1">
                            {isCourse ? "Recomendado: formato horizontal (1280x720px) · JPG/PNG" : "Recomendado: formato vertical (800x1200px) · JPG/PNG"}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && isEbook && (
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

          {step === 3 && isCourse && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 font-sans"
            >
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  3. Primeira Aula do Curso
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Um curso precisa de pelo menos 1 aula ativa para ser publicado. Adicione a sua aula inaugural agora.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Título da Primeira Aula *
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Ex: Aula 1: Boas-vindas e Introdução ao Curso"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:border-violet-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Origem do Vídeo da Aula
                </label>
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setLessonSourceType("link");
                      setErrorMsg(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      lessonSourceType === "link" ? "bg-violet-500 text-white" : "text-on-surface-variant hover:text-white"
                    }`}
                  >
                    Link Externo (YouTube/Vimeo)
                  </button>
                   <button
                    type="button"
                    onClick={() => {
                      if (collaboratorPlan !== 'course_creator') {
                        setErrorMsg("O upload de vídeo próprio requer o Plano Premium. Selecione 'Link Externo' ou faça upgrade no Painel.");
                        return;
                      }
                      setLessonSourceType("upload");
                      setErrorMsg(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      lessonSourceType === "upload" ? "bg-violet-500 text-white" : "text-on-surface-variant hover:text-white"
                    }`}
                  >
                    Fazer Upload do Vídeo
                    {collaboratorPlan !== 'course_creator' && <Lock size={10} className="opacity-60" />}
                  </button>
                </div>
              </div>

              {lessonSourceType === "link" ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Link do Vídeo (YouTube, Vimeo, Loom) *
                  </label>
                  <input
                    type="text"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:border-violet-500 focus:outline-none transition-colors"
                  />
                  <p className="text-[9px] text-on-surface-variant leading-relaxed">
                    * Ideal para começar rápido usando hospedagem gratuita de vídeos externos.
                  </p>
                  
                  {/* Tutorial video for YouTube unlisted links */}
                  <div className="mt-2 border border-white/10 bg-white/5 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-violet-400">💡 Como obter o link não listado no YouTube de forma segura:</p>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-black">
                      <iframe
                        src="https://www.youtube.com/embed/SVB2jXOcYXY"
                        title="Tutorial: Vídeo Não Listado"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-2xl p-6 bg-white/[0.01] transition-colors relative">
                  {lessonVideoStoragePath ? (
                    <div className="text-center">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-2">
                        <UploadCloud size={20} className="text-emerald-400" />
                      </div>
                      <p className="text-xs font-bold text-white truncate max-w-[200px]">
                        {lessonFile?.name || "Vídeo salvo"}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
                        <CheckCircle size={10} /> Vídeo enviado com sucesso
                      </p>
                      <button
                        onClick={() => {
                          setLessonVideoStoragePath("");
                          setLessonFile(null);
                          setLessonUploadProgress(null);
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
                        accept="video/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleLessonVideoUpload(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center pointer-events-none">
                        {lessonUploadProgress !== null ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                            <span className="text-xs font-bold text-white">{lessonUploadProgress}%</span>
                          </div>
                        ) : (
                          <>
                            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                              <UploadCloud size={20} className="text-violet-400" />
                            </div>
                            <span className="text-xs font-bold text-white">Carrega o vídeo da primeira aula</span>
                            <span className="text-[10px] text-on-surface-variant mt-1">
                              Formatos sugeridos: MP4, MOV · máx. 100MB
                            </span>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
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
                  {isCourse ? "Define o valor de venda do teu curso ou disponibiliza-o gratuitamente." : "Define o valor de venda do teu e-book ou disponibiliza-o gratuitamente."}
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
                  {isCourse ? "Permite que outros vendedores promovam o teu curso em troca de uma comissão por venda." : "Permite que outros vendedores promovam o teu e-book em troca de uma comissão por venda."}
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
                        {isCourse ? "Recomendado: 30% a 50% para incentivar afiliados profissionais a promoverem o teu curso." : "Recomendado: 30% a 50% para incentivar afiliados profissionais a promoverem o teu e-book."}
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
                  {isCourse ? "Tudo pronto! Escolha como deseja publicar o curso na plataforma." : "Tudo pronto! Escolha como deseja publicar o e-book na plataforma."}
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
                    {isCourse ? (
                      <GraduationCap size={16} className="text-violet-400" />
                    ) : (
                      <BookOpen size={16} className="text-violet-400" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-white truncate">{title || "Sem título"}</h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2 leading-relaxed">
                    {description || "Sem descrição"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-bold text-violet-400 font-mono">
                      {isFree ? "Gratuito" : `$${priceUSD} USD`}
                    </span>
                    <span className="text-white/20 text-[9px]">•</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      visibility === "public"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}>
                      {visibility === "public" ? "Público" : "Oculto"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Summary Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-[10px] font-sans text-white/70">
                <div className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-0.5">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider block text-[9px]">Preço</span>
                  <span className="font-bold text-white font-mono text-xs">
                    {isFree ? "Gratuito (Free)" : `$${priceUSD} USD ${isAngola && priceAOA ? `/ Kz ${priceAOA} AOA` : ""}`}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-0.5">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider block text-[9px]">Visibilidade</span>
                  <span className={`font-bold text-xs ${visibility === "public" ? "text-emerald-400" : "text-amber-400"}`}>
                    {visibility === "public" ? "Público (Biblioteca)" : "Oculto (Link Direto)"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-0.5">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider block text-[9px]">Afiliados</span>
                  <span className="font-bold text-white text-xs">
                    {affiliateEnabled ? `Ativo (${affiliateCommissionPct}% comissão)` : "Inativo"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 space-y-0.5 truncate">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider block text-[9px]">Subcategoria</span>
                  <span className="font-bold text-white text-xs truncate block">
                    {selectedSubcategoryId ? (subcategories.find((s) => s.id === selectedSubcategoryId)?.name || "Nenhuma") : "Nenhuma"}
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
