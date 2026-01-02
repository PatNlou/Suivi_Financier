
import React, { useMemo } from 'react';
import { Transaction, Budget, TransactionType, Category } from '../types';
import { formatCurrency, MONTHS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ChevronRight, Calendar, ArrowRightCircle } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  annualTransactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  onNavigate?: (tab: string) => void;
  viewDate: { month: number; year: number };
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, annualTransactions, budgets, categories, onNavigate, viewDate }) => {
  // Calcul du report de solde : Uniquement si le solde cumulé mois après mois reste positif
  const rolloverBalance = useMemo(() => {
    let balance = 0;
    for (let m = 0; m < viewDate.month; m++) {
      const monthTx = annualTransactions.filter(t => new Date(t.date).getMonth() === m);
      const mIncome = monthTx.filter(t => t.type === TransactionType.GAIN).reduce((sum, t) => sum + t.amount, 0);
      const mExpense = monthTx.filter(t => t.type === TransactionType.DEPENSE).reduce((sum, t) => sum + t.amount, 0);
      const mSavings = monthTx.filter(t => t.type === TransactionType.EPARGNE).reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyNet = mIncome - mExpense - mSavings;
      balance += monthlyNet;
      
      if (balance < 0) balance = 0;
    }
    return balance;
  }, [annualTransactions, viewDate]);

  // Monthly Stats
  const stats = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === TransactionType.GAIN) acc.income += t.amount;
      if (t.type === TransactionType.DEPENSE) acc.expenses += t.amount;
      if (t.type === TransactionType.EPARGNE) acc.savings += t.amount;
      return acc;
    }, { income: 0, expenses: 0, savings: 0 });
  }, [transactions]);

  const netBalance = rolloverBalance + stats.income - stats.expenses - stats.savings;

  // Évolution Annuelle
  const monthlyEvolution = useMemo(() => {
    return MONTHS.map((monthName, index) => {
      const monthTx = annualTransactions.filter(t => new Date(t.date).getMonth() === index);
      const mIncome = monthTx.filter(t => t.type === TransactionType.GAIN).reduce((sum, t) => sum + t.amount, 0);
      const mExpense = monthTx.filter(t => t.type === TransactionType.DEPENSE).reduce((sum, t) => sum + t.amount, 0);
      const mSavings = monthTx.filter(t => t.type === TransactionType.EPARGNE).reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: monthName.substring(0, 3),
        Revenus: mIncome,
        Dépenses: mExpense + mSavings,
      };
    });
  }, [annualTransactions]);

  const barData = [
    { name: 'Entrées', value: stats.income, fill: '#10b981' },
    { name: 'Dépenses', value: stats.expenses, fill: '#f43f5e' },
    { name: 'Épargne', value: stats.savings, fill: '#6366f1' }
  ];

  const expenseCategories = transactions
    .filter(t => t.type === TransactionType.DEPENSE)
    .reduce((acc: any[], t) => {
      const existing = acc.find(a => a.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Report Solde" value={rolloverBalance} icon={<ArrowRightCircle className="text-amber-600" size={20} />} color="amber" subtitle="Exédent précédent" />
        <StatCard title="Revenu" value={stats.income} icon={<TrendingUp className="text-emerald-600" size={20} />} color="emerald" />
        <StatCard title="Dépenses" value={stats.expenses} icon={<TrendingDown className="text-rose-600" size={20} />} color="rose" />
        <StatCard title="Épargne" value={stats.savings} icon={<PiggyBank className="text-indigo-600" size={20} />} color="indigo" />
        <StatCard title="Liquidité" value={netBalance} icon={<Wallet className="text-slate-600" size={20} />} color="slate" subtitle="Solde disponible" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={20} /> Évolution Annuelle {viewDate.year}
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyEvolution}>
              <defs>
                <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDépenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="Revenus" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenus)" strokeWidth={2} />
              <Area type="monotone" dataKey="Dépenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDépenses)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6">Aperçu du mois</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">État des Objectifs & Budgets</h3>
            <button onClick={() => onNavigate?.('budgets')} className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1">
              Gérer <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
            {budgets.length === 0 ? (
              <p className="text-slate-400 text-center py-10">Aucun objectif configuré.</p>
            ) : budgets.map(b => {
              const cat = categories.find(c => c.name === b.category);
              const catType = cat?.type || TransactionType.DEPENSE;
              
              const deposits = transactions
                .filter(t => t.category === b.category && t.type === catType)
                .reduce((sum, t) => sum + t.amount, 0);
                
              const withdrawals = transactions
                .filter(t => t.linkedCategory === b.category && t.category === 'Retrait Épargne')
                .reduce((sum, t) => sum + t.amount, 0);

              const actual = deposits - withdrawals;
              const percent = Math.min((actual / (b.plannedAmount || 1)) * 100, 100);

              let barColor = 'bg-emerald-500';
              if (catType === TransactionType.DEPENSE) {
                barColor = actual > b.plannedAmount ? 'bg-rose-500' : 'bg-emerald-500';
              } else if (catType === TransactionType.EPARGNE) {
                barColor = 'bg-indigo-500';
              }

              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <div className="flex items-center gap-1">
                      {catType === TransactionType.GAIN && <TrendingUp size={10} className="text-emerald-500" />}
                      {catType === TransactionType.DEPENSE && <TrendingDown size={10} className="text-rose-500" />}
                      {catType === TransactionType.EPARGNE && <PiggyBank size={10} className="text-indigo-500" />}
                      <span>{b.category}</span>
                    </div>
                    <span>{formatCurrency(actual)} / {formatCurrency(b.plannedAmount)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.max(0, percent)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; subtitle?: string }> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
    <div className={`p-2 w-fit rounded-lg bg-${color}-50 mb-4`}>{icon}</div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className={`text-lg font-bold truncate ${value < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatCurrency(value)}</p>
    {subtitle && <p className="text-[10px] text-slate-400 font-medium mt-1">{subtitle}</p>}
  </div>
);

export default Dashboard;
