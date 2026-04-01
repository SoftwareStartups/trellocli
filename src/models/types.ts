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
