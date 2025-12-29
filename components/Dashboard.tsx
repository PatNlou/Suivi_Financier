
import React from 'react';
import { Transaction, Budget, TransactionType } from '../types';
import { formatCurrency, MONTHS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ChevronRight, Calendar } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  annualTransactions: Transaction[];
  budgets: Budget[];
  onNavigate?: (tab: string) => void;
  year: number;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, annualTransactions, budgets, onNavigate, year }) => {
  // Monthly Stats
  const stats = transactions.reduce((acc, t) => {
    if (t.type === TransactionType.GAIN) acc.income += t.amount;
    if (t.type === TransactionType.DEPENSE) acc.expenses += t.amount;
    if (t.type === TransactionType.EPARGNE) acc.savings += t.amount;
    return acc;
  }, { income: 0, expenses: 0, savings: 0 });

  const balance = stats.income - stats.expenses - stats.savings;

  // Annual Stats Summary
  const annualStats = annualTransactions.reduce((acc, t) => {
    if (t.type === TransactionType.GAIN) acc.income += t.amount;
    if (t.type === TransactionType.DEPENSE) acc.expenses += t.amount;
    if (t.type === TransactionType.EPARGNE) acc.savings += t.amount;
    return acc;
  }, { income: 0, expenses: 0, savings: 0 });

  // Annual Evolution Data (by month)
  const monthlyEvolution = MONTHS.map((monthName, index) => {
    const monthTransactions = annualTransactions.filter(t => new Date(t.date).getMonth() === index);
    const mIncome = monthTransactions.filter(t => t.type === TransactionType.GAIN).reduce((sum, t) => sum + t.amount, 0);
    const mExpense = monthTransactions.filter(t => t.type === TransactionType.DEPENSE).reduce((sum, t) => sum + t.amount, 0);
    return {
      name: monthName.substring(0, 3),
      Entrées: mIncome,
      Dépenses: mExpense,
      Solde: mIncome - mExpense
    };
  });

  const barData = [
    { name: 'Entrées', value: stats.income, fill: '#10b981' },
    { name: 'Dépenses', value: stats.expenses, fill: '#f43f5e' },
    { name: 'Épargne', value: stats.savings, fill: '#6366f1' }
  ];

  const expenseCategories = transactions
    .filter(t => t.type === TransactionType.DEPENSE)
    .reduce((acc: any[], t) => {
      const existing = acc.find(a => a.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Revenu Total" 
          value={stats.income} 
          icon={<TrendingUp className="text-emerald-600" />} 
          color="emerald" 
        />
        <StatCard 
          title="Dépenses Totales" 
          value={stats.expenses} 
          icon={<TrendingDown className="text-rose-600" />} 
          color="rose" 
        />
        <StatCard 
          title="Épargne" 
          value={stats.savings} 
          icon={<PiggyBank className="text-indigo-600" />} 
          color="indigo" 
        />
        <StatCard 
          title="Solde Net" 
          value={balance} 
          icon={<Wallet className="text-slate-600" />} 
          color="slate" 
        />
      </div>

      {/* Annual Summary Row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={20} />
              Récapitulatif Annuel {year}
            </h3>
            <p className="text-slate-500 text-sm">Performance cumulée depuis janvier</p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase">Entrées {year}</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(annualStats.income)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase">Dépenses {year}</p>
              <p className="text-lg font-bold text-rose-600">{formatCurrency(annualStats.expenses)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase">Épargne {year}</p>
              <p className="text-lg font-bold text-indigo-600">{formatCurrency(annualStats.savings)}</p>
            </div>
          </div>
        </div>
        
        <div className="h-64 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyEvolution}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="Entrées" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="Dépenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Bar Chart - Monthly */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Aperçu Mensuel</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie Chart - Monthly */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Répartition Mensuelle</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Alerts Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">État du Budget Mensuel</h3>
            <button 
              onClick={() => onNavigate?.('budgets')}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1 transition-colors group"
            >
              Voir tout
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
            {budgets.length === 0 ? (
              <p className="text-slate-400 text-center py-10 md:col-span-2">Configurez votre budget dans l'onglet dédié.</p>
            ) : (
              budgets.map(b => {
                const actual = transactions
                  .filter(t => t.category === b.category && t.type === TransactionType.DEPENSE)
                  .reduce((sum, t) => sum + t.amount, 0);
                const percent = Math.min((actual / b.plannedAmount) * 100, 100);
                const isOver = actual > b.plannedAmount;

                return (
                  <div key={b.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-sm font-semibold text-slate-700">{b.category}</span>
                        {isOver && <span className="ml-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase">Dépassement</span>}
                      </div>
                      <span className="text-xs text-slate-500">{formatCurrency(actual)} / {formatCurrency(b.plannedAmount)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => {
  const isNegative = value < 0;
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <p className={`text-2xl font-bold truncate ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
