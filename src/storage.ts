import type { StoredVote, TrelloClient, VoteTypeCode, VoteTypeLabel, VoteView } from './types';

export const DEFAULT_COUNTRIES = [
  'South Africa',
  'Italy',
  'Brazil',
  'United States'
];

export const VOTE_LABELS: Record<VoteTypeCode, VoteTypeLabel> = {
  s: 'Support',
  b: 'Blocker',
  n: 'Nice to have'
};

export const VOTE_CODES: Record<VoteTypeLabel, VoteTypeCode> = {
  Support: 's',
  Blocker: 'b',
  'Nice to have': 'n'
};

export const MAX_COMMENT_LENGTH = 200;

const STORAGE_LIMIT_PATTERN = /4096|PluginData length/i;

export function isStorageLimitError(error: unknown): boolean {
  return STORAGE_LIMIT_PATTERN.test(String(error instanceof Error ? error.message : error));
}

export function friendlyStorageError(error: unknown): string {
  if (isStorageLimitError(error)) {
    return 'This card has reached Trello\'s Power-Up storage limit. Try shortening comments or removing older votes before saving.';
  }

  return 'Trello could not save this vote. Please try again in a moment.';
}

export async function getVotes(t: TrelloClient, cardScope = 'card'): Promise<StoredVote[]> {
  const votes = await t.get(cardScope, 'shared', 'votes', []);
  return Array.isArray(votes) ? votes.filter(isStoredVote) : [];
}

export async function setVotes(t: TrelloClient, votes: StoredVote[], cardScope = 'card'): Promise<void> {
  await t.set(cardScope, 'shared', 'votes', votes);
}

export async function getAllowedCountries(t: TrelloClient): Promise<string[]> {
  const countries = await t.get('board', 'shared', 'allowedCountries', DEFAULT_COUNTRIES);
  if (!Array.isArray(countries)) {
    return DEFAULT_COUNTRIES;
  }

  const normalized = countries
    .map((country) => String(country).trim())
    .filter(Boolean);

  return normalized.length ? normalized : DEFAULT_COUNTRIES;
}

export async function setAllowedCountries(t: TrelloClient, countries: string[]): Promise<void> {
  await t.set('board', 'shared', 'allowedCountries', countries);
}

export function upsertVote(
  votes: StoredVote[],
  memberId: string,
  memberName: string,
  country: string,
  voteType: VoteTypeCode,
  comment: string
): StoredVote[] {
  const now = new Date().toISOString();
  const trimmedComment = comment.trim().slice(0, MAX_COMMENT_LENGTH);
  const existing = votes.find((vote) => vote.m === memberId);

  if (!existing) {
    return [
      ...votes,
      {
        m: memberId,
        n: memberName,
        c: country,
        v: voteType,
        ...(trimmedComment ? { x: trimmedComment } : {}),
        ca: now,
        ua: now
      }
    ];
  }

  return votes.map((vote) =>
    vote.m === memberId
      ? {
          ...vote,
          n: memberName,
          c: country,
          v: voteType,
          x: trimmedComment || undefined,
          ua: now
        }
      : vote
  );
}

export function removeVote(votes: StoredVote[], memberId: string): StoredVote[] {
  return votes.filter((vote) => vote.m !== memberId);
}

export function toVoteView(vote: StoredVote): VoteView {
  return {
    memberId: vote.m,
    memberName: vote.n,
    country: vote.c,
    voteType: VOTE_LABELS[vote.v],
    comment: vote.x || '',
    createdAt: vote.ca,
    updatedAt: vote.ua
  };
}

export function uniqueCountries(votes: StoredVote[]): string[] {
  return Array.from(new Set(votes.map((vote) => vote.c).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function blockerCount(votes: StoredVote[]): number {
  return votes.filter((vote) => vote.v === 'b').length;
}

export function formatDate(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}

function isStoredVote(value: unknown): value is StoredVote {
  const vote = value as StoredVote;
  return Boolean(vote && vote.m && vote.c && vote.v && vote.ca && vote.ua);
}
