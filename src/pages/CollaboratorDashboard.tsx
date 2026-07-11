import { useState, useEffect } from "react";

import { motion } from "motion/react";

import { supabase } from "../lib/supabase";

import { useTranslation } from "react-i18next";

import {
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Landmark,
  Mail,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FileText,
  ExternalLink,
  Award,
  ShieldCheck,
  Video,
  PlayCircle,
  Users,
  Percent,
  Search,
  Briefcase,
  Eye,
  Check,
  ArrowLeft,
  Megaphone,
  Smartphone,
} from "lucide-react";

import { useUserCountry } from "../contexts/UserCountryContext";

import { CountryRequiredModal } from "../components/CountryRequiredModal";

import AdsDashboard from "../components/collaborator/AdsDashboard";

interface CollaboratorDashboardProps {
  setScreen: (screen: string) => void;

  onGoToProducts: () => void;
}

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://codeengine-api-production-cb0c.up.railway.app";

interface CollaboratorProfile {
  id: string;

  displayName: string;

  plan: string;

  payoutMethod: "paypal" | "iban";

  payoutInfo: {
    email?: string;

    bankName?: string;

    bankHolder?: string;

    iban?: string;
  };

  planExpiresAt?: string;

  upgradeMethod?: "stripe" | "fastpay";

  upgradeStatus?: "none" | "pending_approval" | "approved" | "rejected";

  upgradeReceiptUrl?: string;

  facipayAccount?: string;
}

export function CollaboratorDashboard({
  setScreen,
  onGoToProducts,
}: CollaboratorDashboardProps) {
  const { t } = useTranslation("pages");

  const { country, isAngola, isLoading: countryLoading } = useUserCountry();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<CollaboratorProfile | null>(null);

  const [balance, setBalance] = useState<any>(null);

  const [ledger, setLedger] = useState<any[]>([]);

  const [submittingEscrow, setSubmittingEscrow] = useState<string | null>(null);

  async function handleRequestRelease(purchaseId: string) {
    if (!window.confirm('Tem certeza de que deseja solicitar a liberação do pagamento para este serviço? O cliente será notificado e terá 7 dias para contestar antes da auto-liberação.')) {
      return;
    }
    setSubmittingEscrow(purchaseId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';
      const response = await fetch(`${BACKEND_URL}/api/collaborators/escrow/${purchaseId}/request-release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const res = await response.json();
      if (!res.success) {
        alert(res.error || 'Erro ao solicitar liberação.');
      } else {
        alert('Liberação de pagamento solicitada com sucesso!');
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao solicitar liberação.');
    } finally {
      setSubmittingEscrow(null);
    }
  }

  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Withdrawal Request Modal / State (USD)

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const [modalError, setModalError] = useState<string | null>(null);

  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // AOA Withdrawal Modal / State

  const [showWithdrawAoaModal, setShowWithdrawAoaModal] = useState(false);

  const [withdrawAoaAmount, setWithdrawAoaAmount] = useState<string>("");

  const [withdrawAoaMethod, setWithdrawAoaMethod] = useState<
    "iban_aoa" | "facipay_p2p" | "paypal_aoa"
  >("iban_aoa");

  const [submittingWithdrawAoa, setSubmittingWithdrawAoa] = useState(false);

  const [aoaModalError, setAoaModalError] = useState<string | null>(null);

  const [aoaModalSuccess, setAoaModalSuccess] = useState<string | null>(null);

  // Currency filter for dashboard view

  const [walletView, setWalletView] = useState<
    "usd" | "aoa" | "affiliates" | "founder" | "analytics" | "ads" | "profile" | "community"
  >("usd");

  const [hasDefaultedView, setHasDefaultedView] = useState(false);

  useEffect(() => {
    if (!hasDefaultedView && !countryLoading) {
      setWalletView(isAngola ? "aoa" : "usd");

      setHasDefaultedView(true);
    }
  }, [isAngola, countryLoading, hasDefaultedView]);

  useEffect(() => {
    if (!isAngola) {
      setTempPayoutMethod("paypal");
    }
  }, [isAngola]);

  const [affiliates, setAffiliates] = useState<any[]>([]);

  const [bioText, setBioText] = useState("");

  const [bioSaving, setBioSaving] = useState(false);

  const [bioSaved, setBioSaved] = useState(false);

  const [bioError, setBioError] = useState<string | null>(null);

  // Communities State & Forms
  const [communities, setCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newCommTitle, setNewCommTitle] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [newCommLink, setNewCommLink] = useState("");
  const [submittingComm, setSubmittingComm] = useState(false);
  const [commError, setCommError] = useState<string | null>(null);
  const [commSuccess, setCommSuccess] = useState<string | null>(null);

  // Membro Fundador state

  const [founderStats, setFounderStats] = useState<any>(null);

  const [founderLoading, setFounderLoading] = useState(false);

  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  // Wallet Settings Modal / State

  const [showWalletModal, setShowWalletModal] = useState(false);

  const [tempPayoutMethod, setTempPayoutMethod] = useState<"paypal" | "iban">(
    "paypal",
  );

  const [paypalEmail, setPaypalEmail] = useState("");

  const [bankName, setBankName] = useState("");

  const [bankHolder, setBankHolder] = useState("");

  const [iban, setIban] = useState("");

  const [facipayAccount, setFacipayAccount] = useState("");

  const [savingWallet, setSavingWallet] = useState(false);

  const [walletError, setWalletError] = useState<string | null>(null);

  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);

  // Benefits & Pricing modal

  const [showPlanBenefitsModal, setShowPlanBenefitsModal] = useState(false);

  const [pricingModalStep, setPricingModalStep] = useState<
    "plans" | "select_method" | "fastpay_upload"
  >("plans");

  const [settings, setSettings] = useState<Record<string, string>>({});

  const [submittingStripe, setSubmittingStripe] = useState(false);

  const [stripeError, setStripeError] = useState<string | null>(null);

  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [fastpaySuccess, setFastpaySuccess] = useState<string | null>(null);

  const [fastpayError, setFastpayError] = useState<string | null>(null);

  const [showWalletTabsDropdown, setShowWalletTabsDropdown] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function fetchCommunities() {
    setLoadingCommunities(true);
    setCommError(null);
    try {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCommunities(data || []);
    } catch (err: any) {
      console.error("Error fetching communities:", err);
      setCommError(err.message || "Erro ao carregar comunidades.");
    } finally {
      setLoadingCommunities(false);
    }
  }

  async function handleAddCommunity(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommTitle || !newCommLink) {
      setCommError("Título e Link são obrigatórios");
      return;
    }
    setSubmittingComm(true);
    setCommError(null);
    setCommSuccess(null);
    try {
      const { error } = await supabase
        .from("communities")
        .insert({
          title: newCommTitle,
          description: newCommDesc,
          link: newCommLink
        });
      if (error) throw error;
      setCommSuccess("Comunidade adicionada com sucesso!");
      setNewCommTitle("");
      setNewCommDesc("");
      setNewCommLink("");
      fetchCommunities();
    } catch (err: any) {
      setCommError(err.message || "Erro ao adicionar comunidade.");
    } finally {
      setSubmittingComm(false);
    }
  }

  async function handleDeleteCommunity(id: string) {
    if (!window.confirm("Tem certeza que deseja remover esta comunidade?")) return;
    try {
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setCommSuccess("Comunidade removida com sucesso!");
      fetchCommunities();
    } catch (err: any) {
      setCommError(err.message || "Erro ao remover comunidade.");
    }
  }

  useEffect(() => {
    if (walletView === "community") {
      fetchCommunities();
    }
  }, [walletView]);

  async function loadFounderStats() {
    setFounderLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch(
        `${BACKEND_URL}/api/collaborators/founder-stats`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );

      const data = await res.json();

      if (data.success) setFounderStats(data);
    } catch (err) {
      console.error("Error loading founder stats:", err);
    } finally {
      setFounderLoading(false);
    }
  }

  async function copyInviteLink() {
    const inviteCode = founderStats?.referralCode || founderStats?.authUserId;

    if (!inviteCode) return;

    const link = `${window.location.origin}/convite/${inviteCode}`;

    try {
      await navigator.clipboard.writeText(link);

      setInviteLinkCopied(true);

      setTimeout(() => setInviteLinkCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");

      ta.value = link;

      document.body.appendChild(ta);

      ta.select();

      document.execCommand("copy");

      document.body.removeChild(ta);

      setInviteLinkCopied(true);

      setTimeout(() => setInviteLinkCopied(false), 2500);
    }
  }

  async function loadDashboardData() {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setScreen("auth");

        return;
      }

      const email = session.user?.email || session.user?.user_metadata?.email || "";
      if (email === "fernandoquipiaca007@gmail.com") {
        setIsAdmin(true);
      } else {
        const { data: mem } = await supabase
          .from("members")
          .select("role")
          .eq("auth_id", session.user?.id)
          .maybeSingle();
        if (mem?.role === "admin" || mem?.role === "owner") {
          setIsAdmin(true);
        }
      }

      const dashboardController = new AbortController();
      const dashboardTimeout = setTimeout(() => dashboardController.abort(), 6000);

      const res = await fetch(`${BACKEND_URL}/api/collaborators/dashboard`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: dashboardController.signal
      });
      clearTimeout(dashboardTimeout);

      const data = await res.json();

      if (data.success) {
        setProfile(data.profile);

        setBalance(data.balance);

        setLedger(data.ledger);

        setWithdrawals(data.withdrawals);

        setSettings(data.settings || {});

        // Load existing bio from collaborators table

        if (data.profile?.id) {
          try {
            const { data: collabRow } = await supabase

              .from("collaborators")

              .select("bio")

              .eq("id", data.profile.id)

              .maybeSingle();

            if (collabRow?.bio) setBioText(collabRow.bio);
          } catch (_) {}
        }

        // Fetch affiliates

        try {
          const affiliatesController = new AbortController();
          const affiliatesTimeout = setTimeout(() => affiliatesController.abort(), 5000);

          const resAff = await fetch(
            `${BACKEND_URL}/api/collaborators/affiliates`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              signal: affiliatesController.signal
            },
          );
          clearTimeout(affiliatesTimeout);

          const dataAff = await resAff.json();

          if (dataAff.success) {
            setAffiliates(dataAff.affiliates || []);
          }
        } catch (errAff) {
          console.error("Error loading affiliates:", errAff);
        }
      } else {
        console.error("Error dashboard:", data.error);

        if (data.error?.includes("Access denied")) {
          setScreen("colaborador-candidatura");
        }
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStripeUpgrade() {
    setSubmittingStripe(true);

    setStripeError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch(
        `${BACKEND_URL}/api/collaborators/upgrade-checkout`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setStripeError(data.error || "Erro ao iniciar Stripe Checkout.");
      }
    } catch (err) {
      setStripeError("Erro de conexão ao iniciar Stripe.");
    } finally {
      setSubmittingStripe(false);
    }
  }

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploadingReceipt(true);

    setFastpayError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Utilizador não autenticado.");

      const fileExt = file.name.split(".").pop();

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      const fileName = `${user.id}/receipt_${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage

        .from("fastpay-proofs")

        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("fastpay-proofs")
        .getPublicUrl(data.path);

      setReceiptUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("[receiptUpload] error:", err);

      setFastpayError(`Erro no upload: ${err.message || err}`);
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function handleFastpaySubmit() {
    if (!receiptUrl) {
      setFastpayError("Faça o upload do comprovativo primeiro.");

      return;
    }

    setFastpayError(null);

    setFastpaySuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch(
        `${BACKEND_URL}/api/collaborators/upgrade-fastpay`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({ receiptUrl }),
        },
      );

      const data = await res.json();

      if (data.success) {
        setFastpaySuccess(
          "Comprovativo enviado com sucesso! Aguarde aprovação.",
        );

        setTimeout(() => {
          loadDashboardData();

          setShowPlanBenefitsModal(false);
        }, 2000);
      } else {
        setFastpayError(data.error || "Erro ao enviar comprovativo.");
      }
    } catch (err) {
      setFastpayError("Erro de conexão ao enviar.");
    }
  }

  async function handleWithdrawSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmittingWithdraw(true);

    setModalError(null);

    setModalSuccess(null);

    // Validate that the payout settings are configured

    const hasDetails =
      profile?.payoutInfo &&
      ((profile.payoutMethod === "paypal" && profile.payoutInfo.email) ||
        (profile.payoutMethod === "iban" && profile.payoutInfo.iban));

    if (!hasDetails) {
      setModalError(
        t('collaborator.wallet.configureRequired', 'Por favor, configure seus dados de destino em "Configurar Carteira" antes de solicitar um saque.'),
      );

      setSubmittingWithdraw(false);

      return;
    }

    const amountNum = Number(withdrawAmount);

    if (isNaN(amountNum) || amountNum < 20) {
      setModalError(
        "O valor mínimo de saque é R$ 20.00 / $ 20.00 / 20.000 Kz.",
      );

      setSubmittingWithdraw(false);

      return;
    }

    if (amountNum > (Number(balance?.available_balance) || 0)) {
      setModalError(t('collaborator.wallet.insufficientBalance', 'Saldo disponível insuficiente.'));

      setSubmittingWithdraw(false);

      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/withdraw`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${session.access_token}`,
        },

        body: JSON.stringify({ amount: amountNum }),
      });

      const data = await res.json();

      if (data.success) {
        setModalSuccess(t('collaborator.wallet.withdrawalSuccess', 'Saque solicitado com sucesso!'));

        setWithdrawAmount("");

        // Reload data to reflect new balances & ledger debits

        await loadDashboardData();

        setTimeout(() => setShowWithdrawModal(false), 2000);
      } else {
        setModalError(data.error || "Erro ao solicitar saque.");
      }
    } catch (err) {
      setModalError("Erro de conexão.");
    } finally {
      setSubmittingWithdraw(false);
    }
  }

  // AOA Withdrawal Handler

  async function handleWithdrawAoaSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmittingWithdrawAoa(true);

    setAoaModalError(null);

    setAoaModalSuccess(null);

    const minSaque = Number(settings["MINIMO_SAQUE_AOA"] || "20000");

    const amountNum = Number(withdrawAoaAmount);

    if (isNaN(amountNum) || amountNum < minSaque) {
      setAoaModalError(
        `O valor mínimo de saque AOA é Kz ${minSaque.toLocaleString("pt-AO")}.`,
      );

      setSubmittingWithdrawAoa(false);

      return;
    }

    if (amountNum > (Number(balance?.available_balance_aoa) || 0)) {
      setAoaModalError(t('collaborator.wallet.insufficientAoaBalance', 'Saldo AOA disponível insuficiente.'));

      setSubmittingWithdrawAoa(false);

      return;
    }

    if (
      withdrawAoaMethod === "facipay_p2p" &&
      !facipayAccount &&
      !profile?.facipayAccount
    ) {
      setAoaModalError(
        t('collaborator.wallet.configureFacipayRequired', 'Configure o número da conta FaciPay em "Configurar Carteira" antes de usar este método.'),
      );

      setSubmittingWithdrawAoa(false);

      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/withdraw-aoa`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${session.access_token}`,
        },

        body: JSON.stringify({ amount: amountNum, method: withdrawAoaMethod }),
      });

      const data = await res.json();

      if (data.success) {
        setAoaModalSuccess(t('collaborator.wallet.aoaWithdrawalSuccess', 'Saque AOA solicitado com sucesso!'));

        setWithdrawAoaAmount("");

        await loadDashboardData();

        setTimeout(() => setShowWithdrawAoaModal(false), 2000);
      } else {
        setAoaModalError(data.error || "Erro ao solicitar saque AOA.");
      }
    } catch (err) {
      setAoaModalError("Erro de conexão.");
    } finally {
      setSubmittingWithdrawAoa(false);
    }
  }

  const [cancellingWithdrawalId, setCancellingWithdrawalId] = useState<string | null>(null);

  async function handleCancelWithdrawal(id: string) {
    if (!window.confirm("Tem certeza que deseja cancelar esta solicitação de saque? O valor será estornado para o seu saldo disponível.")) {
      return;
    }
    setCancellingWithdrawalId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/withdraw/${id}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Solicitação de saque cancelada com sucesso!");
        await loadDashboardData();
      } else {
        alert(data.error || "Erro ao cancelar solicitação.");
      }
    } catch (err) {
      console.error("Error cancelling withdrawal:", err);
      alert("Erro de conexão ao cancelar.");
    } finally {
      setCancellingWithdrawalId(null);
    }
  }

  const openWalletModal = () => {
    setTempPayoutMethod(
      isAngola ? profile?.payoutMethod || "paypal" : "paypal",
    );

    setPaypalEmail(profile?.payoutInfo?.email || "");

    setBankName(profile?.payoutInfo?.bankName || "");

    setBankHolder(profile?.payoutInfo?.bankHolder || "");

    setIban(profile?.payoutInfo?.iban || "");

    setFacipayAccount(profile?.facipayAccount || "");

    setWalletError(null);

    setWalletSuccess(null);

    setShowWalletModal(true);
  };

  async function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSavingWallet(true);

    setWalletError(null);

    setWalletSuccess(null);

    const payoutInfo: any = {};

    if (tempPayoutMethod === "paypal") {
      if (!paypalEmail.trim()) {
        setWalletError("O e-mail do PayPal é obrigatório.");

        setSavingWallet(false);

        return;
      }

      payoutInfo.email = paypalEmail.trim();
    } else {
      if (!bankName.trim() || !bankHolder.trim() || !iban.trim()) {
        setWalletError(t('collaborator.walletSetup.requiredFields', 'Banco, Titular da Conta e IBAN são obrigatórios.'));

        setSavingWallet(false);

        return;
      }

      payoutInfo.bankName = bankName.trim();

      payoutInfo.bankHolder = bankHolder.trim();

      payoutInfo.iban = iban.trim();
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const res = await fetch(`${BACKEND_URL}/api/collaborators/settings`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${session.access_token}`,
        },

        body: JSON.stringify({
          payoutMethod: tempPayoutMethod,

          payoutInfo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Also save FaciPay account if provided

        if (facipayAccount.trim()) {
          await fetch(`${BACKEND_URL}/api/collaborators/facipay-account`, {
            method: "POST",

            headers: {
              "Content-Type": "application/json",

              Authorization: `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({ facipayAccount: facipayAccount.trim() }),
          }).catch(() => {});
        }

        setWalletSuccess(t('collaborator.walletSetup.success', 'Carteira salva com sucesso!'));

        setProfile(data.profile);

        await loadDashboardData();

        setTimeout(() => setShowWalletModal(false), 1500);
      } else {
        setWalletError(
          data.error || "Erro ao salvar configurações de carteira.",
        );
      }
    } catch (err) {
      setWalletError("Erro de conexão ao salvar.");
    } finally {
      setSavingWallet(false);
    }
  }

  const formatMoney = (val: number) => {
    // If payout method is IBAN, currency is likely AOA (Kwanza)

    const isAoa = profile?.payoutMethod === "iban";

    const num = Number(val) || 0;

    if (isAoa) {
      return num.toLocaleString("pt-AO", {
        style: "currency",
        currency: "AOA",
      });
    }

    return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const getLedgerStatusBadge = (status: string) => {
    switch (status) {
      case "guarantee":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
            <ShieldCheck size={12} /> Garantia (D1-D3)
          </span>
        );

      case "processing":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
            <Clock size={12} /> Processando (D4-D6)
          </span>
        );

      case "available":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300">
            <CheckCircle size={12} /> Disponível
          </span>
        );

      case "pending":
        return (
          <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
            Aguardando
          </span>
        );

      case "refunded":
        return (
          <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Reembolsado
          </span>
        );

      case "withdrawn":
        return (
          <span className="rounded bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
            Sacado
          </span>
        );

      default:
        return (
          <span className="rounded bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700">
            {status}
          </span>
        );
    }
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
            Concluído
          </span>
        );

      case "pending":
        return (
          <span className="rounded bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800">
            Aguardando
          </span>
        );

      case "processing":
        return (
          <span className="rounded bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
            Processando
          </span>
        );

      case "rejected":
        return (
          <span className="rounded bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
            Recusado
          </span>
        );

      default:
        return (
          <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
            {status}
          </span>
        );
    }
  };

  async function handleSaveBio() {
    if (!profile) return;

    setBioSaving(true);

    setBioError(null);

    setBioSaved(false);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Sessão inválida");

      const { error } = await supabase

        .from("collaborators")

        .update({ bio: bioText })

        .eq("id", profile.id);

      if (error) throw error;

      setBioSaved(true);

      setTimeout(() => setBioSaved(false), 3000);
    } catch (err: any) {
      setBioError(err.message || "Erro ao salvar.");
    } finally {
      setBioSaving(false);
    }
  }

  if (loading || countryLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="collab-compact-wrapper">
      <div className="pt-20 pb-6 px-4 md:px-8 w-full min-h-screen page-wrapper">
        <CountryRequiredModal />

        {/* Header */}

        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-on-surface-variant leading-[1.1] tracking-[-0.04em] flex flex-wrap items-center gap-2">
              {t("collaborator.dashboardTitle", "Painel do Criador")}

              {profile?.plan === "course_creator" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[9px] font-bold text-blue-400 font-display shadow-lg shadow-blue-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Membro Pro
                </span>
              )}
            </h1>

            <p className="mt-0.5 text-on-surface-variant font-sans text-xs">
              {t("collaborator.dashboardSubtitle", {
                name: profile?.displayName,
                defaultValue: `Olá, ${profile?.displayName}! Gerencie seu saldo e acompanhe seu extrato.`,
              })}
            </p>
          </div>

          <div className="flex gap-1.5 flex-wrap items-center">
            <button
              onClick={() => {
                setPricingModalStep("plans");

                setStripeError(null);

                setFastpayError(null);

                setFastpaySuccess(null);

                setReceiptUrl(null);

                setShowPlanBenefitsModal(true);
              }}

              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 font-semibold text-white hover:bg-primary/20 transition-all text-[11px] shadow-[0_0_10px_rgba(192,193,255,0.1)]"
            >
              <Award size={13} className="text-primary animate-pulse" />
              Plano Premium
            </button>

            <button
              onClick={openWalletModal}

              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-on-surface hover:bg-white/10 transition-all text-[11px]"
            >
              <Landmark size={13} className="text-primary" />
              Configurar Carteira
            </button>

            <button
              onClick={onGoToProducts}

              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-on-surface hover:bg-white/10 transition-all text-[11px]"
            >
              <FileText size={13} className="text-primary" />
              Meus Produtos
            </button>

            <button
              onClick={() => setShowWithdrawModal(true)}

              disabled={(Number(balance?.available_balance) || 0) < 50}

              title={
                (Number(balance?.available_balance) || 0) < 50
                  ? "Saldo mínimo de $50.00 necessário para sacar"
                  : "Solicitar saque"
              }

              className="flex items-center gap-1 rounded-full bg-on-surface px-3 py-1.5 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-[11px] shadow-[0_0_10px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(192,193,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PlusCircle size={13} />
              Solicitar Saque
            </button>
          </div>
        </div>

        {/* Plan Expiration & Grace Period Alerts */}

        {(() => {
          if (
            !profile ||
            profile.plan !== "course_creator" ||
            !profile.planExpiresAt
          )
            return null;

          const now = new Date();

          const expiresAt = new Date(profile.planExpiresAt);

          const daysDiff = Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (daysDiff <= 0) {
            // Grace period check: 2 days threshold

            const graceThreshold = new Date(
              expiresAt.getTime() + 2 * 24 * 60 * 60 * 1000,
            );

            if (now <= graceThreshold) {
              return (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3 items-start animate-pulse">
                  <AlertCircle className="text-red-400 w-5 h-5 shrink-0 mt-0.5" />

                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Período de Tolerância Ativo (Expiração Crítica)
                    </h4>

                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Sua assinatura do plano <strong>Course Creator</strong>{" "}
                      via{" "}
                      {profile.upgradeMethod === "fastpay"
                        ? "Facipay"
                        : "Stripe"}{" "}
                      expirou em {expiresAt.toLocaleDateString()}. Você tem um
                      prazo limite de tolerância de até 2 dias para regularizar
                      seu pagamento. Se não realizar a renovação hoje, seus
                      cursos e hospedagens de vídeos serão desativados.
                    </p>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="mb-6 rounded-xl border border-red-600 bg-red-950/40 p-4 flex gap-3 items-start">
                  <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />

                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Plano Expirado - Cursos Desativados
                    </h4>

                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Sua assinatura expirou e o período de tolerância encerrou.
                      Seus cursos foram marcados como inativos. Realize o
                      pagamento de renovação para reativar todos os seus
                      conteúdos imediatamente.
                    </p>
                  </div>
                </div>
              );
            }
          } else if (daysDiff <= 5) {
            return (
              <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex gap-3 items-start">
                <AlertCircle className="text-yellow-400 w-5 h-5 shrink-0 mt-0.5" />

                <div>
                  <h4 className="text-sm font-bold text-white">
                    Sua Assinatura Expira em {daysDiff}{" "}
                    {daysDiff === 1 ? "dia" : "dias"}
                  </h4>

                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Lembrete: Como seu plano foi ativado via{" "}
                    {profile.upgradeMethod === "fastpay"
                      ? "Facipay (Manual)"
                      : "Stripe"}
                    , certifique-se de regularizar a renovação antes de{" "}
                    {expiresAt.toLocaleDateString()} para que não ocorra a
                    suspensão de uploads de vídeos dos seus produtos.
                  </p>
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Currency Filter Toggle - Desktop */}

        <div className="hidden sm:flex mb-2 items-center gap-1 p-0.5 bg-surface-high rounded-full w-fit border border-white/10 flex-wrap sm:flex-nowrap">
          {isAngola ? (
            <>
              <button
                onClick={() => setWalletView("aoa")}

                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  walletView === "aoa"
                    ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                <Landmark size={10} />{" "}
                {t("collaborator.tabWalletAoa", "AOA · FaciPay")}
              </button>

              <button
                onClick={() => setWalletView("usd")}

                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  walletView === "usd"
                    ? "bg-primary text-background shadow-[0_0_10px_rgba(192,193,255,0.2)]"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                <DollarSign size={12} />{" "}
                {t("collaborator.tabWalletUsd", "USD · Stripe")}
              </button>
            </>
          ) : (
            <button
              onClick={() => setWalletView("usd")}

              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                walletView === "usd"
                  ? "bg-primary text-background shadow-[0_0_10px_rgba(192,193,255,0.2)]"
                  : "text-on-surface-variant hover:text-white"
              }`}
            >
              <DollarSign size={12} />{" "}
              {t("collaborator.tabWalletUsd", "USD · Stripe")}
            </button>
          )}

          <button
            onClick={() => setWalletView("affiliates")}

            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              walletView === "affiliates"
                ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <Users size={12} />{" "}
            {t("collaborator.tabAffiliates", "Meus Afiliados")}
          </button>

          <button
            onClick={() => {
              setWalletView("founder");
              loadFounderStats();
            }}

            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              walletView === "founder"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.25)]"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <Award size={12} />{" "}
            {t("collaborator.tabFounder", "Membro Fundador")}
          </button>

          <button
            onClick={() => setWalletView("analytics")}

            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              walletView === "analytics"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.25)]"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <TrendingUp size={12} /> {t("collaborator.tabAnalytics", "Análise")}
          </button>

          <button
            onClick={() => setWalletView("ads")}

            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              walletView === "ads"
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.25)]"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <Megaphone size={12} /> {t("collaborator.tabAds", "Anúncios")}
          </button>

          <button
            onClick={() => {
              setWalletView("profile");
            }}

            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              walletView === "profile"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <ShieldCheck size={12} /> Meu Perfil
          </button>

          <button
            onClick={() => setWalletView("community")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              walletView === "community"
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.25)]"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <Users size={12} /> Comunidade
          </button>
        </div>

        {/* Currency Filter Toggle - Mobile Dropdown */}
        <div className="flex sm:hidden relative mb-4">
          <button
            type="button"
            onClick={() => setShowWalletTabsDropdown(!showWalletTabsDropdown)}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-surface-high border border-white/10 text-xs font-bold text-white shadow-md active:scale-[0.98] transition-all"
          >
            <span className="flex items-center gap-2">
              {walletView === "aoa" && (
                <>
                  <Landmark size={12} className="text-amber-400" />
                  <span>{t("collaborator.tabWalletAoa", "AOA · FaciPay")}</span>
                </>
              )}
              {walletView === "usd" && (
                <>
                  <DollarSign size={12} className="text-primary" />
                  <span>{t("collaborator.tabWalletUsd", "USD · Stripe")}</span>
                </>
              )}
              {walletView === "affiliates" && (
                <>
                  <Users size={12} className="text-purple-400" />
                  <span>{t("collaborator.tabAffiliates", "Meus Afiliados")}</span>
                </>
              )}
              {walletView === "founder" && (
                <>
                  <Award size={12} className="text-amber-500" />
                  <span>{t("collaborator.tabFounder", "Membro Fundador")}</span>
                </>
              )}
              {walletView === "analytics" && (
                <>
                  <TrendingUp size={12} className="text-blue-400" />
                  <span>{t("collaborator.tabAnalytics", "Análise")}</span>
                </>
              )}
              {walletView === "ads" && (
                <>
                  <Megaphone size={12} className="text-pink-400" />
                  <span>{t("collaborator.tabAds", "Anúncios")}</span>
                </>
              )}
               {walletView === "profile" && (
                <>
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Meu Perfil</span>
                </>
              )}
              {walletView === "community" && (
                <>
                  <Users size={12} className="text-purple-400" />
                  <span>{t("collaborator.tabCommunity", "Comunidade")}</span>
                </>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showWalletTabsDropdown ? "rotate-180" : ""}`} />
          </button>

          {showWalletTabsDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowWalletTabsDropdown(false)}
              />
              <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-[#0a0a0f] border border-white/15 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-40 max-h-[300px] overflow-y-auto">
                {isAngola && (
                  <button
                    type="button"
                    onClick={() => {
                      setWalletView("aoa");
                      setShowWalletTabsDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors ${
                      walletView === "aoa" ? "text-amber-400 bg-amber-500/10" : "text-on-surface-variant"
                    }`}
                  >
                    <Landmark size={12} /> {t("collaborator.tabWalletAoa", "AOA · FaciPay")}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setWalletView("usd");
                    setShowWalletTabsDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                    walletView === "usd" ? "text-primary bg-primary/10" : "text-on-surface-variant"
                  }`}
                >
                  <DollarSign size={12} /> {t("collaborator.tabWalletUsd", "USD · Stripe")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletView("affiliates");
                    setShowWalletTabsDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                    walletView === "affiliates" ? "text-purple-400 bg-purple-500/10" : "text-on-surface-variant"
                  }`}
                >
                  <Users size={12} /> {t("collaborator.tabAffiliates", "Meus Afiliados")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletView("founder");
                    loadFounderStats();
                    setShowWalletTabsDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                    walletView === "founder" ? "text-yellow-400 bg-yellow-500/10" : "text-on-surface-variant"
                  }`}
                >
                  <Award size={12} /> {t("collaborator.tabFounder", "Membro Fundador")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletView("analytics");
                    setShowWalletTabsDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                    walletView === "analytics" ? "text-blue-400 bg-blue-500/10" : "text-on-surface-variant"
                  }`}
                >
                  <TrendingUp size={12} /> {t("collaborator.tabAnalytics", "Análise")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletView("ads");
                    setShowWalletTabsDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                    walletView === "ads" ? "text-pink-400 bg-pink-500/10" : "text-on-surface-variant"
                  }`}
                >
                  <Megaphone size={12} /> {t("collaborator.tabAds", "Anúncios")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletView("profile");
                    setShowWalletTabsDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                    walletView === "profile" ? "text-emerald-400 bg-emerald-500/10" : "text-on-surface-variant"
                  }`}
                >
                  <ShieldCheck size={12} /> Meu Perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletView("community");
                    setShowWalletTabsDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors mt-0.5 ${
                    walletView === "community" ? "text-purple-400 bg-purple-500/10" : "text-on-surface-variant"
                  }`}
                >
                  <Users size={12} /> Comunidade
                </button>
              </div>
            </>
          )}
        </div>

        {/* ====== USD WALLET VIEW ====== */}

        {walletView === "usd" && (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-primary" />

                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    Ecossistema USD · Stripe
                  </span>
                </div>

                {country && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-on-surface-variant">
                    País Registado:{" "}
                    <span className="text-white font-bold">
                      {country === "AO"
                        ? "🇦🇴 AO"
                        : country === "PT"
                          ? "🇵🇹 PT"
                          : country === "BR"
                            ? "🇧🇷 BR"
                            : country === "FR"
                              ? "🇫🇷 FR"
                              : country === "US"
                                ? "🇺🇸 US"
                                : `🌐 ${country}`}
                    </span>
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3 relative z-10">
                {/* Estado 1: Em Garantia (D1-D3) */}

                <div className="glass-card rounded-2xl p-4 relative overflow-hidden border border-amber-500/15">
                  <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <ShieldCheck size={16} />
                    </div>

                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                      Dias 1-3
                    </span>
                  </div>

                  <span className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t('collaborator.ledger.statusPending', 'Em Garantia')}
                  </span>

                  <span className="block text-xl font-bold text-white font-mono">
                    {(Number(balance?.guarantee_balance) || 0).toLocaleString(
                      "en-US",
                      { style: "currency", currency: "USD" },
                    )}
                  </span>

                  <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                    {t('collaborator.wallet.guaranteeDesc', 'Período de reembolso do cliente. Fundos bloqueados por segurança.')}
                  </p>
                </div>

                {/* Estado 2: Em Processamento (D4-D6) */}

                <div className="glass-card rounded-2xl p-4 relative overflow-hidden border border-blue-500/15">
                  <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Clock size={16} />
                    </div>

                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">
                      Dias 4-6
                    </span>
                  </div>

                  <span className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t('collaborator.wallet.inProcessing', 'Em Processamento')}
                  </span>

                  <span className="block text-xl font-bold text-white font-mono">
                    {(Number(balance?.processing_balance) || 0).toLocaleString(
                      "en-US",
                      { style: "currency", currency: "USD" },
                    )}
                  </span>

                  <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                    {t('collaborator.wallet.processingDesc', 'Aguardando liquidação Stripe. Liberado em breve.')}
                  </p>
                </div>

                {/* Estado 3: Disponível para Saque */}

                <div className="glass-card rounded-2xl p-4 relative overflow-hidden border border-green-500/15">
                  <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <CheckCircle size={16} />
                    </div>

                    <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">
                      Dia 7+
                    </span>
                  </div>

                  <span className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t('collaborator.wallet.available', 'Disponível para Saque')}
                  </span>

                  <span className="block text-xl font-bold text-white font-mono">
                    {(Number(balance?.available_balance) || 0).toLocaleString(
                      "en-US",
                      { style: "currency", currency: "USD" },
                    )}
                  </span>

                  <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                    {(Number(balance?.available_balance) || 0) >= 50
                      ? t('collaborator.wallet.sufficientBalance', '✓ Saldo suficiente para saque (mín. $50.00)')
                      : t('collaborator.wallet.minWithdrawalUsd', 'Mínimo $50.00 para sacar. Faltam ${{amount}}', { amount: Math.max(0, 50 - (Number(balance?.available_balance) || 0)).toFixed(2) })}
                  </p>
                </div>
              </div>
            </div>

            {/* Cards Resumo USD */}

            <div className="mb-6 grid gap-3 sm:grid-cols-2 relative z-10">
              <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />

                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/15">
                    <TrendingUp size={16} />
                  </div>

                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {t('collaborator.wallet.history', 'Histórico')}
                  </span>
                </div>

                <span className="block text-sm font-medium text-on-surface-variant">
                  {t('collaborator.wallet.totalEarnedUsd', 'Total Acumulado (USD)')}
                </span>

                <span className="block text-xl font-bold text-white font-mono mt-1">
                  {(Number(balance?.accumulated_earnings) || 0).toLocaleString(
                    "en-US",
                    { style: "currency", currency: "USD" },
                  )}
                </span>
              </div>

              <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />

                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary/10 text-tertiary border border-tertiary/15">
                    {profile?.payoutMethod === "paypal" ? (
                      <Mail size={16} />
                    ) : (
                      <Landmark size={16} />
                    )}
                  </div>

                  <span className="text-xs font-semibold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full border border-tertiary/20">
                    {t('collaborator.ledger.statusPaid', 'Pago')}
                  </span>
                </div>

                <span className="block text-sm font-medium text-on-surface-variant">
                  {t('collaborator.wallet.totalWithdrawnUsd', 'Total Sacado (USD)')}
                </span>

                <span className="block text-xl font-bold text-white font-mono mt-1">
                  {(Number(balance?.withdrawn_amount) || 0).toLocaleString(
                    "en-US",
                    { style: "currency", currency: "USD" },
                  )}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ====== AOA WALLET VIEW ====== */}

        {walletView === "aoa" && (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Landmark size={14} className="text-amber-400" />

                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    {t('collaborator.tabWalletAoa', 'Ecossistema AOA · FaciPay (Kwanza)')}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {country && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-on-surface-variant">
                      {t('collaborator.walletSetup.countryRegistered', 'País Registado')}:{" "}
                      <span className="text-white font-bold">
                        {country === "AO"
                          ? "🇦🇴 AO"
                          : country === "PT"
                            ? "🇵🇹 PT"
                            : country === "BR"
                              ? "🇧🇷 BR"
                              : country === "FR"
                                ? "🇫🇷 FR"
                                : country === "US"
                                  ? "🇺🇸 US"
                                  : `🌐 ${country}`}
                      </span>
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setAoaModalError(null);

                      setAoaModalSuccess(null);

                      setWithdrawAoaAmount("");

                      setWithdrawAoaMethod("iban_aoa");

                      setShowWithdrawAoaModal(true);
                    }}

                    disabled={
                      (Number(balance?.available_balance_aoa) || 0) <
                      Number(settings["MINIMO_SAQUE_AOA"] || "20000")
                    }

                    title={
                      (Number(balance?.available_balance_aoa) || 0) <
                      Number(settings["MINIMO_SAQUE_AOA"] || "20000")
                        ? `Saldo mínimo de Kz ${Number(settings["MINIMO_SAQUE_AOA"] || "20000").toLocaleString("pt-AO")} necessário`
                        : "Solicitar saque AOA"
                    }

                    className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 font-bold text-black text-xs hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <PlusCircle size={13} /> {t('collaborator.wallet.requestWithdrawalAoa', 'Solicitar Saque AOA')}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 relative z-10">
                {/* AOA Estado 1: Em Garantia */}

                <div className="glass-card rounded-2xl p-4 relative overflow-hidden border border-amber-500/15">
                  <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <ShieldCheck size={16} />
                    </div>

                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                      Dias 1-3
                    </span>
                  </div>

                  <span className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t('collaborator.wallet.inGuarantee', 'Em Garantia (AOA)')}
                  </span>

                  <span className="block text-xl font-bold text-white font-mono">
                    Kz{" "}
                    {(
                      Number(balance?.guarantee_balance_aoa) || 0
                    ).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                  </span>

                  <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                    {t('collaborator.wallet.guaranteeDesc', 'Período de reembolso. Fundos bloqueados por segurança.')}
                  </p>
                </div>

                {/* AOA Estado 2: Em Processamento */}

                <div className="glass-card rounded-2xl p-4 relative overflow-hidden border border-blue-500/15">
                  <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Clock size={16} />
                    </div>

                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">
                      Dias 4-6
                    </span>
                  </div>

                  <span className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t('collaborator.wallet.inProcessing', 'Em Processamento (AOA)')}
                  </span>

                  <span className="block text-xl font-bold text-white font-mono">
                    Kz{" "}
                    {(
                      Number(balance?.processing_balance_aoa) || 0
                    ).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                  </span>

                  <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                    {t('collaborator.wallet.processingDesc', 'Aguardando liquidação FaciPay.')}
                  </p>
                </div>

                {/* AOA Estado 3: Disponível */}

                <div className="glass-card rounded-2xl p-4 relative overflow-hidden border border-green-500/15">
                  <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <CheckCircle size={16} />
                    </div>

                    <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">
                      Dia 7+
                    </span>
                  </div>

                  <span className="block text-xs font-semibold text-on-surface-variant mb-1">
                    {t('collaborator.wallet.available', 'Disponível para Saque (AOA)')}
                  </span>

                  <span className="block text-xl font-bold text-white font-mono">
                    Kz{" "}
                    {(
                      Number(balance?.available_balance_aoa) || 0
                    ).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                  </span>

                  <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                    {(Number(balance?.available_balance_aoa) || 0) >=
                    Number(settings["MINIMO_SAQUE_AOA"] || "20000")
                      ? t('collaborator.wallet.sufficientAoaBalance', '✓ Saldo suficiente para saque (mín. Kz {{min}})', { min: Number(settings["MINIMO_SAQUE_AOA"] || "20000").toLocaleString("pt-AO") })
                      : t('collaborator.wallet.minWithdrawalAoa', 'Mínimo Kz {{min}} para sacar.', { min: Number(settings["MINIMO_SAQUE_AOA"] || "20000").toLocaleString("pt-AO") })}
                  </p>
                </div>
              </div>
            </div>

            {/* Cards Resumo AOA */}

            <div className="mb-6 grid gap-3 sm:grid-cols-2 relative z-10">
              <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />

                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15">
                    <TrendingUp size={16} />
                  </div>

                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Histórico
                  </span>
                </div>

                <span className="block text-sm font-medium text-on-surface-variant">
                  {t('collaborator.wallet.totalEarned', 'Total Acumulado (AOA)')}
                </span>

                <span className="block text-xl font-bold text-white font-mono mt-1">
                  Kz{" "}
                  {(
                    Number(balance?.accumulated_earnings_aoa) || 0
                  ).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="glass-card glass-card-hover rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute w-[150px] h-[150px] bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 left-0" />

                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15">
                    <Landmark size={16} />
                  </div>

                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Pago
                  </span>
                </div>

                <span className="block text-sm font-medium text-on-surface-variant">
                  {t('collaborator.wallet.totalWithdrawn', 'Total Sacado (AOA)')}
                </span>

                <span className="block text-xl font-bold text-white font-mono mt-1">
                  Kz{" "}
                  {(Number(balance?.withdrawn_amount_aoa) || 0).toLocaleString(
                    "pt-AO",
                    { minimumFractionDigits: 2 },
                  )}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ====== ANALYTICS VIEW ====== */}

        {walletView === "analytics" && <CollaboratorAnalyticsPanel t={t} walletView={walletView} />}

        {/* ====== MEUS AFILIADOS VIEW ====== */}

        {walletView === "affiliates" && (
          <CollaboratorAffiliatesPanel affiliates={affiliates} />
        )}

        {/* ====== MEMBRO FUNDADOR VIEW ====== */}

        {walletView === "founder" && (
          <div className="w-full">
            {founderLoading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <RefreshCw size={20} className="animate-spin mr-2" />{" "}
                Carregando...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header explainer */}

                <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-yellow-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 pointer-events-none" />

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                      <Award size={18} className="text-yellow-400" />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white font-display">
                        Programa Membro Fundador
                      </h3>

                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        Convide novos criadores de conteúdo para a plataforma.
                        Quando eles fizerem vendas, você ganha
                        <span className="text-yellow-400 font-bold">
                          {" "}
                          1% do valor bruto{" "}
                        </span>
                        diretamente no seu saldo disponível — sem tocar na
                        margem deles.
                      </p>

                      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-on-surface-variant">
                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">
                          <CheckCircle size={9} /> Crédito imediato no saldo
                          disponível
                        </span>

                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">
                          <DollarSign size={9} /> Sai da margem da CodeEngine
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invite Link */}

                <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    Seu Link de Convite
                  </h4>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-surface-high rounded-xl px-3.5 py-2 border border-white/10 font-mono text-[11px] text-on-surface-variant overflow-hidden">
                      <ExternalLink
                        size={12}
                        className="text-yellow-400 flex-shrink-0"
                      />

                      <span className="truncate font-medium">
                        {founderStats?.referralCode || founderStats?.authUserId
                          ? `${window.location.origin}/convite/${founderStats.referralCode || founderStats.authUserId}`
                          : "Carregando..."}
                      </span>
                    </div>

                    <button
                      onClick={copyInviteLink}

                      disabled={
                        !(
                          founderStats?.referralCode || founderStats?.authUserId
                        )
                      }

                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        inviteLinkCopied
                          ? "bg-green-500 text-white"
                          : "bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90"
                      }`}
                    >
                      {inviteLinkCopied ? (
                        <CheckCircle size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}

                      {inviteLinkCopied ? "Copiado!" : "Copiar Link"}
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] text-on-surface-variant leading-normal">
                    Partilhe este link com criadores de conteúdo. Quando se
                    registarem através dele como criadores,
                    você começa a ganhar automaticamente.
                  </p>
                </div>

                {/* Stats Grid */}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass-card rounded-2xl p-4 border border-white/10 text-center">
                    <div className="text-xl font-bold text-white font-mono">
                      {founderStats?.totalInvited ?? 0}
                    </div>

                    <div className="text-[10px] text-on-surface-variant mt-0.5">
                      Membros Convidados
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-4 border border-white/10 text-center">
                    <div className="text-xl font-bold text-white font-mono">
                      {founderStats?.totalInvitedCollaborators ?? 0}
                    </div>

                    <div className="text-[10px] text-on-surface-variant mt-0.5">
                      Viraram Criadores
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-4 border border-green-500/20 text-center">
                    <div className="text-xl font-bold text-green-400 font-mono">
                      {(founderStats?.totalEarnedUsd || 0).toLocaleString(
                        "en-US",
                        { style: "currency", currency: "USD" },
                      )}
                    </div>

                    <div className="text-[10px] text-on-surface-variant mt-0.5">
                      Ganho como Fundador (USD)
                    </div>
                  </div>

                  {isAngola && (
                    <div className="glass-card rounded-2xl p-4 border border-amber-500/20 text-center">
                      <div className="text-xl font-bold text-amber-400 font-mono">
                        {(founderStats?.totalEarnedAoa || 0).toLocaleString(
                          "pt-AO",
                          {
                            style: "currency",
                            currency: "AOA",
                            minimumFractionDigits: 0,
                          },
                        )}
                      </div>

                      <div className="text-[10px] text-on-surface-variant mt-0.5">
                        Ganho como Fundador (AOA)
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent founder commissions */}

                <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    Comissões Recentes de Fundador
                  </h4>

                  {!founderStats?.recentCommissions?.length ? (
                    <div className="py-8 text-center text-on-surface-variant text-sm">
                      Nenhuma comissão de fundador recebida ainda. Convide
                      criadores para começar!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="text-on-surface-variant font-semibold border-b border-white/10 text-xs">
                            <th className="pb-2.5 font-bold uppercase tracking-wider">
                              Data
                            </th>

                            <th className="pb-2.5 font-bold uppercase tracking-wider">
                              {t('collaborator.ledger.description', 'Descrição')}
                            </th>

                            <th className="pb-2.5 font-bold uppercase tracking-wider text-right">
                              {t('collaborator.ledger.amount', 'Valor')}
                            </th>

                            <th className="pb-2.5 font-bold uppercase tracking-wider text-right">
                              Moeda
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                          {founderStats.recentCommissions

                            .filter(
                              (item: any) =>
                                isAngola || item.currency === "USD",
                            )

                            .map((item: any) => (
                              <tr key={item.id} className="text-on-surface">
                                <td className="py-3 text-on-surface-variant text-xs font-mono">
                                  {new Date(item.created_at).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </td>

                                <td className="py-3 text-white text-sm">
                                  {item.description}
                                </td>

                                <td className="py-3 text-right font-mono font-semibold text-yellow-400">
                                  +
                                  {Number(item.amount).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </td>

                                <td className="py-3 text-right">
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                      item.currency === "USD"
                                        ? "text-green-400 bg-green-500/10 border-green-500/20"
                                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                    }`}
                                  >
                                    {item.currency}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== ADS PLATFORM DASHBOARD VIEW ====== */}

        {walletView === "profile" && profile && (
          <div className="space-y-6 max-w-2xl">
            {/* Header */}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck size={18} className="text-emerald-400" />
              </div>

              <div>
                <h3 className="font-display font-bold text-white text-sm">
                  Perfil Público do Criador
                </h3>

                <p className="text-[11px] text-on-surface-variant">
                  Estas informações aparecem em todos os seus produtos na loja.
                </p>
              </div>
            </div>

            {/* Preview card */}

            <div className="glass-panel rounded-2xl border border-white/10 p-5 flex gap-4 items-start">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-primary/20 flex items-center justify-center">
                  <span className="font-display font-black text-xl text-white">
                    {profile.displayName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>

                <img
                  src="/icons/vericado.ico"

                  alt="Verificado"

                  className="absolute -bottom-1 -right-1 w-5 h-5 object-contain"
                />
              </div>

              <div className="space-y-1">
                <p className="font-display font-bold text-white text-sm">
                  {profile.displayName}
                </p>

                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
                  <img
                    src="/icons/vericado.ico"
                    alt=""
                    className="w-3 h-3 object-contain shrink-0"
                  />
                  Verificado CodeEngine
                </span>

                {bioText && (
                  <p className="text-[11px] text-on-surface-variant leading-relaxed max-w-sm">
                    {bioText.slice(0, 120)}
                    {bioText.length > 120 ? "…" : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Bio editor */}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">
                {t('collaborator.profile.bioLabel', 'Descrição / Bio Pública')}
              </label>

              <p className="text-[11px] text-on-surface-variant">
                {t('collaborator.profile.bioHelp', 'Apresente-se aos compradores. Mencione a sua experiência, área de especialidade e o que torna os seus produtos únicos. Máx. 500 caracteres.')}
              </p>

              <textarea
                value={bioText}

                onChange={(e) => setBioText(e.target.value.slice(0, 500))}

                rows={5}

                placeholder={t('collaborator.profile.bioPlaceholder', 'Ex: Sou especialista em marketing digital com 8 anos de experiência a ajudar empreendedores a crescer online...')}

                className="w-full rounded-xl bg-surface-high border border-white/10 text-white text-xs font-sans px-4 py-3 resize-none focus:outline-none focus:border-emerald-500/50 placeholder:text-on-surface-variant/50 transition-colors"
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-on-surface-variant">
                  {bioText.length}/500 {t('collaborator.profile.characters', 'caracteres')}
                </span>

                <button
                  onClick={handleSaveBio}

                  disabled={bioSaving}

                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all disabled:opacity-60 active:scale-95"
                >
                  {bioSaving ? (
                    <span className="w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                  ) : bioSaved ? (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>{" "}
                      Salvo!
                    </>
                  ) : (
                    t('collaborator.profile.saveBio', 'Guardar Bio')
                  )}
                </button>
              </div>

              {bioError && (
                <p className="text-[11px] text-red-400">{bioError}</p>
              )}
            </div>

            <p className="text-[10px] text-on-surface-variant/60 border-t border-white/5 pt-3">
              O selo de verificação verde é atribuído automaticamente pela
              CodeEngine a todos os criadores aprovados.
            </p>
          </div>
        )}

        {walletView === "community" && (
          <div className="space-y-6 max-w-4xl relative z-10 animate__animated animate__fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                <Users size={18} className="text-purple-400" />
              </div>

              <div>
                <h3 className="font-display font-bold text-white text-sm">
                  Comunidades de Formação
                </h3>

                <p className="text-[11px] text-on-surface-variant">
                  Aceda às comunidades oficiais para receber suporte, partilhar conhecimento e expandir as suas competências.
                </p>
              </div>
            </div>

            {/* Admin Add Form */}
            {isAdmin && (
              <form onSubmit={handleAddCommunity} className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Adicionar Nova Comunidade (Admin)</h4>
                
                {commError && <p className="text-[11px] text-red-400">{commError}</p>}
                {commSuccess && <p className="text-[11px] text-green-400">{commSuccess}</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Título da Comunidade"
                    value={newCommTitle}
                    onChange={(e) => setNewCommTitle(e.target.value)}
                    className="rounded-xl bg-surface-high border border-white/10 text-white text-xs font-sans px-3 py-2 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Descrição Curta"
                    value={newCommDesc}
                    onChange={(e) => setNewCommDesc(e.target.value)}
                    className="rounded-xl bg-surface-high border border-white/10 text-white text-xs font-sans px-3 py-2 focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="Link de Acesso (WhatsApp, Telegram, etc.)"
                    value={newCommLink}
                    onChange={(e) => setNewCommLink(e.target.value)}
                    className="rounded-xl bg-surface-high border border-white/10 text-white text-xs font-sans px-3 py-2 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingComm}
                  className="px-4 py-1.5 rounded-full bg-purple-500 hover:bg-purple-400 text-black text-xs font-bold transition-all disabled:opacity-60"
                >
                  {submittingComm ? "Adicionando..." : "Adicionar Comunidade"}
                </button>
              </form>
            )}

            {/* Communities List */}
            {loadingCommunities ? (
              <div className="py-8 text-center">
                <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : communities.length === 0 ? (
              <div className="glass-panel p-6 text-center text-on-surface-variant text-xs rounded-2xl border border-white/10">
                Nenhuma comunidade de formação registada no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communities.map((comm) => (
                  <div key={comm.id} className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between items-start gap-3">
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-white text-sm">{comm.title}</h4>
                      {comm.description && (
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">{comm.description}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between w-full mt-2">
                      <a
                        href={comm.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                      >
                        Entrar na Comunidade
                        <ArrowUpRight size={13} />
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteCommunity(comm.id)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors uppercase tracking-wider"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {walletView === "ads" && profile && (
          <AdsDashboard collaboratorId={profile.id} />
        )}

        {/* Main Grid: Extrato e Solicitações */}

        {walletView !== "affiliates" &&
          walletView !== "founder" &&
          walletView !== "analytics" &&
          walletView !== "ads" &&
          walletView !== "profile" &&
          walletView !== "community" && (
            <div className="grid gap-4 lg:grid-cols-3 relative z-10">
              {/* Ledger Extrato */}

              <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
                <h3 className="mb-4 text-base font-bold text-white font-display">
                  {t('collaborator.ledger.title', 'Extrato Contábil Recente')}
                </h3>

                {ledger.length === 0 ? (
                  <div className="py-6 text-center text-on-surface-variant text-xs font-sans">
                    {t('collaborator.ledger.noData', 'Nenhum lançamento contábil registrado ainda.')}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="text-on-surface-variant font-semibold border-b border-white/10">
                          <th className="pb-2 text-[10px] uppercase tracking-wider">
                            Data
                          </th>

                          <th className="pb-2 text-[10px] uppercase tracking-wider">
                            {t('collaborator.ledger.description', 'Descrição')}
                          </th>

                          <th className="pb-2 text-[10px] uppercase tracking-wider">
                            {t('collaborator.ledger.type', 'Tipo')}
                          </th>

                          <th className="pb-2 text-[10px] uppercase tracking-wider text-right">
                            {t('collaborator.ledger.amount', 'Valor')}
                          </th>

                          <th className="pb-2 text-[10px] uppercase tracking-wider text-right">
                            {t('collaborator.ledger.status', 'Status')}
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/5">
                        {ledger.map((item) => (
                          <tr key={item.id} className="text-on-surface">
                            <td className="py-2.5 text-on-surface-variant text-xs font-mono">
                              {new Date(item.created_at).toLocaleDateString(
                                "pt-BR",
                              )}
                            </td>

                            <td className="py-2.5 font-medium text-white text-xs">
                              <div>{item.description}</div>
                              {(() => {
                                const purchase = Array.isArray(item.purchases) ? item.purchases[0] : item.purchases;
                                if (!purchase || !purchase.escrow_status || purchase.escrow_status === 'none') return null;
                                return (
                                  <div className="mt-1.5 p-2 rounded bg-white/5 border border-white/5 space-y-1.5 font-sans max-w-xs text-on-surface-variant">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-semibold text-white flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                        Garantia de Serviço
                                      </span>
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                                        {purchase.escrow_status === 'held' ? 'Retido' :
                                         purchase.escrow_status === 'requested' ? 'Aguardando Cliente' :
                                         purchase.escrow_status === 'released' ? 'Liberado' :
                                         purchase.escrow_status === 'disputed' ? 'Disputado' : purchase.escrow_status}
                                      </span>
                                    </div>

                                    {purchase.escrow_status === 'held' && (
                                      <div className="flex items-center justify-between gap-1.5">
                                        <span className="text-[9px] text-on-surface-variant leading-tight">
                                          Serviço concluído? Solicite a liberação ao cliente.
                                        </span>
                                        <button
                                          onClick={() => handleRequestRelease(item.purchase_id)}
                                          disabled={submittingEscrow === item.purchase_id}
                                          className="px-2 py-0.5 rounded bg-primary text-on-primary hover:bg-primary/95 text-[9px] font-semibold transition disabled:opacity-40 flex-shrink-0"
                                        >
                                          Solicitar
                                        </button>
                                      </div>
                                    )}

                                    {purchase.escrow_status === 'requested' && (
                                      <div className="text-[9px] text-on-surface-variant leading-tight font-sans">
                                        Solicitado em {new Date(purchase.escrow_requested_at).toLocaleDateString('pt-BR')}. Auto-libera em 7 dias se o cliente não contestar.
                                      </div>
                                    )}

                                    {purchase.escrow_status === 'disputed' && (
                                      <div className="text-[9px] text-red-400 bg-red-500/5 p-1 rounded border border-red-500/10 font-sans">
                                        <strong>Disputado pelo cliente:</strong> "{purchase.escrow_dispute_reason || 'Sem justificativa'}"
                                      </div>
                                    )}

                                    {purchase.escrow_status === 'released' && (
                                      <div className="text-[9px] text-green-400 font-semibold font-sans">
                                        ✓ Pagamento liberado para saque.
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            <td className="py-2.5">
                              {item.type === "credit" ? (
                                <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                                  <ArrowUpRight size={13} /> {t('collaborator.ledger.entry', 'Entrada')}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                                  <ArrowDownRight size={13} /> {t('collaborator.ledger.exit', 'Saída')}
                                </span>
                              )}
                            </td>

                            <td
                              className={`py-2.5 text-right font-mono font-semibold text-xs ${item.type === "credit" ? "text-green-400" : "text-red-400"}`}
                            >
                              {item.type === "credit" ? "+" : "-"}
                              {formatMoney(item.amount)}
                            </td>

                            <td className="py-2.5 text-right">
                              {getLedgerStatusBadge(item.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Fila de Retiradas */}

              <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
                <h3 className="mb-4 text-base font-bold text-white font-display">
                  {t('collaborator.withdrawals.title', 'Solicitações de Saque')}
                </h3>

                {withdrawals.length === 0 ? (
                  <div className="py-6 text-center text-on-surface-variant text-xs font-sans">
                    {t('collaborator.withdrawals.noData', 'Nenhuma solicitação de saque enviada.')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((w) => (
                      <div
                        key={w.id}
                        className="rounded-xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-white font-mono">
                            {formatMoney(w.amount)}
                          </span>

                          {getWithdrawalStatusBadge(w.status)}
                        </div>

                        <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1 font-sans">
                          <span>
                            {t('collaborator.withdrawals.method', 'Método')}:{" "}
                            {String(
                              w.payout_method_details?.method || "",
                            ).toUpperCase()}
                          </span>

                          <span className="font-mono">
                            {new Date(w.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        {w.status === "completed" && w.receipt_url && (
                          <a
                            href={w.receipt_url}

                            target="_blank"

                            rel="noopener noreferrer"

                            className="mt-2 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                          >
                            {t('collaborator.withdrawals.viewReceipt', 'Ver Comprovante de Payout')} <ExternalLink size={12} />
                          </a>
                        )}

                        {w.status === "rejected" && w.rejection_reason && (
                          <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-300">
                            <strong>{t('collaborator.withdrawals.rejected', 'Rejeitado')}:</strong> {w.rejection_reason}
                          </div>
                        )}

                        {w.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleCancelWithdrawal(w.id)}
                            disabled={cancellingWithdrawalId === w.id}
                            className="mt-3 w-full sm:w-auto px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1"
                          >
                            {cancellingWithdrawalId === w.id ? "Cancelando..." : "Cancelar Solicitação"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Modal: Solicitar Saque */}

        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}

              animate={{ opacity: 1, scale: 1 }}

              className="w-full max-w-md rounded-2xl border border-white/15 bg-surface/95 backdrop-blur-xl p-6 shadow-2xl overlay-premium"
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white font-display">
                  {t('collaborator.wallet.requestWithdrawalUsd', 'Solicitar Saque USD')}
                </h3>

                <button
                  onClick={() => {
                    setShowWithdrawModal(false);

                    setModalError(null);

                    setModalSuccess(null);
                  }}

                  className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors"
                >
                  {t('collaborator.withdrawalModal.close', 'Fechar')}
                </button>
              </div>

              {modalSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300">
                  <CheckCircle size={16} />

                  <span>{modalSuccess}</span>
                </div>
              )}

              {modalError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                  <AlertCircle size={16} />

                  <span>{modalError}</span>
                </div>
              )}

              <form
                onSubmit={handleWithdrawSubmit}
                className="space-y-4 font-sans"
              >
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                    {t('collaborator.walletSetup.availableUsdBalance', 'Saldo Disponível para Saque')}
                  </label>

                  <div className="text-2xl font-bold text-green-400 font-mono">
                    {(Number(balance?.available_balance) || 0).toLocaleString(
                      "en-US",
                      { style: "currency", currency: "USD" },
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                    {t('collaborator.withdrawalModal.amountUsd', 'Valor Bruto do Saque (USD)')}
                  </label>

                  <div className="relative rounded-xl border border-white/10 bg-surface-high">
                    <span className="absolute left-4 top-3.5 text-on-surface-variant text-sm font-bold font-mono">
                      $
                    </span>

                    <input
                      type="number"

                      step="0.01"

                      min="50"

                      required

                      placeholder="0.00"

                      value={withdrawAmount as any}

                      onChange={(e) => setWithdrawAmount(e.target.value)}

                      className="w-full rounded-xl border-none pl-10 pr-4 py-3 text-sm font-bold font-mono text-white focus:outline-none focus:ring-0 focus:border-none bg-transparent"
                    />
                  </div>

                  <span className="mt-1 block text-xs text-on-surface-variant">
                    {t('collaborator.withdrawalModal.minAmountUsd', 'Mínimo: $50.00 USD.')}
                  </span>
                </div>

                {/* Prévia de taxas em tempo real */}

                {withdrawAmount &&
                  Number(withdrawAmount) >= 50 &&
                  (() => {
                    const gross = Number(withdrawAmount);

                    const paypalFee = Number(
                      settings?.PAYPAL_WITHDRAWAL_FEE_USD || "3.99",
                    );

                    const swiftFee = Number(
                      settings?.TAXA_TRANSFERENCIA_INTERNACIONAL_USD || "25.00",
                    );

                    const fee =
                      profile?.payoutMethod === "paypal" ? paypalFee : swiftFee;

                    const net = Math.max(0, gross - fee);

                    const feeLabel =
                      profile?.payoutMethod === "paypal"
                        ? `Taxa PayPal: -$${paypalFee.toFixed(2)}`
                        : `Taxa SWIFT (definida pelo admin): -$${swiftFee.toFixed(2)}`;

                    return (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-xs space-y-2">
                        <div className="font-bold text-white text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText size={12} className="text-primary" /> {t('collaborator.withdrawalModal.summaryTitleUsd', 'Resumo do Saque')}
                        </div>

                        <div className="flex justify-between text-on-surface-variant">
                          <span>{t('collaborator.withdrawalModal.grossAmount', 'Valor bruto solicitado:')}</span>

                          <span className="font-mono font-semibold text-white">
                            ${gross.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between text-on-surface-variant">
                          <span>{feeLabel}</span>

                          <span className="font-mono font-semibold text-red-400">
                            -${fee.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between border-t border-white/10 pt-2">
                          <span className="font-bold text-white">
                            {t('collaborator.withdrawalModal.netAmount', 'Você receberá (estimativa):')}
                          </span>

                          <span className="font-mono font-bold text-green-400">
                            ${net.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-xs text-on-surface-variant space-y-1">
                  <div className="font-semibold text-white mb-1 uppercase tracking-wider">
                    {t('collaborator.withdrawalModal.destinationData', 'Dados de Destino:')}
                  </div>

                  {profile?.payoutMethod === "paypal" ? (
                    <div>
                      PayPal Email:{" "}
                      <span className="font-medium text-white">
                        {profile?.payoutInfo?.email}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div>
                        {t('collaborator.walletSetup.bankName', 'Banco')}:{" "}
                        <span className="font-medium text-white">
                          {profile?.payoutInfo?.bankName}
                        </span>
                      </div>

                      <div>
                        {t('collaborator.walletSetup.bankHolder', 'Titular')}:{" "}
                        <span className="font-medium text-white">
                          {profile?.payoutInfo?.bankHolder}
                        </span>
                      </div>

                      <div>
                        IBAN:{" "}
                        <span className="font-medium text-white font-mono">
                          {profile?.payoutInfo?.iban}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit"

                  disabled={
                    submittingWithdraw ||
                    !withdrawAmount ||
                    Number(withdrawAmount) < 50
                  }

                  className="w-full flex items-center justify-center gap-2 rounded-full bg-on-surface py-3 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm disabled:opacity-50 font-display uppercase tracking-widest text-xs"
                >
                  {submittingWithdraw ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  ) : (
                    t('collaborator.withdrawalModal.confirm', 'Confirmar Solicitação')
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Solicitar Saque AOA */}

        {showWithdrawAoaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}

              animate={{ opacity: 1, scale: 1 }}

              className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-surface/95 backdrop-blur-xl p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between border-b border-amber-500/20 pb-3">
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <Landmark size={18} className="text-amber-400" /> {t('collaborator.wallet.requestWithdrawalAoa', 'Solicitar Saque AOA')}
                </h3>

                <button
                  onClick={() => {
                    setShowWithdrawAoaModal(false);
                    setAoaModalError(null);
                    setAoaModalSuccess(null);
                  }}

                  className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors"
                >
                  {t('collaborator.withdrawalModal.close', 'Fechar')}
                </button>
              </div>

              {aoaModalSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300">
                  <CheckCircle size={16} />
                  <span>{aoaModalSuccess}</span>
                </div>
              )}

              {aoaModalError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                  <AlertCircle size={16} />
                  <span>{aoaModalError}</span>
                </div>
              )}

              <form
                onSubmit={handleWithdrawAoaSubmit}
                className="space-y-4 font-sans"
              >
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                    {t('collaborator.walletSetup.availableAoaBalance', 'Saldo Disponível AOA')}
                  </label>

                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    Kz{" "}
                    {(
                      Number(balance?.available_balance_aoa) || 0
                    ).toLocaleString("pt-AO", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                    {t('collaborator.withdrawalModal.method', 'Método de Envio')}
                  </label>

                  <select
                    value={withdrawAoaMethod}

                    onChange={(e) =>
                      setWithdrawAoaMethod(e.target.value as any)
                    }

                    className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  >
                    <option value="iban_aoa">
                      {t('collaborator.withdrawalModal.ibanAoa', 'Conta Bancária (IBAN) — Taxa 1% + IVA')}
                    </option>

                    <option value="facipay_p2p">
                      {t('collaborator.withdrawalModal.facipayP2p', 'Conta FaciPay (P2P) — Isento')}
                    </option>

                    <option value="paypal_aoa">
                      {t('collaborator.withdrawalModal.paypalAoa', 'PayPal (Câmbio AOA→USD) — Taxa variável')}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                    {t('collaborator.withdrawalModal.amount', 'Valor do Saque (AOA)')}
                  </label>

                  <div className="relative rounded-xl border border-white/10 bg-surface-high">
                    <span className="absolute left-4 top-3.5 text-on-surface-variant text-sm font-bold font-mono">
                      Kz
                    </span>

                    <input
                      type="number"

                      step="1"

                      min={Number(settings["MINIMO_SAQUE_AOA"] || "20000")}

                      required

                      placeholder="0"

                      value={withdrawAoaAmount}

                      onChange={(e) => setWithdrawAoaAmount(e.target.value)}

                      className="w-full rounded-xl border-none pl-12 pr-4 py-3 text-sm font-bold font-mono text-white focus:outline-none focus:ring-0 bg-transparent"
                    />
                  </div>

                  <span className="mt-1 block text-xs text-on-surface-variant">
                    {t('collaborator.withdrawalModal.minAmountAoa', 'Mínimo: Kz ')}
                    {Number(
                      settings["MINIMO_SAQUE_AOA"] || "20000",
                    ).toLocaleString("pt-AO")}
                  </span>
                </div>

                {/* Prévia de taxas AOA em tempo real */}

                {withdrawAoaAmount &&
                  Number(withdrawAoaAmount) >=
                    Number(settings["MINIMO_SAQUE_AOA"] || "20000") &&
                  (() => {
                    const gross = Number(withdrawAoaAmount);

                    const ivaRate = Number(
                      settings["TAXA_FACIPAY_IVA"] || "0.14",
                    );

                    let fee = 0;

                    let feeLabel = "";

                    if (withdrawAoaMethod === "iban_aoa") {
                      const ibanRate = Number(
                        settings["TAXA_SAQUE_IBAN_AOA"] || "0.01",
                      );

                      fee = gross * ibanRate * (1 + ivaRate);

                      feeLabel = `Taxa IBAN (${(ibanRate * 100).toFixed(0)}% + ${(ivaRate * 100).toFixed(0)}% IVA)`;
                    } else if (withdrawAoaMethod === "facipay_p2p") {
                      fee = 0;

                      feeLabel = "FaciPay P2P (Isento)";
                    } else if (withdrawAoaMethod === "paypal_aoa") {
                      const paypalRate = Number(
                        settings["TAXA_CAMBIO_PAYPAL_AOA"] || "0.05",
                      );

                      fee = gross * paypalRate;

                      feeLabel = `Taxa Câmbio PayPal (${(paypalRate * 100).toFixed(0)}%)`;
                    }

                    fee = Math.round(fee * 100) / 100;

                    const net = Math.max(0, gross - fee);

                    return (
                      <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs space-y-2">
                        <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText size={12} /> {t('collaborator.withdrawalModal.summaryTitleAoa', 'Resumo do Saque AOA')}
                        </div>

                        <div className="flex justify-between text-on-surface-variant">
                          <span>{t('collaborator.withdrawalModal.grossAmount', 'Valor bruto solicitado:')}</span>

                          <span className="font-mono font-semibold text-white">
                            Kz{" "}
                            {gross.toLocaleString("pt-AO", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between text-on-surface-variant">
                          <span>{feeLabel}:</span>

                          <span className="font-mono font-semibold text-red-400">
                            -Kz{" "}
                            {fee.toLocaleString("pt-AO", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between border-t border-amber-500/20 pt-2">
                          <span className="font-bold text-white">
                            {t('collaborator.withdrawalModal.netAmount', 'Você receberá (estimativa):')}
                          </span>

                          <span className="font-mono font-bold text-green-400">
                            Kz{" "}
                            {net.toLocaleString("pt-AO", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                <button
                  type="submit"

                  disabled={
                    submittingWithdrawAoa ||
                    !withdrawAoaAmount ||
                    Number(withdrawAoaAmount) <
                      Number(settings["MINIMO_SAQUE_AOA"] || "20000")
                  }

                  className="w-full flex items-center justify-center gap-2 rounded-full bg-amber-500 py-3 font-bold text-black hover:bg-amber-400 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {submittingWithdrawAoa ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                  ) : (
                    t('collaborator.withdrawalModal.submit', 'Confirmar Saque AOA')
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Configurar Carteira */}

        {showWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}

              animate={{ opacity: 1, scale: 1 }}

              className="w-full max-w-md rounded-2xl border border-white/15 bg-surface/95 backdrop-blur-xl p-6 shadow-2xl overlay-premium"
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white font-display">
                  {t('collaborator.walletSetup.title', 'Configurações de Carteira')}
                </h3>

                <button
                  type="button"

                  onClick={() => {
                    setShowWalletModal(false);

                    setWalletError(null);

                    setWalletSuccess(null);
                  }}

                  className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors"
                >
                  {t('collaborator.withdrawalModal.close', 'Fechar')}
                </button>
              </div>

              {walletSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-300">
                  <CheckCircle size={16} />

                  <span>{walletSuccess}</span>
                </div>
              )}

              {walletError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                  <AlertCircle size={16} />

                  <span>{walletError}</span>
                </div>
              )}

              {/* Conselho para aprovação imediata */}
              <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-300 leading-relaxed font-sans">
                <strong>💡 Conselho para Aprovação Imediata:</strong> Recomenda-se vivamente que a conta de pagamento (PayPal) ou os dados bancários (IBAN/Titular) correspondam exatamente ao mesmo e-mail e nome completo que cadastrou nesta plataforma. Esta consistência acelera a verificação e garante a aprovação imediata dos seus saques pela administração.
              </div>

              <form onSubmit={handleWalletSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">
                    {t('collaborator.walletSetup.destinationMethod', 'Método de Destino')}
                  </label>

                  <div
                    className={`grid gap-3 font-sans ${isAngola ? "grid-cols-2" : "grid-cols-1"}`}
                  >
                    <button
                      type="button"

                      onClick={() => setTempPayoutMethod("paypal")}

                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                        tempPayoutMethod === "paypal"
                          ? "border-primary bg-primary/15 text-primary shadow-[0_0_15px_rgba(192,193,255,0.1)]"
                          : "border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Mail size={16} />
                      PayPal
                    </button>

                    {isAngola && (
                      <button
                        type="button"

                        onClick={() => setTempPayoutMethod("iban")}

                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                          tempPayoutMethod === "iban"
                            ? "border-primary bg-primary/15 text-primary shadow-[0_0_15px_rgba(192,193,255,0.1)]"
                            : "border-white/10 bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Landmark size={16} />
                        IBAN Bancário
                      </button>
                    )}
                  </div>
                </div>

                {tempPayoutMethod === "paypal" ? (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                      {t('collaborator.walletSetup.paypalEmail', 'E-mail do PayPal')}
                    </label>

                    <input
                      type="email"

                      required

                      placeholder="exemplo@email.com"

                      value={paypalEmail}

                      onChange={(e) => setPaypalEmail(e.target.value)}

                      className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 font-sans"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 font-sans">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        {t('collaborator.walletSetup.bankName', 'Nome do Banco')}
                      </label>

                      <input
                        type="text"

                        required

                        placeholder={t('collaborator.walletSetup.bankNamePlaceholder', 'Ex: Banco de Fomento Angola (BFA)')}

                        value={bankName}

                        onChange={(e) => setBankName(e.target.value)}

                        className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        {t('collaborator.walletSetup.bankHolder', 'Titular da Conta')}
                      </label>

                      <input
                        type="text"

                        required

                        placeholder={t('collaborator.walletSetup.bankHolderPlaceholder', 'Nome completo do titular')}

                        value={bankHolder}

                        onChange={(e) => setBankHolder(e.target.value)}

                        className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                        IBAN
                      </label>

                      <input
                        type="text"

                        required

                        placeholder="AO06.0000.0000.0000.0000.0"

                        value={iban}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 24);
                          setIban(cleaned);
                        }}
                        className="w-full rounded-xl bg-surface-high border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* FaciPay Account (para saques AOA via P2P) */}

                {isAngola && (
                  <div className="mt-2 pt-4 border-t border-white/10">
                    <label className="block text-xs font-semibold text-amber-400 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <Landmark size={12} /> {t('collaborator.walletSetup.facipayLabel', 'Conta FaciPay (Opcional — para saques AOA)')}
                    </label>

                    <input
                      type="text"

                      placeholder={t('collaborator.walletSetup.facipayPlaceholder', 'Nº da conta FaciPay')}

                      value={facipayAccount}

                      onChange={(e) => setFacipayAccount(e.target.value)}

                      className="w-full rounded-xl bg-surface-high border border-amber-500/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 font-mono"
                    />

                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {t('collaborator.walletSetup.facipayHint', 'Se tiver conta FaciPay, pode sacar AOA via P2P sem taxas.')}
                    </p>
                  </div>
                )}

                <button
                  type="submit"

                  disabled={savingWallet}

                  className="w-full flex items-center justify-center gap-2 rounded-full bg-on-surface py-3 font-semibold text-background hover:bg-primary hover:text-on-primary transition-all text-sm disabled:opacity-50 font-display uppercase tracking-widest text-xs mt-6"
                >
                  {savingWallet ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  ) : (
                    t('collaborator.walletSetup.save', 'Salvar Carteira')
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Plan Benefits & Marketing Modal */}

        {showPlanBenefitsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}

              animate={{ opacity: 1, scale: 1 }}

              exit={{ opacity: 0, scale: 0.95 }}

              className={`w-full ${pricingModalStep === "plans" ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl relative overflow-hidden transition-all duration-300`}
            >
              <div className="absolute w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(192,193,255,0.08)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] -top-10 -right-10"></div>

              {/* Header */}

              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  {pricingModalStep !== "plans" && (
                    <button
                      onClick={() => {
                        if (pricingModalStep === "select_method")
                          setPricingModalStep("plans");
                        else if (pricingModalStep === "fastpay_upload")
                          setPricingModalStep("select_method");
                      }}

                      className="mr-1 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}

                  <Award className="text-primary w-5 h-5 animate-pulse" />

                  <h3 className="font-display text-sm font-bold text-white">
                    {pricingModalStep === "plans" &&
                      "Plano de Criador CodeEngine"}

                    {pricingModalStep === "select_method" &&
                      "Método de Pagamento"}

                    {pricingModalStep === "fastpay_upload" &&
                      "Pagamento via Facipay"}
                  </h3>
                </div>

                <button
                  type="button"

                  onClick={() => setShowPlanBenefitsModal(false)}

                  className="text-on-surface-variant hover:text-white text-xs font-semibold transition-colors"
                >
                  {t('collaborator.withdrawalModal.close', 'Fechar')}
                </button>
              </div>

              {/* Content STEP 1: PLANS COMPARISON */}

              {pricingModalStep === "plans" && (
                <div className="space-y-6">
                  <div className="text-center max-w-xl mx-auto space-y-1.5 mb-6">
                    <h2 className="font-display text-xl font-bold text-white">
                      Preços Simples que Acompanham Seu Sucesso
                    </h2>

                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      Comece grátis promovendo e vendendo e-books. Faça upgrade
                      para o plano Pro para hospedar e comercializar cursos em
                      vídeo na CodeEngine.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Free Plan Card */}

                    <div className="rounded-xl border border-white/5 bg-white/5 p-4 flex flex-col justify-between min-h-[380px]">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white font-display">
                            Grátis
                          </span>

                          {profile?.plan !== "course_creator" && (
                            <span className="px-2 py-0.5 rounded bg-primary/20 border border-primary/20 text-[9px] text-primary font-bold">
                              Ativo
                            </span>
                          )}
                        </div>

                        <span className="my-3 block text-2xl font-black text-white font-display">
                          $0{" "}
                          <span className="text-xs text-on-surface-variant font-medium">
                            / mês
                          </span>
                        </span>

                        <p className="text-[11px] text-on-surface-variant font-sans mb-4">
                          Para começar a vender arquivos de e-book e scripts.
                        </p>

                        <hr className="border-dashed border-white/10 my-3" />

                        <ul className="space-y-2.5 text-xs text-on-surface-variant font-sans">
                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>Upload máximo de 50MB por arquivo</span>
                          </li>

                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>Apenas E-books e Scripts autorizados</span>
                          </li>

                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>Painel de Análise Básico</span>
                          </li>

                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>Suporte por E-mail</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6">
                        {profile?.plan !== "course_creator" ? (
                          <div className="w-full text-center py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-on-surface-variant cursor-default">
                            Seu Plano Atual
                          </div>
                        ) : (
                          <div className="w-full text-center py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-on-surface-variant cursor-default">
                            Plano Base Grátis
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pro Plan Card */}

                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col justify-between min-h-[380px] relative">
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-primary to-secondary text-[9px] text-background font-extrabold uppercase tracking-wider">
                        Popular
                      </span>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white font-display">
                            Pro (Course Creator)
                          </span>

                          {profile?.plan === "course_creator" && (
                            <span className="px-2 py-0.5 rounded bg-primary/20 border border-primary/20 text-[9px] text-primary font-bold">
                              Ativo
                            </span>
                          )}
                        </div>

                        <span className="my-3 block text-2xl font-black text-white font-display">
                          {isAngola ? (
                            <>
                              8.000 Kz{" "}
                              <span className="text-xs text-on-surface-variant font-medium">
                                / mês
                              </span>
                            </>
                          ) : (
                            <>
                              $9{" "}
                              <span className="text-xs text-on-surface-variant font-medium">
                                / mês
                              </span>
                            </>
                          )}
                        </span>

                        <p className="text-[11px] text-on-surface-variant font-sans mb-4">
                          Para criadores profissionais de cursos e vídeos.
                        </p>

                        <hr className="border-dashed border-white/10 my-3" />

                        <ul className="space-y-2.5 text-xs text-on-surface-variant font-sans">
                          <li className="block font-bold text-white text-[10px] uppercase tracking-wider mb-1">
                            Tudo no Grátis, mais:
                          </li>

                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>Upload máximo de até 2GB por arquivo</span>
                          </li>

                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>Hospedagem de Cursos e Vídeos nativa</span>
                          </li>

                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>
                              Taxas de comissão reduzidas (Lucro Extra)
                            </span>
                          </li>

                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>Destaque na Biblioteca Principal</span>
                          </li>

                          <li className="flex items-center gap-2">
                            <Check className="text-primary w-3.5 h-3.5 shrink-0" />

                            <span>Suporte VIP via WhatsApp</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6">
                        {profile?.plan === "course_creator" ? (
                          <div className="w-full text-center py-2 rounded-lg bg-primary/20 border border-primary/20 text-xs font-semibold text-primary cursor-default">
                            Seu Plano Atual
                          </div>
                        ) : (
                          <button
                            type="button"

                            onClick={() => setPricingModalStep("select_method")}

                            className="w-full rounded-lg bg-primary hover:bg-primary-high py-2 text-center text-xs font-bold text-white transition-colors uppercase tracking-wider"
                          >
                            Fazer Upgrade
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content STEP 2: SELECT METHOD */}

              {pricingModalStep === "select_method" && (
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-2">
                    <h2 className="font-display text-base font-bold text-white">
                      Escolha a Opção de Upgrade
                    </h2>

                    <p className="font-sans text-xs text-on-surface-variant">
                      Selecione o seu meio de pagamento para ativar o plano Pro.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Stripe Card */}

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            Opção 1: Cartão de Crédito / Stripe (Cobrança em
                            Dólar)
                          </h4>

                          <p className="text-xs text-on-surface-variant mt-1 leading-normal">
                            Pague de forma segura com qualquer cartão
                            internacional. Ativação instantânea na conta.
                          </p>
                        </div>

                        <span className="text-sm font-black text-primary font-mono shrink-0">
                          $9.00 USD/mês
                        </span>
                      </div>

                      <button
                        type="button"

                        disabled={submittingStripe}

                        onClick={handleStripeUpgrade}

                        className="w-full rounded-lg bg-primary py-2 text-center text-xs font-bold text-white hover:bg-primary-high transition-colors uppercase tracking-wider disabled:opacity-50"
                      >
                        {submittingStripe
                          ? "Conectando..."
                          : "Pagar via Stripe"}
                      </button>

                      {stripeError && (
                        <p className="text-red-400 text-xs mt-1 text-center font-semibold">
                          {stripeError}
                        </p>
                      )}
                    </div>

                    {/* Facipay Card (Always show it, but customize for Angolans) */}

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-600/30 transition-all flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            Opção 2: Facipay / Transferência (Cobrança em
                            Kwanza)
                          </h4>

                          <p className="text-xs text-on-surface-variant mt-1 leading-normal">
                            Método preferencial para Angola. Transferência ou
                            depósito manual. Liberação após validação.
                          </p>
                        </div>

                        <span className="text-sm font-black text-green-400 font-mono shrink-0">
                          8.000 Kz/mês
                        </span>
                      </div>

                      <button
                        type="button"

                        onClick={() => setPricingModalStep("fastpay_upload")}

                        className="w-full rounded-lg bg-green-600 hover:bg-green-700 py-2 text-center text-xs font-bold text-white transition-colors uppercase tracking-wider"
                      >
                        Pagar via Facipay
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content STEP 3: FASTPAY UPLOAD */}

              {pricingModalStep === "fastpay_upload" && (
                <div className="space-y-4">
                  <div className="text-center space-y-1 mb-2">
                    <h2 className="font-display text-base font-bold text-white">
                      Pagamento via Facipay
                    </h2>

                    <p className="font-sans text-xs text-on-surface-variant">
                      Efetue o pagamento através do link direto e anexe o comprovativo.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-5 h-5 text-orange-400" />
                      <span className="font-display font-bold text-orange-300 text-sm">
                        Como funciona o Pagamento via Facipay
                      </span>
                    </div>
                    <ol className="space-y-2 text-xs text-on-surface-variant list-decimal list-inside font-sans leading-relaxed">
                      <li>Você será redirecionado para o link de pagamento</li>
                      <li>Efetue o pagamento via Multicaixa Express, TPA ou Transferência</li>
                      <li>Faça upload do comprovativo de pagamento abaixo</li>
                      <li>Aguarde a validação e ativação pela nossa equipe (até 24h úteis)</li>
                    </ol>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-left">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Valor a pagar</p>
                      <p className="text-base font-display font-bold text-primary font-mono">
                        8.000 Kz
                      </p>
                    </div>
                  </div>

                  {profile?.upgradeStatus === "pending_approval" ? (
                    <div className="bg-orange-500/20 text-orange-400 p-3 rounded-lg text-xs border border-orange-500/30 text-center font-medium font-sans">
                      Seu comprovativo já foi enviado e está em análise. O plano
                      Pro será ativado em breve!
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1 border-t border-white/5">
                      {profile?.upgradeStatus === "rejected" && (
                        <div className="bg-red-500/20 text-red-400 p-2 rounded-lg text-xs border border-red-500/30 text-center font-semibold font-sans">
                          Seu comprovativo anterior foi rejeitado. Envie um novo
                          comprovativo válido.
                        </div>
                      )}

                      <a
                        href={
                          settings.fastpay_subscription_link ||
                          "https://fastpay.co.ao/pay/codeengine-creator"
                        }

                        target="_blank"

                        rel="noopener noreferrer"

                        className="block w-full text-center rounded-lg bg-green-600 hover:bg-green-700 py-2 text-xs font-bold text-white transition-colors uppercase tracking-wider"
                      >
                        1. Pagar no Facipay (Link Direto)
                      </a>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-gray-400 font-sans">
                          2. Faça o upload do Comprovativo:
                        </label>

                        <input
                          type="file"

                          accept="image/*,application/pdf"

                          onChange={handleReceiptUpload}

                          className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-high file:cursor-pointer"
                        />

                        {uploadingReceipt && (
                          <p className="text-primary text-[10px] animate-pulse">
                            A carregar comprovativo...
                          </p>
                        )}

                        {receiptUrl && (
                          <p className="text-green-500 text-[10px]">
                            Comprovativo carregado com sucesso!
                          </p>
                        )}
                      </div>

                      <button
                        type="button"

                        disabled={!receiptUrl}

                        onClick={handleFastpaySubmit}

                        className="w-full rounded-lg bg-primary py-2 text-center text-xs font-bold text-white hover:bg-primary-high transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Enviar Comprovativo para Validação
                      </button>

                      {fastpaySuccess && (
                        <p className="text-green-500 text-xs text-center mt-1 font-semibold">
                          {fastpaySuccess}
                        </p>
                      )}

                      {fastpayError && (
                        <p className="text-red-500 text-xs text-center mt-1 font-semibold">
                          {fastpayError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function CollaboratorAffiliatesPanel({ affiliates }: { affiliates: any[] }) {
  const { isAngola } = useUserCountry();

  const [search, setSearch] = useState("");

  // Filter

  const filtered = affiliates.filter(
    (aff) =>
      aff.product_title?.toLowerCase().includes(search.toLowerCase()) ||
      aff.affiliate_name?.toLowerCase().includes(search.toLowerCase()) ||
      aff.affiliate_email?.toLowerCase().includes(search.toLowerCase()),
  );

  // Totals

  const totalAffiliates = affiliates.length;

  const totalClicks = affiliates.reduce((sum, a) => sum + (a.clicks || 0), 0);

  const totalConversions = affiliates.reduce(
    (sum, a) => sum + (a.totalConversions || 0),
    0,
  );

  const avgCR =
    totalClicks > 0
      ? ((totalConversions / totalClicks) * 100).toFixed(1)
      : "0.0";

  const totalSalesUSD = affiliates.reduce(
    (sum, a) => sum + (a.salesUSD || 0),
    0,
  );

  const totalSalesAOA = affiliates.reduce(
    (sum, a) => sum + (a.salesAOA || 0),
    0,
  );

  const totalCommUSD = affiliates.reduce(
    (sum, a) => sum + (a.commissionUSD || 0),
    0,
  );

  const totalCommAOA = affiliates.reduce(
    (sum, a) => sum + (a.commissionAOA || 0),
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Cards */}

      <div className="grid gap-4 sm:grid-cols-4 relative z-10">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-purple-500/15">
          <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(168,85,247,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users size={18} />
            </div>

            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-wider">
              Afiliados
            </span>
          </div>

          <span className="block text-xs font-semibold text-on-surface-variant mb-1">
            Afiliados Ativos
          </span>

          <span className="block text-xl font-bold text-white font-mono">
            {totalAffiliates}
          </span>

          <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
            Membros que criaram links para seus produtos.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-blue-500/15">
          <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <TrendingUp size={18} />
            </div>

            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">
              Desempenho
            </span>
          </div>

          <span className="block text-xs font-semibold text-on-surface-variant mb-1">
            Cliques / Vendas
          </span>

          <span className="block text-xl font-bold text-white font-mono">
            {totalClicks}{" "}
            <span className="text-xs text-on-surface-variant">/</span>{" "}
            {totalConversions}
          </span>

          <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
            Conversão Média:{" "}
            <strong className="text-blue-400 font-mono">{avgCR}%</strong>
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-green-500/15">
          <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle size={18} />
            </div>

            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">
              Volume
            </span>
          </div>

          <span className="block text-xs font-semibold text-on-surface-variant mb-1">
            Vendas Geradas
          </span>

          <div className="space-y-0.5 font-mono">
            <span className="block text-sm font-bold text-white">
              ${totalSalesUSD.toFixed(2)}
            </span>

            {isAngola && (
              <span className="block text-xs font-semibold text-green-400">
                Kz {totalSalesAOA.toLocaleString("pt-AO")}
              </span>
            )}
          </div>

          <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
            Faturamento bruto total gerado por terceiros.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-amber-500/15">
          <div className="absolute w-[120px] h-[120px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent size={18} />
            </div>

            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
              Comissões
            </span>
          </div>

          <span className="block text-xs font-semibold text-on-surface-variant mb-1">
            Comissões de Afiliados
          </span>

          <div className="space-y-0.5 font-mono">
            <span className="block text-sm font-bold text-white">
              ${totalCommUSD.toFixed(2)}
            </span>

            {isAngola && (
              <span className="block text-xs font-semibold text-amber-400">
                Kz {totalCommAOA.toLocaleString("pt-AO")}
              </span>
            )}
          </div>

          <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
            Repasses gerados aos seus afiliados.
          </p>
        </div>
      </div>

      {/* List Table */}

      <div className="glass-panel rounded-2xl p-6 border border-white/10 relative z-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              Afiliados dos Meus Produtos
            </h3>

            <p className="text-xs text-on-surface-variant mt-0.5">
              Veja quem está a vender seus produtos e o desempenho individual.
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search
              size={14}
              className="absolute left-3.5 top-3.5 text-on-surface-variant"
            />

            <input
              type="text"

              placeholder="Buscar por produto ou afiliado..."

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-high border border-white/10 text-xs font-semibold text-white placeholder-on-surface-variant focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all bg-transparent"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant text-sm font-sans">
            Nenhum afiliado encontrado. Certifique-se de habilitar o programa de
            afiliados nas configurações do seu produto!
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-on-surface-variant font-semibold border-b border-white/10">
                  <th className="pb-3 text-xs uppercase tracking-wider">
                    Produto
                  </th>

                  <th className="pb-3 text-xs uppercase tracking-wider">
                    Afiliado
                  </th>

                  <th className="pb-3 text-xs uppercase tracking-wider">
                    Cliques / Vendas
                  </th>

                  <th className="pb-3 text-xs uppercase tracking-wider">
                    Taxa CR %
                  </th>

                  <th className="pb-3 text-xs uppercase tracking-wider text-right">
                    Volume Vendido
                  </th>

                  <th className="pb-3 text-xs uppercase tracking-wider text-right">
                    Comissão Afiliado
                  </th>

                  <th className="pb-3 text-xs uppercase tracking-wider text-right">
                    Data Início
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filtered.map((item) => {
                  const cr =
                    item.clicks > 0
                      ? ((item.totalConversions / item.clicks) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/5 transition-all duration-150"
                    >
                      <td className="py-4 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />

                        <span className="line-clamp-1">
                          {item.product_title}
                        </span>
                      </td>

                      <td className="py-4">
                        <div className="font-semibold text-white text-xs">
                          {item.affiliate_name}
                        </div>

                        <div className="text-[10px] text-on-surface-variant font-mono">
                          {item.affiliate_email}
                        </div>
                      </td>

                      <td className="py-4 text-xs font-mono font-semibold text-on-surface-variant">
                        {item.clicks} clicks{" "}
                        <span className="text-[10px] text-white/20">/</span>{" "}
                        <span className="text-white">
                          {item.totalConversions} vendas
                        </span>
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            Number(cr) >= 5
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : Number(cr) > 0
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-white/5 text-on-surface-variant"
                          }`}
                        >
                          {cr}%
                        </span>
                      </td>

                      <td className="py-4 text-right">
                        <div className="font-mono font-bold text-xs text-white">
                          {item.salesUSD > 0 && `$${item.salesUSD.toFixed(2)}`}
                        </div>

                        {isAngola && (
                          <div className="font-mono font-semibold text-[10px] text-green-400 mt-0.5">
                            {item.salesAOA > 0 &&
                              `Kz ${item.salesAOA.toLocaleString("pt-AO")}`}
                          </div>
                        )}

                        {item.salesUSD === 0 &&
                          (!isAngola || item.salesAOA === 0) && (
                            <span className="text-[10px] text-on-surface-variant font-mono">
                              -
                            </span>
                          )}
                      </td>

                      <td className="py-4 text-right">
                        <div className="font-mono font-bold text-xs text-purple-300">
                          {item.commissionUSD > 0 &&
                            `$${item.commissionUSD.toFixed(2)}`}
                        </div>

                        {isAngola && (
                          <div className="font-mono font-semibold text-[10px] text-amber-400 mt-0.5">
                            {item.commissionAOA > 0 &&
                              `Kz ${item.commissionAOA.toLocaleString("pt-AO")}`}
                          </div>
                        )}

                        {item.commissionUSD === 0 &&
                          (!isAngola || item.commissionAOA === 0) && (
                            <span className="text-[10px] text-on-surface-variant font-mono">
                              -
                            </span>
                          )}
                      </td>

                      <td className="py-4 text-right text-xs text-on-surface-variant font-mono">
                        {new Date(item.created_at).toLocaleDateString("pt-PT")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PureSvgChart({
  data,
}: {
  data: Array<{
    displayDate: string;
    views: number;
    conversions: number;
    revenueUsd: number;
    revenueAoa: number;
  }>;
}) {
  const width = 500;

  const height = 160;

  const paddingLeft = 42;

  const paddingRight = 20;

  const paddingTop = 16;

  const paddingBottom = 28;

  const chartWidth = width - paddingLeft - paddingRight;

  const chartHeight = height - paddingTop - paddingBottom;

  const maxViews = Math.max(...data.map((d) => d.views), 1);

  const maxConversions = Math.max(...data.map((d) => d.conversions), 1);

  const maxVal = Math.max(maxViews, maxConversions);

  const pts = (getter: (d: any) => number) =>
    data.map((d, i) => ({
      x: paddingLeft + (i / (data.length - 1 || 1)) * chartWidth,

      y: paddingTop + chartHeight - (getter(d) / maxVal) * chartHeight,

      data: d,
    }));

  const pV = pts((d) => d.views);

  const pC = pts((d) => d.conversions);

  const bezier = (ps: { x: number; y: number }[]) => {
    if (ps.length < 2) return "";

    let d = `M ${ps[0].x.toFixed(2)} ${ps[0].y.toFixed(2)}`;

    for (let i = 0; i < ps.length - 1; i++) {
      const dx = (ps[i + 1].x - ps[i].x) * 0.42;

      d += ` C ${(ps[i].x + dx).toFixed(2)} ${ps[i].y.toFixed(2)}, ${(ps[i + 1].x - dx).toFixed(2)} ${ps[i + 1].y.toFixed(2)}, ${ps[i + 1].x.toFixed(2)} ${ps[i + 1].y.toFixed(2)}`;
    }

    return d;
  };

  const lineV = bezier(pV);

  const lineC = bezier(pC);

  const areaV = lineV
    ? `${lineV} L ${pV[pV.length - 1].x} ${height - paddingBottom} L ${pV[0].x} ${height - paddingBottom} Z`
    : "";

  const areaC = lineC
    ? `${lineC} L ${pC[pC.length - 1].x} ${height - paddingBottom} L ${pC[0].x} ${height - paddingBottom} Z`
    : "";

  const [hovered, setHovered] = useState<any>(null);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.25" />

            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" stopOpacity="0.18" />

            <stop offset="100%" stopColor="#475569" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}

        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = paddingTop + chartHeight * r;

          const v = Math.round(maxVal * (1 - r));

          return (
            <g key={i}>
              {r < 1 && (
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}

                  stroke="white"
                  strokeWidth={0.5}

                  strokeOpacity={0.06}
                />
              )}

              <text
                x={paddingLeft - 8}
                y={y + 3}
                fill="white"
                fontSize="8"

                textAnchor="end"
                fillOpacity="0.4"
                fontFamily="monospace"
                fontWeight="600"
              >
                {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              </text>
            </g>
          );
        })}

        {/* Y Axis Vertical Line on the left */}

        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}

          stroke="white"
          strokeOpacity="0.12"
          strokeWidth={0.8}
        />

        {/* X Axis Horizontal Line at the bottom */}

        <line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - paddingRight}
          y2={height - paddingBottom}

          stroke="white"
          strokeOpacity="0.12"
          strokeWidth={0.8}
        />

        {/* X axis labels */}

        {data.map((d, i) => {
          const step = Math.ceil(data.length / 6) || 1;

          if (i % step !== 0 && i !== data.length - 1) return null;

          const x = paddingLeft + (i / (data.length - 1 || 1)) * chartWidth;

          return (
            <text
              key={i}
              x={x}
              y={height - 7}
              fill="white"
              fontSize="8"

              textAnchor="middle"
              fillOpacity="0.33"
              fontFamily="monospace"
              fontWeight="600"
            >
              {d.displayDate}
            </text>
          );
        })}

        {/* Area fills */}

        {areaV && <path d={areaV} fill="url(#gV)" />}

        {areaC && <path d={areaC} fill="url(#gC)" />}

        {/* Smooth lines with glow */}

        {lineV && (
          <path
            d={lineV}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}

        {lineC && (
          <path
            d={lineC}
            fill="none"
            stroke="#475569"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}

        {/* Interactive points */}

        {pV.map((p, i) => {
          const pc2 = pC[i];

          const on = hovered && hovered.i === i;

          const colW =
            data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

          return (
            <g key={i}>
              <rect
                x={p.x - colW / 2}
                y={paddingTop}
                width={colW}
                height={chartHeight}

                fill="transparent"
                className="cursor-crosshair"

                onMouseEnter={() =>
                  setHovered({ i, x: p.x, data: p.data, yV: p.y, yC: pc2.y })
                }

                onMouseLeave={() => setHovered(null)}
              />

              {on && (
                <line
                  x1={p.x}
                  y1={paddingTop}
                  x2={p.x}
                  y2={height - paddingBottom}

                  stroke="white"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                  strokeOpacity="0.22"

                  className="pointer-events-none"
                />
              )}

              {/* Views dot */}

              <circle
                cx={p.x}
                cy={p.y}
                r={on ? 5 : 2}
                fill="#94a3b8"

                stroke={on ? "white" : "rgba(148,163,184,0.35)"}
                strokeWidth={on ? 1.5 : 0.8}

                className="pointer-events-none transition-all duration-150"
              />

              {/* Conversions dot */}

              <circle
                cx={pc2.x}
                cy={pc2.y}
                r={on ? 5 : 2}
                fill="#475569"

                stroke={on ? "white" : "rgba(71,85,105,0.35)"}
                strokeWidth={on ? 1.5 : 0.8}

                className="pointer-events-none transition-all duration-150"
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}

      {hovered && (
        <div
          className="absolute z-30 pointer-events-none backdrop-blur-2xl bg-[#0c0e18]/95 border border-white/10 rounded-2xl px-3.5 py-3 shadow-2xl text-[11px] min-w-[152px]"

          style={{
            left: `${Math.min(73, Math.max(5, (hovered.x / width) * 100))}%`,
            top: "-14px",
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-mono text-[9.5px] tracking-widest uppercase text-white/40 font-bold mb-2 pb-1.5 border-b border-white/8">
            {hovered.data.displayDate}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-5">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[10.5px]">
                <span
                  className="w-2 h-2 rounded-full bg-[#94a3b8] flex-shrink-0"
                  style={{ boxShadow: "0 0 6px rgba(148,163,184,0.5)" }}
                />
                Views
              </span>

              <span className="font-mono font-bold text-white">
                {hovered.data.views.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center gap-5">
              <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10.5px]">
                <span
                  className="w-2 h-2 rounded-full bg-[#475569] flex-shrink-0"
                  style={{ boxShadow: "0 0 6px rgba(71,85,105,0.4)" }}
                />
                Vendas
              </span>

              <span className="font-mono font-bold text-white">
                {hovered.data.conversions.toLocaleString()}
              </span>
            </div>

            {(hovered.data.revenueUsd > 0 || hovered.data.revenueAoa > 0) && (
              <div className="mt-2 pt-2 border-t border-white/8 space-y-1">
                <span className="block text-[8.5px] uppercase tracking-widest text-white/25 font-bold mb-1">
                  Receita
                </span>

                {hovered.data.revenueUsd > 0 && (
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-white/40">USD</span>

                    <span className="font-bold text-white">
                      ${hovered.data.revenueUsd.toFixed(2)}
                    </span>
                  </div>
                )}

                {hovered.data.revenueAoa > 0 && (
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-white/40">AOA</span>

                    <span className="font-bold text-emerald-400">
                      Kz {hovered.data.revenueAoa.toLocaleString("pt-AO")}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CollaboratorAnalyticsPanel({ t, walletView }: { t: any; walletView: string }) {
  const [loading, setLoading] = useState(true);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(false);

  const [summary, setSummary] = useState<any>(null);

  const [chartData, setChartData] = useState<any[]>([]);

  const [products, setProducts] = useState<any[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<string>("");

  const [period, setPeriod] = useState<string>("30d");

  useEffect(() => {
    if (walletView === "analytics") {
      fetchAnalytics();
    }
  }, [selectedProduct, period, walletView]);

  async function fetchAnalytics() {
    setLoading(true);
    setError(false);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      let url = `${BACKEND_URL}/api/collaborators/analytics?period=${period}`;
      if (selectedProduct) {
        url += `&productId=${selectedProduct}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        // API returned an error — show zeros gracefully, not a blocking error
        console.warn('[CollaboratorAnalyticsPanel] analytics API error:', res.status);
        setSummary({ totalViews: 0, totalConversions: 0, totalRevenueUsd: 0, totalRevenueAoa: 0, conversionRate: 0 });
        setChartData([]);
        setProducts([]);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
        setChartData(data.chartData);
        setProducts(data.products || []);
      } else {
        // API returned success:false — show zeros gracefully
        setSummary({ totalViews: 0, totalConversions: 0, totalRevenueUsd: 0, totalRevenueAoa: 0, conversionRate: 0 });
        setChartData([]);
        setProducts([]);
      }
    } catch (err) {
      // Network error — show zeros gracefully
      console.warn('[CollaboratorAnalyticsPanel] network error:', err);
      setSummary({ totalViews: 0, totalConversions: 0, totalRevenueUsd: 0, totalRevenueAoa: 0, conversionRate: 0 });
      setChartData([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      {/* Filters panel */}

      <div className="glass-panel rounded-2xl p-2.5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div>
          <h3 className="text-sm font-bold text-white font-display">
            {t("collaborator.analytics.title", "Análise de Tráfego e Vendas")}
          </h3>

          <p className="text-[10px] text-on-surface-variant mt-0.5">
            {t(
              "collaborator.analytics.description",
              "Monitore as visitas, conversões e o faturamento total gerado pelas páginas de seus produtos.",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Product selector dropdown */}

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t(
                "collaborator.analytics.productSelector",
                "Filtrar por Produto",
              )}
            </span>

            <select
              value={selectedProduct}

              onChange={(e) => setSelectedProduct(e.target.value)}

              className="rounded-xl bg-surface-high border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 font-sans"
            >
              <option value="">
                {t("collaborator.analytics.allProducts", "Todos os Produtos")}
              </option>

              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Period selector */}

          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
              {t("collaborator.analytics.periodSelector", "Período")}
            </span>

            <div className="flex items-center gap-1 p-0.5 bg-surface-high rounded-xl border border-white/10">
              {(["7d", "30d", "90d"] as const).map((p) => (
                <button
                  key={p}

                  onClick={() => setPeriod(p)}

                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    period === p
                      ? "bg-primary text-background"
                      : "text-on-surface-variant hover:text-white"
                  }`}
                >
                  {p === "7d"
                    ? t("collaborator.analytics.days7", "7D")
                    : p === "90d"
                      ? t("collaborator.analytics.days90", "90D")
                      : t("collaborator.analytics.days30", "30D")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex justify-center items-center py-12 text-on-surface-variant">
          <RefreshCw size={16} className="animate-spin mr-2" />{" "}
          {t(
            "collaborator.analytics.loading",
            "Carregando dados de análise...",
          )}
        </div>
      ) : error ? (
        <div className="glass-panel rounded-2xl p-6 border border-red-500/20 text-center text-red-400 text-sm">
          {t(
            "collaborator.analytics.errorLoading",
            "Erro ao carregar análise. Tente novamente.",
          )}
        </div>
      ) : (
        <>
          {/* Summary Cards */}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 relative z-10">
            {/* Card 1: Views */}

            <div className="glass-card rounded-2xl p-2.5 relative overflow-hidden border border-blue-500/15">
              <div className="absolute w-[100px] h-[100px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

              <div className="flex items-center justify-between mb-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Eye size={13} />
                </div>

                <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">
                  {t("collaborator.tabAnalytics", "Análise")}
                </span>
              </div>

              <span className="block text-[10px] font-semibold text-on-surface-variant mb-0.5">
                {t("collaborator.analytics.views", "Visualizações")}
              </span>

              <span className="block text-base font-bold text-white font-mono">
                {summary?.totalViews ?? 0}
              </span>
            </div>

            {/* Card 2: Conversions */}

            <div className="glass-card rounded-2xl p-2.5 relative overflow-hidden border border-green-500/15">
              <div className="absolute w-[100px] h-[100px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

              <div className="flex items-center justify-between mb-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle size={13} />
                </div>

                <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">
                  {t(
                    "collaborator.analytics.conversions",
                    "Conversões (Vendas)",
                  )}
                </span>
              </div>

              <span className="block text-[10px] font-semibold text-on-surface-variant mb-0.5">
                {t("collaborator.analytics.conversions", "Conversões (Vendas)")}
              </span>

              <span className="block text-base font-bold text-white font-mono">
                {summary?.totalConversions ?? 0}
              </span>
            </div>

            {/* Card 3: CR% */}

            <div className="glass-card rounded-2xl p-2.5 relative overflow-hidden border border-purple-500/15">
              <div className="absolute w-[100px] h-[100px] bg-[radial-gradient(circle,rgba(168,85,247,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

              <div className="flex items-center justify-between mb-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ArrowUpRight size={13} />
                </div>

                <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-wider">
                  CR %
                </span>
              </div>

              <span className="block text-[10px] font-semibold text-on-surface-variant mb-0.5">
                {t(
                  "collaborator.analytics.conversionRate",
                  "Taxa de Conversão",
                )}
              </span>

              <span className="block text-base font-bold text-white font-mono">
                {Number(summary?.conversionRate || 0).toFixed(1)}%
              </span>
            </div>

            {/* Card 4: Revenue USD */}

            <div className="glass-card rounded-2xl p-2.5 relative overflow-hidden border border-primary/15">
              <div className="absolute w-[100px] h-[100px] bg-[radial-gradient(circle,rgba(192,193,255,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

              <div className="flex items-center justify-between mb-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                  <DollarSign size={13} />
                </div>

                <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">
                  USD
                </span>
              </div>

              <span className="block text-[10px] font-semibold text-on-surface-variant mb-0.5">
                {t("collaborator.analytics.revenueUsd", "Faturamento USD")}
              </span>

              <span className="block text-base font-bold text-white font-mono">
                {Number(summary?.totalRevenueUsd || 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </span>
            </div>

            {/* Card 5: Revenue AOA */}

            <div className="glass-card rounded-2xl p-2.5 relative overflow-hidden border border-amber-500/15">
              <div className="absolute w-[100px] h-[100px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none z-[-1] top-0 right-0" />

              <div className="flex items-center justify-between mb-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Landmark size={13} />
                </div>

                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                  AOA
                </span>
              </div>

              <span className="block text-[10px] font-semibold text-on-surface-variant mb-0.5">
                {t("collaborator.analytics.revenueAoa", "Faturamento AOA")}
              </span>

              <span className="block text-base font-bold text-white font-mono">
                {Number(summary?.totalRevenueAoa || 0).toLocaleString("pt-AO", {
                  style: "currency",
                  currency: "AOA",
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>

          {/* Chart Container */}

          <div className="bg-[#121214] rounded-2xl p-4 sm:p-5 border border-[#1c1c1f] relative z-10 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                Monotone Smooth
              </h4>

              <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                <svg
                  className="w-3 h-3 text-white/70"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 18 22 12 16 6" />

                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-sm font-sans">
                {t(
                  "collaborator.analytics.noData",
                  "Nenhum dado encontrado para este período.",
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <PureSvgChart data={chartData} />

                {/* Custom chart legend */}

                <div className="flex justify-center gap-6 pt-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full bg-[#94a3b8]"
                      style={{ boxShadow: "0 0 6px rgba(148,163,184,0.5)" }}
                    />

                    <span>Organic</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full bg-[#475569]"
                      style={{ boxShadow: "0 0 6px rgba(71,85,105,0.4)" }}
                    />

                    <span>Paid</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
