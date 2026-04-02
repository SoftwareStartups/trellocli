// Runtime field lists — single source of truth for API field filtering
export const BOARD_FIELDS = ['id', 'name', 'desc', 'url', 'closed'] as const;
export const LIST_FIELDS = ['id', 'name', 'idBoard', 'closed', 'pos'] as const;
export const CARD_FIELDS = [
  'id',
  'name',
  'desc',
  'idList',
  'idBoard',
  'due',
  'dueComplete',
  'start',
  'url',
  'labels',
  'idMembers',
] as const;
export const LABEL_FIELDS = ['id', 'name', 'color', 'idBoard'] as const;
export const COMMENT_FIELDS = ['id', 'date', 'data', 'memberCreator'] as const;
export const ACTION_FIELDS = [
  'id',
  'type',
  'date',
  'data',
  'memberCreator',
] as const;
export const ATTACHMENT_FIELDS = [
  'id',
  'name',
  'url',
  'bytes',
  'date',
  'mimeType',
  'isUpload',
] as const;
export const MEMBER_FIELDS = ['id', 'fullName', 'username'] as const;
export const WORKSPACE_FIELDS = [
  'id',
  'name',
  'displayName',
  'desc',
  'url',
] as const;
export const CHECKLIST_FIELDS = [
  'id',
  'name',
  'idBoard',
  'idCard',
  'checkItems',
] as const;
export const CHECKITEM_FIELDS = [
  'id',
  'name',
  'state',
  'idChecklist',
  'pos',
] as const;

export interface Board {
  id: string;
  name: string;
  desc?: string;
  url: string;
  closed?: boolean;
}

export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  closed?: boolean;
  pos?: number;
}

export interface Card {
  id: string;
  name: string;
  desc?: string;
  idList: string;
  idBoard: string;
  due?: string | null;
  dueComplete?: boolean;
  start?: string | null;
  url?: string;
  labels?: Label[];
  idMembers?: string[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
  idBoard?: string;
}

export interface Comment {
  id: string;
  date: string;
  data: {
    text: string;
  };
  memberCreator: {
    id: string;
    fullName: string;
    username: string;
  };
}

export interface CardAction {
  id: string;
  type: string;
  date: string;
  data: Record<string, unknown>;
  memberCreator: {
    id: string;
    fullName: string;
    username: string;
  };
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  bytes?: number;
  date: string;
  mimeType?: string;
  isUpload: boolean;
}

export interface Member {
  id: string;
  fullName: string;
  username: string;
}

export interface Workspace {
  id: string;
  name: string;
  displayName: string;
  desc?: string;
  url?: string;
}

export interface Checklist {
  id: string;
  name: string;
  idBoard: string;
  idCard: string;
  checkItems: CheckItem[];
}

export interface CheckItem {
  id: string;
  name: string;
  state: 'complete' | 'incomplete';
  idChecklist: string;
  pos: number;
}
