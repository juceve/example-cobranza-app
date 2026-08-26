import React, { useState, useMemo } from 'react';
import { Client, Portfolio, Loan, Payment, DebtorStatus } from '../types';
import {
  Search,
  Filter,
  DollarSign,
  UserPlus,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  MapPin,
  CreditCard,
  Printer,
  Plus,
} from 'lucide-react';

interface PortfolioViewProps {
  clients: Client[];
  portfolios: Portfolio[];
  loans: Loan[];
  payments: Payment[];
  onSelectClient: (client: Client) => void;
  onQuickPayment: (client: Client, loan: Loan) => void;
  onOpenNewClient: () => void;
  onOpenNewLoan: (client?: Client) => void;
  onReprintReceipt: (payment: Payment) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  clients,
  portfolios,
  loans,
  payments,
  onSelectClient,
  onQuickPayment,
  onOpenNewClient,
  onOpenNewLoan,
  onReprintReceipt,
}) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter clients based on search, portfolio, and status
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Portfolio filter
      if (selectedPortfolioId !== 'all' && client.portfolioId !== selectedPortfolioId) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pendientes_hoy') {
          // Check if has active loan with pending balance and hasn't paid today
          const today = new Date().toISOString().split('T')[0];
          const hasPaidToday = payments.some(
            (p) => p.clientId === client.id && p.timestamp.startsWith(today)
          );
          if (client.currentBalance <= 0 || hasPaidToday) return false;
        } else if (client.status !== statusFilter) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(query);
        const matchesDoc = client.documentId.toLowerCase().includes(query);
        const matchesPhone = client.phone.toLowerCase().includes(query);
        const matchesAddress = client.address.toLowerCase().includes(query);
        return matchesName || matchesDoc || matchesPhone || matchesAddress;
      }

      return true;
    });
  }, [clients, selectedPortfolioId, statusFilter, searchQuery, payments]);

  // Aggregate Portfolio Stats
  const activePortfolioClients = useMemo(() => {
    return selectedPortfolioId === 'all'
      ? clients
      : clients.filter((c) => c.portfolioId === selectedPortfolioId);
  }, [clients, selectedPortfolioId]);

  const totalDebt = activePortfolioClients.reduce((sum, c) => sum + c.currentBalance, 0);
  const overdueCount = activePortfolioClients.filter((c) => c.status === 'en_mora').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollected = payments
    .filter((p) => p.timestamp.startsWith(todayStr))
    .filter((p) => {
      if (selectedPortfolioId === 'all') return true;
      const c = clients.find((client) => client.id === p.clientId);
      return c?.portfolioId === selectedPortfolioId;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Route / Portfolio Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2.5 px-2.5 sm:mx-0 sm:px-0 scrollbar-none touch-pan-x">
        <button
          id="tab-portfolio-all"
          onClick={() => setSelectedPortfolioId('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedPortfolioId === 'all'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Todas las Rutas ({clients.length})
        </button>

        {portfolios.map((p) => {
          const count = clients.filter((c) => c.portfolioId === p.id).length;
          const active = selectedPortfolioId === p.id;
          return (
            <button
              key={p.id}
              id={`tab-portfolio-${p.id}`}
              onClick={() => setSelectedPortfolioId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="p-3 sm:p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">Cartera por Cobrar</div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight truncate">
            ${totalDebt.toFixed(2)}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">Recaudado Hoy</div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 font-mono tracking-tight truncate">
            ${todayCollected.toFixed(2)}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">Deudores en Mora</div>
          <div className="text-lg sm:text-2xl font-black text-rose-600 font-mono tracking-tight truncate">
            {overdueCount} {overdueCount === 1 ? 'cliente' : 'clientes'}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">Total en Ruta</div>
          <div className="text-lg sm:text-2xl font-black text-slate-800 font-mono tracking-tight truncate">
            {activePortfolioClients.length} deudores
          </div>
        </div>
      </div>

      {/* Search Bar and Status Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-debtors-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI, teléfono..."
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-2.5 px-2.5 sm:mx-0 sm:px-0 scrollbar-none touch-pan-x">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pendientes_hoy', label: 'Pendientes Hoy' },
            { id: 'en_mora', label: 'En Mora' },
            { id: 'al_dia', label: 'Al Día' },
            { id: 'liquidado', label: 'Liquidados' },
          ].map((f) => (
            <button
              key={f.id}
              id={`filter-status-${f.id}`}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-slate-800 text-white shadow-xs font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Debtor Cards Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredClients.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <Search className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              No se encontraron deudores con los filtros seleccionados.
            </p>
            <p className="text-xs text-slate-500">
              Prueba cambiando la búsqueda o agregando un nuevo cliente con el botón (+).
            </p>
            <button
              onClick={onOpenNewClient}
              className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Nuevo Deudor</span>
            </button>
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientLoans = loans.filter((l) => l.clientId === client.id);
            const activeLoan = clientLoans.find((l) => l.status === 'activo') || clientLoans[0];
            const portfolio = portfolios.find((p) => p.id === client.portfolioId);

            const percentPaid = activeLoan
              ? Math.min(100, Math.round((activeLoan.paidAmount / activeLoan.totalAmount) * 100))
              : 100;

            const isOverdue = client.status === 'en_mora';
            const isAlert = client.status === 'alerta';
            const isPaidUp = client.status === 'liquidado';

            return (
              <div
                key={client.id}
                id={`debtor-card-${client.id}`}
                className={`bg-white border rounded-xl p-4 space-y-3 hover:shadow-md transition-all flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-300 bg-rose-50/20'
                    : isAlert
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Top: Avatar, Name, Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center justify-center text-sm shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate leading-snug">
                          {client.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>Doc: {client.documentId}</span>
                          <span>&middot;</span>
                          <span className="truncate text-slate-600">{portfolio?.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isOverdue && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider">
                        Mora
                      </span>
                    )}
                    {isAlert && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider">
                        Alerta
                      </span>
                    )}
                    {isPaidUp && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider">
                        Liquidado
                      </span>
                    )}
                    {client.status === 'al_dia' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider">
                        Al Día
                      </span>
                    )}
                  </div>

                  {/* Address and Phone */}
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  </div>
                </div>

                {/* Loan & Debt Stats Block */}
                {activeLoan ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Cuota: <strong className="text-emerald-600 font-mono">${activeLoan.installmentAmount.toFixed(2)}</strong> ({activeLoan.frequency})</span>
                      <span className="text-slate-600">Saldo: <strong className="text-slate-900 font-mono text-sm font-bold">${activeLoan.remainingBalance.toFixed(2)}</strong></span>
                    </div>

                    {/* Mini Progress */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isOverdue ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{percentPaid}% Pagado</span>
                        <span>Total: ${activeLoan.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                    Sin crédito activo pendiente
                  </div>
                )}

                {/* Bottom Actions Bar */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {activeLoan && activeLoan.remainingBalance > 0 ? (
                    <button
                      id={`btn-quick-cobrar-${client.id}`}
                      onClick={() => onQuickPayment(client, activeLoan)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer min-h-[42px]"
                    >
                      <DollarSign className="w-4 h-4 shrink-0" />
                      <span>Cobrar Cuota</span>
                    </button>
                  ) : (
                    <button
                      id={`btn-quick-new-loan-${client.id}`}
                      onClick={() => onOpenNewLoan(client)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer min-h-[42px]"
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span>Nuevo Crédito</span>
                    </button>
                  )}

                  <button
                    id={`btn-view-profile-${client.id}`}
                    onClick={() => onSelectClient(client)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 shadow-xs transition-all cursor-pointer min-h-[42px]"
                  >
                    <span>Ver Ficha</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) on Mobile/Tablet */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col gap-2.5">
        <button
          id="fab-add-client"
          onClick={onOpenNewClient}
          title="Registrar Nuevo Deudor"
          className="w-13 h-13 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-900/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-6 h-6 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
