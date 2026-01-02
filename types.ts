
export enum TransactionType {
  GAIN = 'GAIN',
  DEPENSE = 'DEPENSE',
  EPARGNE = 'EPARGNE'
}

export type PaymentMode = 'Espèces' | 'Carte' | 'Mobile Money' | 'Virement';

export interface Category {
  id: string;
  name: string;
  userId: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  date: string; // ISO format
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  paymentMode: PaymentMode;
  userId: string;
  linkedCategory?: string; // Utilisé pour le retrait d'épargne (source)
}

export interface Budget {
  id: string;
  category: string;
  month: number; // 0-11
  year: number;
  plannedAmount: number;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netBalance: number;
}
