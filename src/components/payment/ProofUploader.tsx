/**
 * ProofUploader
 * Drag-and-drop file upload for FastPay payment proof.
 * Validates file type (JPG, PNG, PDF) and size (max 10MB) on client side.
 */
import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileImage, FileText, X, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLocale } from '../../contexts/LocaleContext';

interface ProofUploaderProps {
  orderId: string;
  onUploadComplete: (proofUrl: string) => void;
  onError?: (error: string) => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];

export function ProofUploader({ orderId, onUploadComplete, onError }: ProofUploaderProps) {
  const { locale } = useLocale();
  const { t } = useTranslation('checkout', { lng: locale });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return t('proofUploader.invalidFormat');
      }
    }
    if (f.size > MAX_SIZE) {
      return t('proofUploader.fileTooLarge', { size: (f.size / 1024 / 1024).toFixed(1) });
    }
    return null;
  }, [t]);

  const handleFile = useCallback((f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      onError?.(validationError);
      return;
    }

    setFile(f);
    setError(null);

    // Generate preview for images
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, [validateFile, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t('proofUploader.sessionExpired'));

      const formData = new FormData();
      formData.append('proof', file);
      formData.append('order_id', orderId);

      setUploadProgress(30);

      const response = await fetch(`${BACKEND_URL}/api/fastpay/upload-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      setUploadProgress(80);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || t('proofUploader.uploadFailed'));
      }

      setUploadProgress(100);
      setUploadSuccess(true);
      onUploadComplete(data.proof_url);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('proofUploader.uploadError');
      setError(message);
      onError?.(message);
    } finally {
      setUploading(false);
    }
  };

  const retry = () => {
    setError(null);
    setUploadProgress(0);
    handleUpload();
  };

  if (uploadSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="font-display font-bold text-green-400 text-center">
          {t('proofUploader.uploadSuccess')}
        </p>
        <p className="text-sm text-on-surface-variant text-center">
          {t('proofUploader.uploadSuccessDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed p-8
            flex flex-col items-center gap-3 transition-all duration-200
            ${isDragging
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-white/20 hover:border-primary/50 hover:bg-white/5'
            }
          `}
        >
          <Upload className={`w-10 h-10 ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`} />
          <div className="text-center">
            <p className="font-display font-semibold text-on-surface text-sm">
              {isDragging ? t('proofUploader.dragDropActive') : t('proofUploader.dragDropPlaceholder')}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {t('proofUploader.fileLimitLabel')}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* File preview */}
      {file && !uploading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-highest border border-white/10">
          {preview ? (
            <img src={preview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-red-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">{file.name}</p>
            <p className="text-xs text-on-surface-variant">
              {(file.size / 1024 / 1024).toFixed(2)} MB •{' '}
              {file.type === 'application/pdf' ? t('proofUploader.pdfLabel') : t('proofUploader.imageLabel')}
            </p>
          </div>
          <button
            onClick={removeFile}
            className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-on-surface">{t('proofUploader.uploadingProgress')}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={retry}
              className="flex items-center gap-1 mt-1 text-xs text-red-300 hover:text-red-200"
            >
              <RefreshCw className="w-3 h-3" /> {t('proofUploader.retry')}
            </button>
          </div>
        </div>
      )}

      {/* Upload button */}
      {file && !uploading && !uploadSuccess && (
        <button
          onClick={handleUpload}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                     bg-primary text-on-primary font-display font-bold
                     hover:bg-primary/90 transition-all"
        >
          <Upload className="w-5 h-5" />
          {t('proofUploader.submitAction')}
        </button>
      )}
    </div>
  );
}
