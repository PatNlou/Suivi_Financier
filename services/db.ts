
import { Transaction, Budget, User, Category, TransactionType } from '../types';

/**
 * ARCHITECTURE NOTE:
 * Persistence strategy: Relational (Simulated with localStorage).
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'financeplus_transactions',
  BUDGETS: 'financeplus_budgets',
  CATEGORIES: 'financeplus_categories',
  USER: 'financeplus_user'
};

const DEFAULT_CATEGORIES = [
  { name: 'Alimentation', type: TransactionType.DEPENSE },
  { name: 'Transport', type: TransactionType.DEPENSE },
  { name: 'Loisirs', type: TransactionType.DEPENSE },
  { name: 'Loyer', type: TransactionType.DEPENSE },
  { name: 'Santé', type: TransactionType.DEPENSE },
  { name: 'Éducation', type: TransactionType.DEPENSE },
  { name: 'Shopping', type: TransactionType.DEPENSE },
  { name: 'Abonnements', type: TransactionType.DEPENSE },
  { name: 'Salaire', type: TransactionType.GAIN },
  { name: 'Business', type: TransactionType.GAIN },
  { name: 'Investissement', type: TransactionType.EPARGNE },
  { name: 'Épargne de secours', type: TransactionType.EPARGNE },
  { name: 'Autres', type: TransactionType.DEPENSE }
];

const getFromStorage = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = <T,>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dbService = {
  importData: (data: any, currentUserId: string): void => {
    try {
      const rawTx = data.transactions || data.Transactions || [];
      const rawBg = data.budgets || data.Budgets || [];
      const rawCt = data.categories || data.Categories || [];

      const tx = typeof rawTx === 'string' ? JSON.parse(rawTx) : rawTx;
      const bg = typeof rawBg === 'string' ? JSON.parse(rawBg) : rawBg;
      const ct = typeof rawCt === 'string' ? JSON.parse(rawCt) : rawCt;

      if (Array.isArray(tx)) {
        const normalizedTx = tx.map(t => ({ ...t, userId: currentUserId }));
        saveToStorage(STORAGE_KEYS.TRANSACTIONS, normalizedTx);
      }
      
      if (Array.isArray(bg)) {
        const normalizedBg = bg.map(b => ({ ...b, userId: currentUserId }));
        saveToStorage(STORAGE_KEYS.BUDGETS, normalizedBg);
      }
      
      if (Array.isArray(ct)) {
        const normalizedCt = ct.map(c => ({ 
          ...c, 
          userId: c.userId === 'system' ? 'system' : currentUserId 
        }));
        saveToStorage(STORAGE_KEYS.CATEGORIES, normalizedCt);
      }
    } catch (error) {
      console.error("Erreur critique lors de l'importation:", error);
      throw new Error("Le format des données est invalide.");
    }
  },

  exportAllData: () => {
    return {
      transactions: getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS),
      budgets: getFromStorage<Budget>(STORAGE_KEYS.BUDGETS),
      categories: getFromStorage<Category>(STORAGE_KEYS.CATEGORIES),
    };
  },

  getCategories: async (userId: string): Promise<Category[]> => {
    let categories = getFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
    if (categories.length === 0) {
      categories = DEFAULT_CATEGORIES.map(cat => ({
        id: cat.name.toLowerCase().replace(/\s+/g, '-'),
        name: cat.name,
        userId: 'system',
        type: cat.type
      }));
      saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
    }
    return categories.filter(c => c.userId === userId || c.userId === 'system');
  },

  addCategory: async (category: Category): Promise<void> => {
    const categories = getFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
    if (!categories.find(c => c.name.toLowerCase() === category.name.toLowerCase())) {
      categories.push(category);
      saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
    }
  },

  updateCategory: async (categoryId: string, newName: string, newType: TransactionType, userId: string): Promise<void> => {
    const categories = getFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
    const catIndex = categories.findIndex(c => c.id === categoryId && (c.userId === userId || c.userId === 'system'));
    
    if (catIndex > -1) {
      const oldName = categories[catIndex].name;
      categories[catIndex].name = newName;
      categories[catIndex].type = newType;
      saveToStorage(STORAGE_KEYS.CATEGORIES, categories);

      const transactions = getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
      const updatedTx = transactions.map(t => {
        if (t.category === oldName && t.userId === userId) {
          return { ...t, category: newName, type: newType };
        }
        return t;
      });
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, updatedTx);

      const budgets = getFromStorage<Budget>(STORAGE_KEYS.BUDGETS);
      const updatedBg = budgets.map(b => b.category === oldName && b.userId === userId ? { ...b, category: newName } : b);
      saveToStorage(STORAGE_KEYS.BUDGETS, updatedBg);
    }
  },

  deleteCategory: async (categoryId: string, userId: string): Promise<void> => {
    const categories = getFromStorage<Category>(STORAGE_KEYS.CATEGORIES);
    const catToDelete = categories.find(c => c.id === categoryId);
    if (catToDelete && catToDelete.userId === 'system') {
      throw new Error("Impossible de supprimer une catégorie système.");
    }
    const updatedCategories = categories.filter(c => !(c.id === categoryId && c.userId === userId));
    saveToStorage(STORAGE_KEYS.CATEGORIES, updatedCategories);
  },

  getTransactions: async (userId: string): Promise<Transaction[]> => {
    return getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS).filter(t => t.userId === userId);
  },

  saveTransaction: async (transaction: Transaction): Promise<void> => {
    const transactions = getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index > -1) {
      transactions[index] = { ...transaction };
    } else {
      transactions.push({ ...transaction });
    }
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const transactions = getFromStorage<Transaction>(STORAGE_KEYS.TRANSACTIONS);
    // On force la comparaison en string pour éviter les problèmes de type
    const newTransactions = transactions.filter(t => String(t.id) !== String(id));
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, newTransactions);
  },

  getBudgets: async (userId: string, month: number, year: number): Promise<Budget[]> => {
    return getFromStorage<Budget>(STORAGE_KEYS.BUDGETS).filter(
      b => b.userId === userId && b.month === month && b.year === year
    );
  },

  saveBudget: async (budget: Budget): Promise<void> => {
    const budgets = getFromStorage<Budget>(STORAGE_KEYS.BUDGETS);
    const index = budgets.findIndex(b => b.category === budget.category && b.month === budget.month && b.year === budget.year);
    if (index > -1) {
      budgets[index] = budget;
    } else {
      budgets.push(budget);
    }
    saveToStorage(STORAGE_KEYS.BUDGETS, budgets);
  }
};
