
import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  Settings, 
  LogOut, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  Wallet
} from 'lucide-react';

export const CATEGORIES = [
  'Alimentation',
  'Transport',
  'Loisirs',
  'Loyer',
  'Santé',
  'Éducation',
  'Shopping',
  'Abonnements',
  'Salaire',
  'Business',
  'Investissement',
  'Autres'
];

export const PAYMENT_MODES = [
  'Espèces',
  'Carte',
  'Mobile Money',
  'Virement'
];

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={20} /> },
  { id: 'transactions', label: 'Transactions', icon: <Receipt size={20} /> },
  { id: 'budgets', label: 'Budgets', icon: <Target size={20} /> },
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(value);
};

export const TYPE_COLORS = {
  GAIN: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  DEPENSE: 'text-rose-600 bg-rose-50 border-rose-100',
  EPARGNE: 'text-indigo-600 bg-indigo-50 border-indigo-100'
};
