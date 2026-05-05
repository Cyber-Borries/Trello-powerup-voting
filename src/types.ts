export type VoteTypeCode = 's' | 'b' | 'n';

export type VoteTypeLabel = 'Support' | 'Blocker' | 'Nice to have';

export interface StoredVote {
  m: string;
  n: string;
  c: string;
  v: VoteTypeCode;
  x?: string;
  ca: string;
  ua: string;
}

export interface VoteView {
  memberId: string;
  memberName: string;
  country: string;
  voteType: VoteTypeLabel;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  url?: string;
  idList?: string;
}

export interface TrelloList {
  id: string;
  name: string;
}

export interface ReportCard {
  card: TrelloCard;
  listName: string;
  votes: StoredVote[];
}

export interface TrelloPowerUpGlobal {
  initialize(capabilities: Record<string, unknown>, options?: Record<string, unknown>): void;
  iframe(): TrelloClient;
}

export interface TrelloClient {
  arg<T = unknown>(key: string): T | undefined;
  board(...fields: string[]): Promise<Record<string, unknown>>;
  card(...fields: string[]): Promise<Record<string, unknown>>;
  cards(...fields: string[]): Promise<TrelloCard[]>;
  lists(...fields: string[]): Promise<TrelloList[]>;
  member(...fields: string[]): Promise<Record<string, unknown>>;
  get(scope: string, visibility: 'shared' | 'private', key: string, fallback?: unknown): Promise<unknown>;
  set(scope: string, visibility: 'shared' | 'private', key: string, value: unknown): Promise<void>;
  getContext(): {
    board?: string;
    card?: string;
    member?: string;
    permissions?: {
      board?: 'read' | 'write';
      card?: 'read' | 'write';
    };
  };
  memberCanWriteToModel(model: 'board' | 'card' | 'organization'): boolean;
  modal(options: {
    url: string;
    title: string;
    height?: number;
    fullscreen?: boolean;
    args?: Record<string, unknown>;
  }): Promise<void>;
  popup(options: {
    title: string;
    url: string;
    height?: number;
    args?: Record<string, unknown>;
  }): Promise<void>;
  closePopup(): Promise<void>;
  closeModal(): Promise<void>;
  render(callback: () => void | Promise<void>): void;
  sizeTo(selector: string): Promise<void>;
  signUrl(url: string, args?: Record<string, unknown>): string;
}

declare global {
  interface Window {
    TrelloPowerUp: TrelloPowerUpGlobal;
  }
}
