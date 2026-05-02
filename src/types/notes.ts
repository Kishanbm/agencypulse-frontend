export interface Note {
  id: string;
  body: string;
  isPinned: boolean;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}
