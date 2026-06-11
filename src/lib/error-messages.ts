export type StoreErrorContext = 'load' | 'save' | 'auth' | 'payment' | 'network' | 'generic';

export function mapStoreError(error: unknown, context: StoreErrorContext = 'generic'): string {
  const technical =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Erro desconhecido';

  const lower = technical.toLowerCase();

  if (lower.includes('fetch') || lower.includes('network')) {
    return 'Problema de conexão com a internet. Verifique sua rede e tente novamente.';
  }
  if (
    (lower.includes('jwt') || lower.includes('session') || lower.includes('auth')) &&
    !lower.includes('checkout') &&
    !lower.includes('stripe')
  ) {
    return 'Sua sessão expirou. Entre novamente.';
  }
  if (lower.includes('stripe') || lower.includes('payment') || lower.includes('checkout')) {
    return 'Erro ao processar pagamento. Tente novamente ou contacte o suporte.';
  }

  switch (context) {
    case 'load':
      return 'Erro ao carregar os dados. Tente novamente.';
    case 'save':
      return 'Erro ao guardar alterações. Tente novamente.';
    case 'auth':
      return 'Erro de autenticação. Verifique seus dados e tente novamente.';
    case 'payment':
      return 'Erro ao processar pagamento.';
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}
