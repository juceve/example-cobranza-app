import { Client, Portfolio, Loan, Payment, PrinterConfig, SyncQueueItem } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'cobromovil_clients_v1',
  PORTFOLIOS: 'cobromovil_portfolios_v1',
  LOANS: 'cobromovil_loans_v1',
  PAYMENTS: 'cobromovil_payments_v1',
  PRINTER_CONFIG: 'cobromovil_printer_cfg_v1',
  SYNC_QUEUE: 'cobromovil_sync_queue_v1',
  COLLECTOR_PROFILE: 'cobromovil_collector_v1',
};

export const INITIAL_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port_1',
    name: 'Ruta 1 - Mercado Central',
    zone: 'Sector Comercial Norte',
    collectorName: 'Carlos Mendoza',
    color: 'emerald',
    iconName: 'Store',
  },
  {
    id: 'port_2',
    name: 'Ruta 2 - Zona Industrial',
    zone: 'Parque Industrial & Talleres',
    collectorName: 'Carlos Mendoza',
    color: 'indigo',
    iconName: 'Factory',
  },
  {
    id: 'port_3',
    name: 'Ruta 3 - Los Olivos & San Pedro',
    zone: 'Sector Residencial Sur',
    collectorName: 'Carlos Mendoza',
    color: 'amber',
    iconName: 'Home',
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    portfolioId: 'port_1',
    name: 'María Elena Salazar',
    documentId: '84920145',
    phone: '+591 71234567',
    email: 'maria.salazar@email.com',
    address: 'Av. Las Palmeras #234 (Puesto de Abarrotes #12)',
    neighborhood: 'Mercado Central',
    coordinates: { lat: -17.7832, lng: -63.1821 },
    creditLimit: 1500,
    currentBalance: 450,
    status: 'al_dia',
    creditScore: 92,
    notes: 'Paga puntual todas las mañanas a las 9:30 AM en su puesto.',
    registeredAt: '2026-01-10',
    lastPaymentDate: '2026-08-25',
  },
  {
    id: 'cli_2',
    portfolioId: 'port_1',
    name: 'Roberto Gómez Valdez',
    documentId: '63219084',
    phone: '+591 72345678',
    email: 'roberto.gomez@email.com',
    address: 'Calle Comercio Esq. Sucre #89',
    neighborhood: 'Centro Histórico',
    coordinates: { lat: -17.7845, lng: -63.1812 },
    creditLimit: 2000,
    currentBalance: 1200,
    status: 'en_mora',
    creditScore: 58,
    notes: 'Presenta 4 días de retraso en la cuota 14. Llamar antes de pasar.',
    registeredAt: '2026-02-15',
    lastPaymentDate: '2026-08-20',
  },
  {
    id: 'cli_3',
    portfolioId: 'port_1',
    name: 'Lucía Fernández Rios',
    documentId: '47829103',
    phone: '+591 73456789',
    email: 'lucia.fernandez@email.com',
    address: 'Puesto de Frutas #45 - Galería Este',
    neighborhood: 'Mercado Central',
    coordinates: { lat: -17.7828, lng: -63.1834 },
    creditLimit: 800,
    currentBalance: 240,
    status: 'al_dia',
    creditScore: 88,
    notes: 'Excelente cliente, renueva crédito periódicamente.',
    registeredAt: '2026-03-01',
    lastPaymentDate: '2026-08-24',
  },
  {
    id: 'cli_4',
    portfolioId: 'port_2',
    name: 'Taller Mecánico Hermanos Choque',
    documentId: '98124560',
    phone: '+591 74567890',
    email: 'taller.choque@email.com',
    address: 'Av. Industrial 4to Anillo #1540',
    neighborhood: 'Zona Industrial',
    coordinates: { lat: -17.7912, lng: -63.1678 },
    creditLimit: 5000,
    currentBalance: 3100,
    status: 'alerta',
    creditScore: 71,
    notes: 'Solicitó prórroga de 2 días por cobro de facturas a empresas.',
    registeredAt: '2026-04-12',
    lastPaymentDate: '2026-08-18',
  },
  {
    id: 'cli_5',
    portfolioId: 'port_3',
    name: 'Carmen Vaca Díez',
    documentId: '35678129',
    phone: '+591 75678901',
    email: 'carmen.vaca@email.com',
    address: 'Barrio Los Olivos Calle 3 #45',
    neighborhood: 'Los Olivos',
    coordinates: { lat: -17.8012, lng: -63.1945 },
    creditLimit: 1000,
    currentBalance: 0,
    status: 'liquidado',
    creditScore: 98,
    notes: 'Completó préstamo con anticipación. Califica para ampliación a $3000.',
    registeredAt: '2026-05-01',
    lastPaymentDate: '2026-08-22',
  },
  {
    id: 'cli_6',
    portfolioId: 'port_3',
    name: 'Jorge Morales Pinto',
    documentId: '54321678',
    phone: '+591 76789012',
    email: 'jorge.morales@email.com',
    address: 'Calle Los Pinos #780',
    neighborhood: 'San Pedro',
    coordinates: { lat: -17.8056, lng: -63.1912 },
    creditLimit: 1200,
    currentBalance: 600,
    status: 'al_dia',
    creditScore: 84,
    notes: 'Paga por transferencia o QR móvil de preferencia.',
    registeredAt: '2026-06-15',
    lastPaymentDate: '2026-08-25',
  }
];

export const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan_1',
    clientId: 'cli_1',
    loanNumber: 'CR-2026-0089',
    principalAmount: 1000,
    interestRatePercent: 15,
    totalAmount: 1150,
    installmentsCount: 23,
    installmentAmount: 50,
    frequency: 'diario',
    startDate: '2026-08-01',
    endDate: '2026-08-28',
    status: 'activo',
    remainingBalance: 450,
    paidAmount: 700,
    createdAt: '2026-08-01T08:00:00Z',
    schedule: Array.from({ length: 23 }).map((_, i) => ({
      installmentNumber: i + 1,
      dueDate: new Date(2026, 7, 1 + i).toISOString().split('T')[0],
      amount: 50,
      status: i < 14 ? 'pagada' : 'pendiente',
      paidDate: i < 14 ? new Date(2026, 7, 1 + i).toISOString().split('T')[0] : undefined,
      paidAmount: i < 14 ? 50 : undefined,
    })),
  },
  {
    id: 'loan_2',
    clientId: 'cli_2',
    loanNumber: 'CR-2026-0094',
    principalAmount: 1500,
    interestRatePercent: 20,
    totalAmount: 1800,
    installmentsCount: 30,
    installmentAmount: 60,
    frequency: 'diario',
    startDate: '2026-07-20',
    endDate: '2026-08-25',
    status: 'activo',
    remainingBalance: 1200,
    paidAmount: 600,
    createdAt: '2026-07-20T08:00:00Z',
    schedule: Array.from({ length: 30 }).map((_, i) => ({
      installmentNumber: i + 1,
      dueDate: new Date(2026, 6, 20 + i).toISOString().split('T')[0],
      amount: 60,
      status: i < 10 ? 'pagada' : i < 14 ? 'vencida' : 'pendiente',
      paidDate: i < 10 ? new Date(2026, 6, 20 + i).toISOString().split('T')[0] : undefined,
      paidAmount: i < 10 ? 60 : undefined,
    })),
  },
  {
    id: 'loan_3',
    clientId: 'cli_3',
    loanNumber: 'CR-2026-0102',
    principalAmount: 600,
    interestRatePercent: 10,
    totalAmount: 660,
    installmentsCount: 22,
    installmentAmount: 30,
    frequency: 'diario',
    startDate: '2026-08-05',
    endDate: '2026-08-30',
    status: 'activo',
    remainingBalance: 240,
    paidAmount: 420,
    createdAt: '2026-08-05T09:00:00Z',
    schedule: Array.from({ length: 22 }).map((_, i) => ({
      installmentNumber: i + 1,
      dueDate: new Date(2026, 7, 5 + i).toISOString().split('T')[0],
      amount: 30,
      status: i < 14 ? 'pagada' : 'pendiente',
      paidDate: i < 14 ? new Date(2026, 7, 5 + i).toISOString().split('T')[0] : undefined,
      paidAmount: i < 14 ? 30 : undefined,
    })),
  },
  {
    id: 'loan_4',
    clientId: 'cli_4',
    loanNumber: 'CR-2026-0062',
    principalAmount: 4000,
    interestRatePercent: 15,
    totalAmount: 4600,
    installmentsCount: 46,
    installmentAmount: 100,
    frequency: 'diario',
    startDate: '2026-07-01',
    endDate: '2026-08-20',
    status: 'activo',
    remainingBalance: 3100,
    paidAmount: 1500,
    createdAt: '2026-07-01T08:00:00Z',
    schedule: Array.from({ length: 46 }).map((_, i) => ({
      installmentNumber: i + 1,
      dueDate: new Date(2026, 6, 1 + i).toISOString().split('T')[0],
      amount: 100,
      status: i < 15 ? 'pagada' : 'pendiente',
      paidDate: i < 15 ? new Date(2026, 6, 1 + i).toISOString().split('T')[0] : undefined,
      paidAmount: i < 15 ? 100 : undefined,
    })),
  },
  {
    id: 'loan_6',
    clientId: 'cli_6',
    loanNumber: 'CR-2026-0115',
    principalAmount: 1000,
    interestRatePercent: 20,
    totalAmount: 1200,
    installmentsCount: 24,
    installmentAmount: 50,
    frequency: 'diario',
    startDate: '2026-08-10',
    endDate: '2026-09-08',
    status: 'activo',
    remainingBalance: 600,
    paidAmount: 600,
    createdAt: '2026-08-10T08:00:00Z',
    schedule: Array.from({ length: 24 }).map((_, i) => ({
      installmentNumber: i + 1,
      dueDate: new Date(2026, 7, 10 + i).toISOString().split('T')[0],
      amount: 50,
      status: i < 12 ? 'pagada' : 'pendiente',
      paidDate: i < 12 ? new Date(2026, 7, 10 + i).toISOString().split('T')[0] : undefined,
      paidAmount: i < 12 ? 50 : undefined,
    })),
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_101',
    receiptNumber: 'REC-082601',
    loanId: 'loan_1',
    clientId: 'cli_1',
    amount: 50,
    paymentMethod: 'efectivo',
    timestamp: '2026-08-26T09:30:00Z',
    installmentsCovered: [14],
    previousBalance: 500,
    newBalance: 450,
    collectorName: 'Carlos Mendoza',
    notes: 'Pago en mano en local comercial',
    gpsLocation: { lat: -17.7832, lng: -63.1821, accuracy: 5 },
    isOfflineSync: false,
    syncStatus: 'synced',
    pushNotificationSent: true,
  },
  {
    id: 'pay_102',
    receiptNumber: 'REC-082602',
    loanId: 'loan_3',
    clientId: 'cli_3',
    amount: 30,
    paymentMethod: 'efectivo',
    timestamp: '2026-08-26T10:15:00Z',
    installmentsCovered: [14],
    previousBalance: 270,
    newBalance: 240,
    collectorName: 'Carlos Mendoza',
    notes: 'Pago puntual matutino',
    gpsLocation: { lat: -17.7828, lng: -63.1834, accuracy: 4 },
    isOfflineSync: false,
    syncStatus: 'synced',
    pushNotificationSent: true,
  }
];

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  deviceName: 'MPT-II Bluetooth Thermal Printer (58mm)',
  paperSize: '58mm',
  autoPrintAfterPayment: true,
  businessName: 'INVERSIONES & COBRANZAS DEL SUR',
  taxId: 'NIT 904.819.023-1',
  address: 'Calle Comercio #450 Edif. Cristal Of. 2B',
  phone: '+591 700-12345',
  receiptHeader: 'COMPROBANTE OFICIAL DE PAGO',
  receiptFooter: '¡Gracias por su pago puntual!',
  isConnected: true,
  connectionType: 'simulated',
};

class StorageService {
  getClients(): Client[] {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!data) {
      this.saveClients(INITIAL_CLIENTS);
      return INITIAL_CLIENTS;
    }
    return JSON.parse(data);
  }

  saveClients(clients: Client[]) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }

  getPortfolios(): Portfolio[] {
    const data = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
    if (!data) {
      this.savePortfolios(INITIAL_PORTFOLIOS);
      return INITIAL_PORTFOLIOS;
    }
    return JSON.parse(data);
  }

  savePortfolios(portfolios: Portfolio[]) {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));
  }

  getLoans(): Loan[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (!data) {
      this.saveLoans(INITIAL_LOANS);
      return INITIAL_LOANS;
    }
    return JSON.parse(data);
  }

  saveLoans(loans: Loan[]) {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }

  getPayments(): Payment[] {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!data) {
      this.savePayments(INITIAL_PAYMENTS);
      return INITIAL_PAYMENTS;
    }
    return JSON.parse(data);
  }

  savePayments(payments: Payment[]) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }

  getPrinterConfig(): PrinterConfig {
    const data = localStorage.getItem(STORAGE_KEYS.PRINTER_CONFIG);
    if (!data) {
      this.savePrinterConfig(DEFAULT_PRINTER_CONFIG);
      return DEFAULT_PRINTER_CONFIG;
    }
    return JSON.parse(data);
  }

  savePrinterConfig(cfg: PrinterConfig) {
    localStorage.setItem(STORAGE_KEYS.PRINTER_CONFIG, JSON.stringify(cfg));
  }

  getSyncQueue(): SyncQueueItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  }

  saveSyncQueue(queue: SyncQueueItem[]) {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts'>): SyncQueueItem {
    const queue = this.getSyncQueue();
    const newItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    queue.push(newItem);
    this.saveSyncQueue(queue);
    return newItem;
  }

  removeFromSyncQueue(id: string) {
    const queue = this.getSyncQueue().filter((q) => q.id !== id);
    this.saveSyncQueue(queue);
  }

  clearSyncQueue() {
    this.saveSyncQueue([]);
  }

  // Record a payment with balance update and loan schedule calculation
  recordPayment(
    loanId: string,
    amount: number,
    paymentMethod: Payment['paymentMethod'],
    collectorName: string,
    notes?: string,
    signatureBase64?: string,
    isOffline: boolean = false,
    gpsCoords?: { lat: number; lng: number }
  ): { payment: Payment; updatedLoan: Loan; updatedClient: Client } {
    const loans = this.getLoans();
    const clients = this.getClients();
    const payments = this.getPayments();

    const loanIndex = loans.findIndex((l) => l.id === loanId);
    if (loanIndex === -1) throw new Error('Crédito no encontrado');

    const loan = loans[loanIndex];
    const clientIndex = clients.findIndex((c) => c.id === loan.clientId);
    if (clientIndex === -1) throw new Error('Cliente no encontrado');

    const client = clients[clientIndex];

    const prevBalance = loan.remainingBalance;
    const newBalance = Math.max(0, prevBalance - amount);
    const newPaidAmount = loan.paidAmount + amount;

    // Calculate covered installments
    let remainingAmountToDistribute = amount;
    const coveredInstallmentNumbers: number[] = [];
    const updatedSchedule = loan.schedule.map((inst) => {
      if (inst.status === 'pagada') return inst;
      if (remainingAmountToDistribute <= 0) return inst;

      const needed = inst.amount - (inst.paidAmount || 0);
      if (remainingAmountToDistribute >= needed) {
        remainingAmountToDistribute -= needed;
        coveredInstallmentNumbers.push(inst.installmentNumber);
        return {
          ...inst,
          status: 'pagada' as const,
          paidAmount: inst.amount,
          paidDate: new Date().toISOString().split('T')[0],
        };
      } else {
        const currentPaid = (inst.paidAmount || 0) + remainingAmountToDistribute;
        remainingAmountToDistribute = 0;
        coveredInstallmentNumbers.push(inst.installmentNumber);
        return {
          ...inst,
          status: 'parcial' as const,
          paidAmount: currentPaid,
          paidDate: new Date().toISOString().split('T')[0],
        };
      }
    });

    const isFullyPaid = newBalance === 0;
    const updatedLoan: Loan = {
      ...loan,
      remainingBalance: newBalance,
      paidAmount: newPaidAmount,
      status: isFullyPaid ? 'completado' : loan.status,
      schedule: updatedSchedule,
    };

    loans[loanIndex] = updatedLoan;
    this.saveLoans(loans);

    // Update Client
    const updatedClient: Client = {
      ...client,
      currentBalance: Math.max(0, client.currentBalance - amount),
      status: isFullyPaid ? 'liquidado' : newBalance > 0 && client.status === 'en_mora' ? 'al_dia' : client.status,
      lastPaymentDate: new Date().toISOString().split('T')[0],
      creditScore: Math.min(100, client.creditScore + (isOffline ? 1 : 2)),
    };

    clients[clientIndex] = updatedClient;
    this.saveClients(clients);

    // Create Payment Record
    const receiptSeq = payments.length + 1;
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const receiptNumber = `REC-${datePrefix}${String(receiptSeq).padStart(3, '0')}`;

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      receiptNumber,
      loanId,
      clientId: client.id,
      amount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      installmentsCovered: coveredInstallmentNumbers.length > 0 ? coveredInstallmentNumbers : [1],
      previousBalance: prevBalance,
      newBalance,
      collectorName,
      notes,
      signatureBase64,
      gpsLocation: gpsCoords || { lat: -17.7835 + (Math.random() - 0.5) * 0.01, lng: -63.182 + (Math.random() - 0.5) * 0.01, accuracy: 4.5 },
      isOfflineSync: isOffline,
      syncStatus: isOffline ? 'pending_sync' : 'synced',
      pushNotificationSent: true,
      offlineToken: isOffline ? `OFF-${Math.random().toString(36).substring(2, 9).toUpperCase()}` : undefined,
    };

    payments.unshift(newPayment);
    this.savePayments(payments);

    // If offline, add to sync queue
    if (isOffline) {
      this.addToSyncQueue({
        entityType: 'payment',
        action: 'create',
        data: newPayment,
      });
    }

    return { payment: newPayment, updatedLoan, updatedClient };
  }

  // Create new Loan
  createNewLoan(
    clientId: string,
    principalAmount: number,
    interestRatePercent: number,
    installmentsCount: number,
    frequency: Loan['frequency']
  ): Loan {
    const loans = this.getLoans();
    const clients = this.getClients();
    const clientIndex = clients.findIndex((c) => c.id === clientId);
    if (clientIndex === -1) throw new Error('Cliente no encontrado');

    const totalInterest = principalAmount * (interestRatePercent / 100);
    const totalAmount = principalAmount + totalInterest;
    const installmentAmount = Math.round((totalAmount / installmentsCount) * 100) / 100;

    const startDate = new Date();
    const schedule: Loan['schedule'] = [];

    for (let i = 0; i < installmentsCount; i++) {
      const d = new Date(startDate);
      if (frequency === 'diario') d.setDate(d.getDate() + i + 1);
      else if (frequency === 'semanal') d.setDate(d.getDate() + (i + 1) * 7);
      else if (frequency === 'quincenal') d.setDate(d.getDate() + (i + 1) * 15);
      else if (frequency === 'mensual') d.setMonth(d.getMonth() + i + 1);

      schedule.push({
        installmentNumber: i + 1,
        dueDate: d.toISOString().split('T')[0],
        amount: installmentAmount,
        status: 'pendiente',
      });
    }

    const loanNumber = `CR-${new Date().getFullYear()}-${String(loans.length + 1).padStart(4, '0')}`;
    const newLoan: Loan = {
      id: `loan_${Date.now()}`,
      clientId,
      loanNumber,
      principalAmount,
      interestRatePercent,
      totalAmount,
      installmentsCount,
      installmentAmount,
      frequency,
      startDate: startDate.toISOString().split('T')[0],
      endDate: schedule[schedule.length - 1].dueDate,
      status: 'activo',
      remainingBalance: totalAmount,
      paidAmount: 0,
      schedule,
      createdAt: new Date().toISOString(),
    };

    loans.push(newLoan);
    this.saveLoans(loans);

    // Update Client Balance
    clients[clientIndex].currentBalance += totalAmount;
    clients[clientIndex].status = 'al_dia';
    this.saveClients(clients);

    return newLoan;
  }

  // Create new Client
  createClient(clientData: Omit<Client, 'id' | 'currentBalance' | 'registeredAt'>): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}`,
      currentBalance: 0,
      registeredAt: new Date().toISOString().split('T')[0],
    };
    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  }
}

export const storageService = new StorageService();
