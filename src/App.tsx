import React, { useState, useEffect } from 'react';
import {
  Client,
  Portfolio,
  Loan,
  Payment,
  PrinterConfig,
  ActiveTab,
  DeviceViewMode,
} from './types';
import { storageService } from './services/storage';
import { syncEngine } from './services/syncEngine';
import { Navbar } from './components/Navbar';
import { PortfolioView } from './components/PortfolioView';
import { DailyCashRegister } from './components/DailyCashRegister';
import { PushNotificationCenter } from './components/PushNotificationCenter';
import { OfflineSyncCenter } from './components/OfflineSyncCenter';
import { PrinterSettingsModal } from './components/PrinterSettingsModal';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { PaymentModal } from './components/PaymentModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { ClientDetailModal } from './components/ClientDetailModal';
import { NewLoanModal } from './components/NewLoanModal';
import { NewClientModal } from './components/NewClientModal';
import { PushBannerOverlay } from './components/PushBannerOverlay';
import {
  Users,
  Wallet,
  Bell,
  Printer,
  RefreshCw,
  Code2,
  DollarSign,
  Plus,
} from 'lucide-react';

export default function App() {
  // Application Data States
  const [clients, setClients] = useState<Client[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(storageService.getPrinterConfig());

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<ActiveTab>('cartera');
  const [deviceMode, setDeviceMode] = useState<DeviceViewMode>('responsive');

  // Network & Sync States
  const [isOnline, setIsOnline] = useState<boolean>(syncEngine.getIsOnline());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(syncEngine.getSimulatedOffline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Modals States
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<{ client: Client; loan: Loan } | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<{
    payment: Payment;
    client: Client;
    loan: Loan;
  } | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState<boolean>(false);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState<boolean>(false);
  const [newLoanClient, setNewLoanClient] = useState<Client | null>(null);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState<boolean>(false);

  // Load initial data
  const reloadData = () => {
    setClients(storageService.getClients());
    setPortfolios(storageService.getPortfolios());
    setLoans(storageService.getLoans());
    setPayments(storageService.getPayments());
    setPrinterConfig(storageService.getPrinterConfig());
  };

  useEffect(() => {
    reloadData();

    // Listen to sync engine
    const unsubscribeSync = syncEngine.addListener((state) => {
      setIsOnline(state.isOnline);
      setIsSimulatedOffline(state.isSimulatedOffline);
      setPendingSyncCount(state.pendingCount);
      reloadData();
    });

    return () => unsubscribeSync();
  }, []);

  // Handle successful payment registration
  const handlePaymentSuccess = (
    payment: Payment,
    updatedLoan: Loan,
    updatedClient: Client
  ) => {
    reloadData();
    setPaymentModalData(null);

    // Open receipt modal automatically
    if (printerConfig.autoPrintAfterPayment) {
      setReceiptModalData({
        payment,
        client: updatedClient,
        loan: updatedLoan,
      });
    }
  };

  // Open quick payment modal
  const handleOpenQuickPayment = (client: Client, loan: Loan) => {
    setPaymentModalData({ client, loan });
  };

  // Open reprint receipt
  const handleReprintReceipt = (payment: Payment) => {
    const client = clients.find((c) => c.id === payment.clientId);
    const loan = loans.find((l) => l.id === payment.loanId);
    if (client && loan) {
      setReceiptModalData({ payment, client, loan });
    }
  };

  // Open new loan for specific client
  const handleOpenNewLoanForClient = (client?: Client) => {
    setNewLoanClient(client || null);
    setIsNewLoanModalOpen(true);
  };

  const effectiveOffline = !isOnline || isSimulatedOffline;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'cartera':
        return (
          <PortfolioView
            clients={clients}
            portfolios={portfolios}
            loans={loans}
            payments={payments}
            onSelectClient={(c) => setSelectedClientForDetail(c)}
            onQuickPayment={handleOpenQuickPayment}
            onOpenNewClient={() => setIsNewClientModalOpen(true)}
            onOpenNewLoan={handleOpenNewLoanForClient}
            onReprintReceipt={handleReprintReceipt}
          />
        );
      case 'caja':
        return (
          <DailyCashRegister
            payments={payments}
            clients={clients}
            loans={loans}
            printerConfig={printerConfig}
            onReprintReceipt={handleReprintReceipt}
          />
        );
      case 'notificaciones':
        return <PushNotificationCenter clients={clients} loans={loans} />;
      case 'sincronizacion':
        return <OfflineSyncCenter />;
      case 'impresora':
        return (
          <div className="max-w-xl mx-auto py-4">
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                <Printer className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Administrador de Impresora Bluetooth
              </h2>
              <p className="text-xs text-slate-400">
                Conecta tu impresora térmica portátil de 58mm o 80mm e imprime recibos ESC/POS.
              </p>
              <button
                onClick={() => setIsPrinterSettingsOpen(true)}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/50 cursor-pointer"
              >
                Abrir Panel de Configuración e Impresión de Prueba
              </button>
            </div>
          </div>
        );
      case 'codigo_flutter':
        return <FlutterCodeViewer />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Real-time Push Notification Floating Overlay Banner */}
      <PushBannerOverlay />

      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        deviceMode={deviceMode}
        onSelectDeviceMode={setDeviceMode}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        pendingSyncCount={pendingSyncCount}
        printerConfig={printerConfig}
        onOpenPrinterSettings={() => setIsPrinterSettingsOpen(true)}
      />

      {/* Main Content Area with Device Frame Support (Responsive vs Tablet Frame vs Phone Frame) */}
      <main className="flex-1 flex justify-center py-3 sm:py-4 px-2.5 sm:px-6 pb-24 sm:pb-6 w-full max-w-full overflow-x-hidden">
        <div
          className={`w-full transition-all duration-300 ${
            deviceMode === 'mobile'
              ? 'lg:max-w-[420px] lg:bg-slate-100 lg:border-4 lg:border-slate-300 lg:rounded-[36px] lg:p-4 lg:shadow-2xl lg:my-2 lg:ring-8 lg:ring-slate-900/10'
              : deviceMode === 'tablet'
              ? 'lg:max-w-[880px] lg:bg-slate-100 lg:border-4 lg:border-slate-300 lg:rounded-[32px] lg:p-5 lg:shadow-2xl lg:my-2 lg:ring-4 lg:ring-slate-900/5'
              : 'max-w-7xl'
          }`}
        >
          {deviceMode === 'mobile' && (
            <div className="hidden lg:flex justify-center pb-3">
              <div className="w-24 h-3.5 bg-slate-300 rounded-full"></div>
            </div>
          )}

          {renderTabContent()}
        </div>
      </main>

      {/* Bottom Mobile Navigation for Phone view / small screens */}
      <nav
        aria-label="Navegación móvil"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 backdrop-blur-md px-1.5 py-1 flex justify-around shadow-lg pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      >
        <button
          id="mobile-nav-cartera"
          onClick={() => setActiveTab('cartera')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] min-w-[56px] min-h-[44px] transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'cartera' ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Cartera</span>
        </button>

        <button
          id="mobile-nav-caja"
          onClick={() => setActiveTab('caja')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] min-w-[56px] min-h-[44px] transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'caja' ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4 mb-0.5" />
          <span>Caja</span>
        </button>

        <button
          id="mobile-nav-notificaciones"
          onClick={() => setActiveTab('notificaciones')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] min-w-[56px] min-h-[44px] transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'notificaciones' ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4 mb-0.5" />
          <span>Push</span>
        </button>

        <button
          id="mobile-nav-sincronizacion"
          onClick={() => setActiveTab('sincronizacion')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] min-w-[56px] min-h-[44px] transition-colors cursor-pointer active:scale-95 relative ${
            activeTab === 'sincronizacion' ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <RefreshCw className="w-4 h-4 mb-0.5" />
          <span>Sync {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}</span>
          {pendingSyncCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          )}
        </button>

        <button
          id="mobile-nav-codigo-flutter"
          onClick={() => setActiveTab('codigo_flutter')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] min-w-[56px] min-h-[44px] transition-colors cursor-pointer active:scale-95 ${
            activeTab === 'codigo_flutter' ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4 mb-0.5" />
          <span>Flutter</span>
        </button>
      </nav>

      {/* Modals & Dialogs */}
      {/* 1. Payment Modal */}
      <PaymentModal
        isOpen={!!paymentModalData}
        onClose={() => setPaymentModalData(null)}
        client={paymentModalData?.client || null}
        loan={paymentModalData?.loan || null}
        isOffline={effectiveOffline}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 2. Thermal ESC/POS Receipt Modal */}
      <ThermalReceiptModal
        isOpen={!!receiptModalData}
        onClose={() => setReceiptModalData(null)}
        payment={receiptModalData?.payment || null}
        client={receiptModalData?.client || null}
        loan={receiptModalData?.loan || null}
        printerConfig={printerConfig}
      />

      {/* 3. Debtor Detail Profile Modal */}
      <ClientDetailModal
        isOpen={!!selectedClientForDetail}
        onClose={() => setSelectedClientForDetail(null)}
        client={selectedClientForDetail}
        portfolio={
          portfolios.find((p) => p.id === selectedClientForDetail?.portfolioId) || null
        }
        loans={loans}
        payments={payments}
        onOpenPayment={(client, loan) => {
          setSelectedClientForDetail(null);
          handleOpenQuickPayment(client, loan);
        }}
        onOpenNewLoan={(client) => {
          setSelectedClientForDetail(null);
          handleOpenNewLoanForClient(client);
        }}
      />

      {/* 4. New Loan Modal */}
      <NewLoanModal
        isOpen={isNewLoanModalOpen}
        onClose={() => {
          setIsNewLoanModalOpen(false);
          setNewLoanClient(null);
        }}
        clients={clients}
        initialClient={newLoanClient}
        onLoanCreated={(newLoan) => {
          reloadData();
        }}
      />

      {/* 5. New Client Modal */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        portfolios={portfolios}
        onClientCreated={(newClient) => {
          reloadData();
        }}
      />

      {/* 6. Printer Settings Modal */}
      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
        config={printerConfig}
        onConfigUpdated={(cfg) => setPrinterConfig(cfg)}
      />
    </div>
  );
}
