export type DebtorStatus = 'al_dia' | 'en_mora' | 'alerta' | 'liquidado';

export type PaymentFrequency = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'movil' | 'otro';

export type SyncStatus = 'synced' | 'pending_sync' | 'failed';

export interface InstallmentItem {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'pendiente' | 'pagada' | 'parcial' | 'vencida';
  paidDate?: string;
  paidAmount?: number;
}

export interface Loan {
  id: string;
  clientId: string;
  loanNumber: string;
  principalAmount: number;
  interestRatePercent: number;
  totalAmount: number;
  installmentsCount: number;
  installmentAmount: number;
  frequency: PaymentFrequency;
  startDate: string;
  endDate: string;
  status: 'activo' | 'completado' | 'castigado';
  remainingBalance: number;
  paidAmount: number;
  schedule: InstallmentItem[];
  createdAt: string;
}

export interface Client {
  id: string;
  portfolioId: string;
  name: string;
  documentId: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  creditLimit: number;
  currentBalance: number;
  status: DebtorStatus;
  creditScore: number; // 0 to 100
  notes: string;
  avatarUrl?: string;
  lastPaymentDate?: string;
  registeredAt: string;
}

export interface Portfolio {
  id: string;
  name: string;
  zone: string;
  collectorName: string;
  color: string;
  iconName: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  loanId: string;
  clientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  installmentsCovered: number[];
  previousBalance: number;
  newBalance: number;
  collectorName: string;
  notes?: string;
  gpsLocation?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  signatureBase64?: string;
  isOfflineSync: boolean;
  syncStatus: SyncStatus;
  pushNotificationSent: boolean;
  offlineToken?: string;
}

export interface PushNotificationRecord {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  body: string;
  timestamp: string;
  status: 'enviado' | 'entregado' | 'leido';
  type: 'pago' | 'recordatorio' | 'mora' | 'bienvenida';
  channel: 'fcm_push' | 'whatsapp' | 'sms';
  receiptNumber?: string;
}

export interface PrinterConfig {
  deviceName: string;
  paperSize: '58mm' | '80mm';
  autoPrintAfterPayment: boolean;
  businessName: string;
  taxId: string; // RUC/NIT/RFC
  address: string;
  phone: string;
  receiptHeader: string;
  receiptFooter: string;
  isConnected: boolean;
  connectionType: 'bluetooth' | 'simulated';
}

export interface SyncQueueItem {
  id: string;
  entityType: 'payment' | 'loan' | 'client';
  action: 'create' | 'update';
  data: any;
  createdAt: string;
  attempts: number;
}

export type ActiveTab = 'cartera' | 'cobro_rapido' | 'caja' | 'notificaciones' | 'impresora' | 'sincronizacion' | 'codigo_flutter';

export type DeviceViewMode = 'responsive' | 'mobile' | 'tablet';
