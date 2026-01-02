
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { dbService } from './services/db';
import { Transaction, Budget, User, TransactionType, Category } from './types';
import { NAV_ITEMS, formatCurrency } from './constants';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import BudgetManager from './components/BudgetManager';
import Auth from './components/Auth';
import { LogOut, ChevronLeft, ChevronRight, Calendar, Download, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const now = new Date();
  const [viewDate, setViewDate] = useState({ month: now.getMonth(), year: now.getFullYear() });

  useEffect(() => {
    const storedUser = localStorage.getItem('financeplus_auth');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [t, b, c] = await Promise.all([
        dbService.getTransactions(user.id),
        dbService.getBudgets(user.id, viewDate.month, viewDate.year),
        dbService.getCategories(user.id)
      ]);
      setTransactions([...t]);
      setBudgets([...b]);
      setCategories([...c]);
    } catch (err) {
      console.error("Erreur de récupération des données:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, viewDate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === viewDate.month && d.getFullYear() === viewDate.year;
    });
  }, [transactions, viewDate]);

  const annualTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === viewDate.year;
    });
  }, [transactions, viewDate.year]);

  const changeMonth = (delta: number) => {
    let nextMonth = viewDate.month + delta;
    let nextYear = viewDate.year;
    if (nextMonth < 0) { nextMonth = 11; nextYear -= 1; }
    else if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
    setViewDate({ month: nextMonth, year: nextYear });
  };

  const handleLogout = () => {
    localStorage.removeItem('financeplus_auth');
    setUser(null);
  };

  const handleExportData = () => {
    const data = dbService.exportAllData();
    const backupData = {
      ...data,
      exportDate: new Date().toISOString(),
      appName: "Pat Finances",
      version: "1.0.0"
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    
    link.href = url;
    link.download = `Pat_Finances_Backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (confirm('Voulez-vous écraser vos données actuelles avec ce fichier de sauvegarde ?')) {
          dbService.importData(data, user.id);
          await fetchData();
          alert('Données importées avec succès !');
        }
      } catch (err) {
        alert('Format de fichier invalide.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  if (!user) return <Auth onLogin={setUser} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-600 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 text-white rounded-lg text-sm">P</span>
              <span>Pat</span>
            </div>
            <span className="text-slate-400 text-xs font-medium pl-10 uppercase tracking-widest">Finances</span>
          </h1>
        </div>
        
        <nav className="px-4 py-4 space-y-2 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="bg-slate-50 p-4 rounded-xl mb-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Session</p>
            <p className="text-sm font-semibold truncate">{user.name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleExportData}
              title="Exporter JSON"
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors border border-indigo-100"
            >
              <Download size={18} />
              <span className="text-[10px] font-bold uppercase">Sauver</span>
            </button>

            <button 
              onClick={handleImportClick}
              title="Importer JSON"
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors border border-emerald-100"
            >
              <Upload size={18} />
              <span className="text-[10px] font-bold uppercase">Charger</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          </div>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors">
            <LogOut size={20} />
            <span className="font-medium text-sm">Quitter</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto max-h-screen p-4 md:p-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'transactions' && 'Vos transactions'}
              {activeTab === 'budgets' && 'Gestion du budget'}
            </h2>
            <p className="text-slate-500">Suivi financier {viewDate.year}</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 min-w-[160px] justify-center">
              <Calendar size={18} className="text-indigo-600" />
              <span className="font-semibold text-slate-700">
                {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(viewDate.year, viewDate.month))}
              </span>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={filteredTransactions} 
              annualTransactions={annualTransactions}
              budgets={budgets} 
              categories={categories}
              onNavigate={setActiveTab} 
              viewDate={viewDate}
            />
          )}
          {activeTab === 'transactions' && <TransactionsView user={user} transactions={filteredTransactions} categories={categories} onUpdate={fetchData} />}
          {activeTab === 'budgets' && <BudgetManager user={user} viewDate={viewDate} budgets={budgets} transactions={filteredTransactions} categories={categories} onUpdate={fetchData} />}
        </div>
      </main>
    </div>
  );
};

export default App;
