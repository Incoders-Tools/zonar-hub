export type SportIconSource = 'unicode' | 'svg';

export interface Sport {
  id: string;
  name: string;
  key: string;
  icon: string;
  iconSource: SportIconSource;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
