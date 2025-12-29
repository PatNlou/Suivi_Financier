
import React, { useState } from 'react';
import { Budget, Transaction, TransactionType, User, Category } from '../types';
import { formatCurrency } from '../constants';
import { dbService } from '../services/db';
import { 
  Save, 
  Edit2, 
  ShieldCheck, 
  AlertTriangle, 
  PlusCircle, 
  X, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Trash2, 
  Settings2,
  Calendar
} from 'lucide-react';

interface BudgetManagerProps {
  user: User;
  viewDate: { month: number; year: number };
  budgets: Budget[];
  transactions: Transaction[];
  categories: Category[];
  onUpdate: () => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ user, viewDate, budgets, transactions, categories, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form states
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<TransactionType>(TransactionType.DEPENSE);
  const [catPlanned, setCatPlanned] = useState('');

  const openAddModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatType(TransactionType.DEPENSE);
    setCatPlanned('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    const budget = budgets.find(b => b.category === category.name);
    setEditingCategory(category);
    setCatName(category.name);
    setCatType(category.type);
    setCatPlanned(budget ? budget.plannedAmount.toString() : '');
    setIsModalOpen(true);
  };

  const handleSaveBudgetForCategory = async (categoryName: string, amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;

    const existingBudget = budgets.find(b => b.category === categoryName);
    const newBudget: Budget = {
      id: existingBudget?.id || Math.random().toString(36).substr(2, 9),
      userId: user.id,
      category: categoryName,
      month: viewDate.month,
      year: viewDate.year,
      plannedAmount: amount
    };

    await dbService.saveBudget(newBudget);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    if (editingCategory) {
      // Update existing
      await dbService.updateCategory(editingCategory.id, catName, catType, user.id);
      if (catType !== TransactionType.GAIN) {
        await handleSaveBudgetForCategory(catName, catPlanned || '0');
      }
    } else {
      // Create new
      const catId = catName.toLowerCase().replace(/\s+/g, '-');
      const newCat: Category = {
        id: catId,
        name: catName,
        userId: user.id,
        type: catType
      };
      await dbService.addCategory(newCat);
      if (catType !== TransactionType.GAIN && catPlanned) {
        await handleSaveBudgetForCategory(catName, catPlanned);
      }
    }

    onUpdate();
    setIsModalOpen(false);
  };

  const handleDeleteCategory = async (categoryId: string, name: string) => {
    const hasTransactions = transactions.some(t => t.category === name);
    const message = hasTransactions 
      ? `Attention : La catégorie "${name}" est utilisée dans vos transactions. Sa suppression ne supprimera pas les transactions mais elles n'auront plus de catégorie rattachée. Continuer ?`
      : `Voulez-vous supprimer la catégorie "${name}" ?`;

    if (confirm(message)) {
      try {
        await dbService.deleteCategory(categoryId, user.id);
        onUpdate();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const getActualExpense = (category: string, type: TransactionType) => {
    return transactions
      .filter(t => t.category === category && t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const renderBudgetCard = (categoryObj: Category) => {
    const categoryName = categoryObj.name;
    const budget = budgets.find(b => b.category === categoryName);
    const actual = getActualExpense(categoryName, categoryObj.type);
    const planned = budget?.plannedAmount || 0;
    const diff = planned - actual;
    const isOver = categoryObj.type === TransactionType.DEPENSE && actual > planned && planned > 0;
    const isSavingsGoalMet = categoryObj.type === TransactionType.EPARGNE && actual >= planned && planned > 0;
    const isSystem = categoryObj.userId === 'system';

    return (
      <div key={categoryObj.id} className={`bg-white rounded-2xl p-6 border transition-all duration-300 group ${
        isOver ? 'border-rose-200 shadow-md shadow-rose-50' : 
        isSavingsGoalMet ? 'border-emerald-200 shadow-md shadow-emerald-50' :
        'border-slate-200 hover:shadow-md'
      }`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
              {categoryName}
            </h4>
            <div className="flex items-center gap-2">
              {categoryObj.type === TransactionType.DEPENSE ? (
                isOver ? (
                  <span className="flex items-center gap-1 text-rose-500 text-[10px] font-bold uppercase tracking-tight bg-rose-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={10} /> Dépassement
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">Budget Dépense</span>
                )
              ) : (
                <span className="text-indigo-500 text-[10px] font-bold uppercase tracking-tight bg-indigo-50 px-2 py-0.5 rounded-full">Objectif Épargne</span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => openEditModal(categoryObj)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Configurer la catégorie"
            >
              <Settings2 size={16} />
            </button>
            {!isSystem && (
              <button 
                onClick={() => handleDeleteCategory(categoryObj.id, categoryName)}
                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title="Supprimer la catégorie"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Objectif</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(planned)}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Actuel</p>
              <p className={`text-xl font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>{formatCurrency(actual)}</p>
            </div>
          </div>
          
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isOver ? 'bg-rose-500' : categoryObj.type === TransactionType.EPARGNE ? 'bg-indigo-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min((actual / (planned || 1)) * 100, 100)}%` }}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-500">
              {categoryObj.type === TransactionType.DEPENSE ? 'Reste' : 'Écart'}
            </span>
            <span className={`text-sm font-bold ${diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {diff > 0 ? '+' : ''} {formatCurrency(diff)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const expenseCategories = categories.filter(c => c.type === TransactionType.DEPENSE);
  const savingsCategories = categories.filter(c => c.type === TransactionType.EPARGNE);
  const gainCategories = categories.filter(c => c.type === TransactionType.GAIN);

  return (
    <div className="space-y-10">
      <div className="bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold mb-2">Planification Financière</h3>
            <p className="text-indigo-100 text-sm leading-relaxed opacity-90">
              Gérez vos catégories, vos limites de dépenses et vos objectifs d'épargne. Modifiez le nom, le type ou l'objectif à tout moment.
            </p>
            <button 
              onClick={openAddModal}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl transition-all font-bold shadow-lg"
            >
              <PlusCircle size={18} />
              Nouvelle catégorie
            </button>
          </div>
          <div className="bg-indigo-800/60 backdrop-blur-md p-6 rounded-xl border border-indigo-700/50 flex items-center gap-4">
            <div className="p-3 bg-indigo-400/30 rounded-lg">
              <ShieldCheck className="text-white" />
            </div>
            <div>
              <p className="text-xs text-indigo-100 font-bold uppercase tracking-wider">Statut</p>
              <p className="font-bold text-white">Budget Actif</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </div>

      {/* Section Dépenses */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <TrendingDown className="text-rose-500" size={20} />
          <h3 className="text-xl font-bold text-slate-800">Budgets de Dépenses</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenseCategories.map(renderBudgetCard)}
        </div>
      </section>

      {/* Section Épargne */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <PiggyBank className="text-indigo-500" size={20} />
          <h3 className="text-xl font-bold text-slate-800">Objectifs d'Épargne</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savingsCategories.map(renderBudgetCard)}
          {savingsCategories.length === 0 && (
            <div className="lg:col-span-3 p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
              Aucun objectif d'épargne.
            </div>
          )}
        </div>
      </section>

      {/* Section Gains */}
      <section className="pb-10">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-emerald-500" size={20} />
          <h3 className="text-xl font-bold text-slate-800">Sources de Revenus</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {gainCategories.map(c => (
            <div key={c.id} className="group px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-medium flex items-center gap-3 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{c.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => openEditModal(c)} 
                  className="p-1 hover:bg-emerald-100 rounded transition-colors text-emerald-500"
                  title="Modifier la source"
                >
                  <Edit2 size={12} />
                </button>
                {c.userId !== 'system' && (
                  <button 
                    onClick={() => handleDeleteCategory(c.id, c.name)} 
                    className="p-1 hover:bg-rose-100 rounded transition-colors text-rose-400"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Unified Category Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-md rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings2 className="text-indigo-500" />
                {editingCategory ? 'Configurer la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Type de catégorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: TransactionType.DEPENSE, label: 'Dépense', color: 'rose' },
                    { type: TransactionType.GAIN, label: 'Gain', color: 'emerald' },
                    { type: TransactionType.EPARGNE, label: 'Épargne', color: 'indigo' }
                  ].map(btn => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setCatType(btn.type)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                        catType === btn.type 
                          ? `bg-${btn.color}-600 border-${btn.color}-400 text-white shadow-lg` 
                          : `bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600`
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Nom de la catégorie</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Freelance, Santé, Voyages..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none hover:bg-slate-700 transition-colors"
                />
              </div>

              {catType !== TransactionType.GAIN && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Objectif mensuel (XOF)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={catPlanned}
                    onChange={(e) => setCatPlanned(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none hover:bg-slate-700 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest pt-1 flex items-center gap-1">
                    <Calendar size={10}/> Défini pour {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(viewDate.year, viewDate.month))}
                  </p>
                </div>
              )}

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-4 px-4 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 py-4 px-4 rounded-2xl text-white font-bold transition-all shadow-xl ${
                    catType === TransactionType.GAIN ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/40' :
                    catType === TransactionType.EPARGNE ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/40' :
                    'bg-rose-600 hover:bg-rose-700 shadow-rose-900/40'
                  }`}
                >
                  {editingCategory ? 'Sauvegarder' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
