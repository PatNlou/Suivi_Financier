
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, User, PaymentMode, Category } from '../types';
import { PAYMENT_MODES, formatCurrency, TYPE_COLORS } from '../constants';
import { dbService } from '../services/db';
import { Plus, Trash2, Tag, Calendar, CreditCard, Search, X, ArrowDownRight, Edit2, PiggyBank } from 'lucide-react';

interface TransactionsViewProps {
  user: User;
  transactions: Transaction[];
  categories: Category[];
  onUpdate: () => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ user, transactions, categories, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isWithdrawal, setIsWithdrawal] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    type: TransactionType.DEPENSE,
    paymentMode: PAYMENT_MODES[0],
    date: new Date().toISOString().split('T')[0],
    linkedCategory: ''
  });

  const savingsCategories = categories.filter(c => c.type === TransactionType.EPARGNE);
  const filteredCategories = categories.filter(c => c.type === formData.type);

  useEffect(() => {
    if (!editingTransaction && !isWithdrawal && filteredCategories.length > 0) {
      setFormData(prev => ({ ...prev, category: filteredCategories[0].name }));
    }
  }, [formData.type, categories, editingTransaction, isWithdrawal]);

  const filteredTransactionsList = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingTransaction(null);
    setIsWithdrawal(false);
    setFormData({
      description: '',
      amount: '',
      category: categories.find(c => c.type === TransactionType.DEPENSE)?.name || 'Autres',
      type: TransactionType.DEPENSE,
      paymentMode: PAYMENT_MODES[0],
      date: new Date().toISOString().split('T')[0],
      linkedCategory: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    const isW = t.category === 'Retrait Épargne';
    setIsWithdrawal(isW);
    setFormData({
      description: t.description,
      amount: t.amount.toString(),
      category: t.category,
      type: t.type,
      paymentMode: t.paymentMode,
      date: t.date,
      linkedCategory: t.linkedCategory || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const transactionData: Transaction = {
      id: editingTransaction ? editingTransaction.id : Math.random().toString(36).substr(2, 9),
      userId: user.id,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: isWithdrawal ? 'Retrait Épargne' : formData.category,
      type: isWithdrawal ? TransactionType.GAIN : formData.type,
      paymentMode: formData.paymentMode as PaymentMode,
      date: formData.date,
      linkedCategory: isWithdrawal ? formData.linkedCategory : undefined
    };

    await dbService.saveTransaction(transactionData);
    setIsModalOpen(false);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette transaction ?')) {
      try {
        await dbService.deleteTransaction(id);
        onUpdate();
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une opération..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>
        <button 
          onClick={openAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg font-bold"
        >
          <Plus size={20} />
          Ajouter une transaction
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Montant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactionsList.length > 0 ? (
                filteredTransactionsList.sort((a,b) => b.date.localeCompare(a.date)).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(t.date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{t.description}</span>
                        {t.linkedCategory && (
                          <span className="text-[10px] text-indigo-500 flex items-center gap-1 mt-0.5 font-bold uppercase">
                            <ArrowDownRight size={10} /> Source: {t.linkedCategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {t.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {t.paymentMode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${TYPE_COLORS[t.type]} ${t.category === 'Retrait Épargne' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}`}>
                        {t.category === 'Retrait Épargne' ? 'RETRAIT' : t.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${
                      t.type === 'GAIN' ? 'text-emerald-600' : t.type === 'EPARGNE' ? 'text-indigo-600' : 'text-rose-600'
                    }`}>
                      {t.type === 'DEPENSE' && '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Modifier">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic">Aucune transaction trouvée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {editingTransaction ? <Edit2 className="text-indigo-500" /> : <Plus className="text-indigo-500" />}
                {editingTransaction ? 'Modifier l\'opération' : 'Nouvelle opération'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => {
                      const val = e.target.value as TransactionType;
                      setFormData({...formData, type: val});
                      if (val !== TransactionType.GAIN) setIsWithdrawal(false);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value={TransactionType.DEPENSE}>Dépense</option>
                    <option value={TransactionType.GAIN}>Gain / Entrée</option>
                    <option value={TransactionType.EPARGNE}>Épargne</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Montant (XOF)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {formData.type === TransactionType.GAIN && (
                <label className="flex items-center gap-3 p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl cursor-pointer hover:bg-indigo-900/40 transition-all group">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${isWithdrawal ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}>
                    {isWithdrawal && <PiggyBank size={14} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={isWithdrawal} 
                    onChange={(e) => setIsWithdrawal(e.target.checked)} 
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">Retrait de votre Épargne ?</span>
                    <span className="text-[10px] text-indigo-400 uppercase font-medium">L'argent ira dans votre solde</span>
                  </div>
                </label>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Désignation</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    {isWithdrawal ? "Source d'épargne" : "Catégorie"}
                  </label>
                  {isWithdrawal ? (
                    <select 
                      required
                      value={formData.linkedCategory}
                      onChange={(e) => setFormData({...formData, linkedCategory: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-indigo-500/50 text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Sélectionner --</option>
                      {savingsCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  ) : (
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {filteredCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      <option value="Autres">Autres</option>
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Mode</label>
                  <select 
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {PAYMENT_MODES.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                />
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-700 text-slate-300 font-bold rounded-2xl">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsView;
