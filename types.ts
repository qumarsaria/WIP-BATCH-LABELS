export interface BatchRecord {
  id: string;
  wipCode: string;
  mixName: string;
  prepDate: string; // ISO Date string
  useByDate: string; // ISO Date string
  supervisor: string;
  qaQuantity: number;
  labelCount: number;
  createdAt: number;
}

export interface WipLookupItem {
  code: string;
  name: string;
}

export enum Supervisor {
  JOHN_DOE = 'John Doe',
  JANE_SMITH = 'Jane Smith',
  MIKE_JOHNSON = 'Mike Johnson',
  SARAH_CONNOR = 'Sarah Connor',
  QUMARS = 'Qumars',
  VIMAL = 'Vimal',
  RAMZAN = 'Ramzan',
  NEERAJ = 'Neeraj',
}

export interface LabelConfig {
  wipCode: string;
  mixName: string;
  useByDate: string;
  prepDate: string;
  supervisor: string;
  copyNumber: number;
  totalCopies: number;
}