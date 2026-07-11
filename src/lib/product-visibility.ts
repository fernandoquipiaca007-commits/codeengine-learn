import { LEVEL_ORDER } from '../hooks/usePoints';

export type MemberLevel = (typeof LEVEL_ORDER)[number];

export function levelRank(level: string | null | undefined): number {
  if (!level) return 0;
  const idx = LEVEL_ORDER.indexOf(level as MemberLevel);
  return idx >= 0 ? idx : 0;
}

export function canViewProduct(
  product: {
    visibility?: string | null;
    min_member_level?: string | null;
    collaborator_id?: string | null;
  },
  memberLevel: string | null | undefined,
  isLoggedIn: boolean,
  currentCollaboratorId?: string | null
): boolean {
  const visibility = product.visibility || 'public';
  if (visibility === 'hidden') {
    return !!currentCollaboratorId && currentCollaboratorId === product.collaborator_id;
  }
  if (visibility === 'public') {
    const min = product.min_member_level;
    if (!min) return true;
    if (!isLoggedIn) return false;
    return levelRank(memberLevel) >= levelRank(min);
  }
  if (visibility === 'members_only') {
    if (!isLoggedIn) return false;
    const min = product.min_member_level;
    if (!min) return true;
    return levelRank(memberLevel) >= levelRank(min);
  }
  return true;
}
