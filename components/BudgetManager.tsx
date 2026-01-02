
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    if (editingCategory) {
      await dbService.updateCategory(editingCategory.id, catName, catType, user.id);
      // On sauvegarde le budget même pour les gains
      await dbService.saveBudget({
        id: budgets.find(b => b.category === catName)?.id || Math.random().toString(36).substr(2, 9),
        userId: user.id,
        category: catName,
        month: viewDate.month,
        year: viewDate.year,
        plannedAmount: parseFloat(catPlanned) || 0
      });
    } else {
      const catId = catName.toLowerCase().replace(/\s+/g, '-');
      await dbService.addCategory({ id: catId, name: catName, userId: user.id, type: catType });
      if (catPlanned) {
        await dbService.saveBudget({
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          category: catName,
          month: viewDate.month,
          year: viewDate.year,
          plannedAmount: parseFloat(catPlanned) || 0
        });
      }
    }
    onUpdate();
    setIsModalOpen(false);
  };

  const getActual = (categoryName: string, type: TransactionType) => {
    const positiveFlow = transactions
      .filter(t => t.category === categoryName && t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);

    if (type === TransactionType.EPARGNE) {
      const negativeFlow = transactions
        .filter(t => t.linkedCategory === categoryName && t.category === 'Retrait Épargne')
        .reduce((sum, t) => sum + t.amount, 0);
      return positiveFlow - negativeFlow;
    }
    return positiveFlow;
  };

  const renderBudgetCard = (categoryObj: Category) => {
    const categoryName = categoryObj.name;
    const budget = budgets.find(b => b.category === categoryName);
    const actual = getActual(categoryName, categoryObj.type);
    const planned = budget?.plannedAmount || 0;
    
    // Pour les revenus, l'écart positif est une bonne chose (Revenu > Objectif)
    // Pour les dépenses, l'écart positif est une bonne chose (Budget > Dépense)
    const diff = categoryObj.type === TransactionType.GAIN ? actual - planned : planned - actual;
    
    const isOver = categoryObj.type === TransactionType.DEPENSE && actual > planned && planned > 0;
    const isSuccess = (categoryObj.type === TransactionType.EPARGNE || categoryObj.type === TransactionType.GAIN) && actual >= planned && planned > 0;
    const isSystem = categoryObj.userId === 'system';

    let typeLabel = "Budget";
    let colorClass = "text-emerald-500 bg-emerald-50";
    let progressColor = "bg-emerald-500";

    if (categoryObj.type === TransactionType.DEPENSE) {
      typeLabel = "Budget Dépense";
      colorClass = "text-rose-500 bg-rose-50";
      progressColor = isOver ? "bg-rose-500" : "bg-emerald-500";
    } else if (categoryObj.type === TransactionType.EPARGNE) {
      typeLabel = "Objectif Épargne";
      colorClass = "text-indigo-500 bg-indigo-50";
      progressColor = "bg-indigo-500";
    } else if (categoryObj.type === TransactionType.GAIN) {
      typeLabel = "Objectif Revenu";
      colorClass = "text-emerald-600 bg-emerald-50";
      progressColor = "bg-emerald-500";
    }

    return (
      <div key={categoryObj.id} className={`bg-white rounded-2xl p-6 border transition-all duration-300 ${isOver ? 'border-rose-200 shadow-md' : isSuccess ? 'border-emerald-200 shadow-md' : 'border-slate-200'}`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-lg mb-1">{categoryName}</h4>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${colorClass}`}>
              {typeLabel}
            </span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => openEditModal(categoryObj)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Settings2 size={16} /></button>
            {!isSystem && <button onClick={() => { if(confirm('Supprimer ?')) dbService.deleteCategory(categoryObj.id, user.id).then(onUpdate); }} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg"><Trash2 size={16} /></button>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div><p className="text-xs text-slate-400 uppercase font-medium">Objectif</p><p className="text-xl font-bold">{formatCurrency(planned)}</p></div>
            <div className="text-right"><p className="text-xs text-slate-400 uppercase font-medium">Actuel</p><p className={`text-xl font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>{formatCurrency(actual)}</p></div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(100, Math.max(0, (actual / (planned || 1)) * 100))}%` }} />
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-medium">
            <span className="text-slate-500">
              {categoryObj.type === TransactionType.DEPENSE ? 'Reste' : categoryObj.type === TransactionType.GAIN ? 'Excédent' : 'Écart'}
            </span>
            <span className={diff < 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {diff > 0 ? '+' : ''}{formatCurrency(diff)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="bg-indigo-900 rounded-2xl p-8 text-white flex justify-between items-center shadow-xl">
        <div>
          <h3 className="text-2xl font-bold mb-2">Planification Financière</h3>
          <p className="text-indigo-100 text-sm opacity-90">Définissez vos objectifs de gains, de dépenses et d'épargne pour un meilleur suivi.</p>
          <button onClick={openAddModal} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold shadow-lg"><PlusCircle size={18} /> Nouvelle catégorie</button>
        </div>
        <ShieldCheck className="text-indigo-400 opacity-20" size={80} />
      </div>

      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp className="text-emerald-500" /> Objectifs de Revenus</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.filter(c => c.type === TransactionType.GAIN).map(renderBudgetCard)}
          {categories.filter(c => c.type === TransactionType.GAIN).length === 0 && (
            <p className="text-slate-400 italic text-sm col-span-full">Aucun objectif de revenu défini.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingDown className="text-rose-500" /> Budgets de Dépenses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.filter(c => c.type === TransactionType.DEPENSE).map(renderBudgetCard)}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><PiggyBank className="text-indigo-500" /> Objectifs d'Épargne</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.filter(c => c.type === TransactionType.EPARGNE).map(renderBudgetCard)}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-md rounded-3xl shadow-2xl border border-slate-800 p-8 space-y-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-white">{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: TransactionType.DEPENSE, label: 'Dépense', color: 'rose' },
                  { type: TransactionType.GAIN, label: 'Gain', color: 'emerald' },
                  { type: TransactionType.EPARGNE, label: 'Épargne', color: 'indigo' }
                ].map(btn => (
                  <button key={btn.type} type="button" onClick={() => setCatType(btn.type)} className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${catType === btn.type ? `bg-${btn.color}-600 border-${btn.color}-400 text-white` : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{btn.label}</button>
                ))}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nom</label>
                  <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="ex: Freelance, Bonus..." className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Objectif Mensuel (XOF)</label>
                  <input type="number" placeholder="Montant planifié" value={catPlanned} onChange={(e) => setCatPlanned(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-700 text-slate-300 font-bold rounded-2xl">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
