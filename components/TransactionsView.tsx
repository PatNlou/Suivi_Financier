
import React, { useState } from 'react';
import { Transaction, TransactionType, User, PaymentMode, Category } from '../types';
import { PAYMENT_MODES, formatCurrency, TYPE_COLORS } from '../constants';
import { dbService } from '../services/db';
import { Plus, Trash2, Tag, Calendar, CreditCard, Search, X } from 'lucide-react';

interface TransactionsViewProps {
  user: User;
  transactions: Transaction[];
  categories: Category[];
  onUpdate: () => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ user, transactions, categories, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: categories[0]?.name || 'Autres',
    type: TransactionType.DEPENSE,
    paymentMode: PAYMENT_MODES[0],
    date: new Date().toISOString().split('T')[0]
  });

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: formData.type,
      paymentMode: formData.paymentMode as PaymentMode,
      date: formData.date
    };

    await dbService.saveTransaction(newTransaction);
    onUpdate();
    setIsAdding(false);
    setFormData({
      description: '',
      amount: '',
      category: categories[0]?.name || 'Autres',
      type: TransactionType.DEPENSE,
      paymentMode: PAYMENT_MODES[0],
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette transaction ?')) {
      await dbService.deleteTransaction(id);
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Nouvelle Transaction
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.sort((a,b) => b.date.localeCompare(a.date)).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(t.date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">{t.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Tag size={14} className="text-slate-400" />
                        {t.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <CreditCard size={14} className="text-slate-400" />
                        {t.paymentMode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${TYPE_COLORS[t.type]}`}>
                        {t.type === 'GAIN' ? 'Entrée' : t.type === 'EPARGNE' ? 'Épargne' : 'Dépense'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${
                      t.type === 'GAIN' ? 'text-emerald-600' : t.type === 'EPARGNE' ? 'text-indigo-600' : 'text-rose-600'
                    }`}>
                      {t.type === 'DEPENSE' && '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic">
                    Aucune transaction trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-indigo-500" />
                Nouvelle opération
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Type d'opération</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <option value={TransactionType.DEPENSE} className="bg-slate-800 text-white">Dépense</option>
                    <option value={TransactionType.GAIN} className="bg-slate-800 text-white">Gain / Entrée</option>
                    <option value={TransactionType.EPARGNE} className="bg-slate-800 text-white">Épargne</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Montant (XOF)</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none hover:bg-slate-700 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Courses mensuelles"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none hover:bg-slate-700 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Catégorie</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    {categories.filter(c => 
                      formData.type === TransactionType.GAIN ? c.type === TransactionType.GAIN : c.type === TransactionType.DEPENSE || c.type === TransactionType.EPARGNE
                    ).map(c => <option key={c.id} value={c.name} className="bg-slate-800 text-white">{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Mode de paiement</label>
                  <select 
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    {PAYMENT_MODES.map(pm => <option key={pm} value={pm} className="bg-slate-800 text-white">{pm}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Date de l'opération</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none hover:bg-slate-700 transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)} 
                  className="flex-1 py-4 px-4 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 hover:text-white transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 px-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsView;
