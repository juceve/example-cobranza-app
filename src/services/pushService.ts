import { Client, Payment, Loan, PushNotificationRecord } from '../types';
import { soundEffects } from '../utils/audio';

type NotificationListener = (record: PushNotificationRecord) => void;

class PushNotificationService {
  private listeners: NotificationListener[] = [];
  private history: PushNotificationRecord[] = [];

  constructor() {
    this.loadHistory();
  }

  private loadHistory() {
    try {
      const saved = localStorage.getItem('cobromovil_push_history');
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch {
      this.history = [];
    }
  }

  private saveHistory() {
    try {
      localStorage.setItem('cobromovil_push_history', JSON.stringify(this.history.slice(0, 50)));
    } catch {
      // Ignore
    }
  }

  addListener(listener: NotificationListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getHistory(): PushNotificationRecord[] {
    return [...this.history];
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  }

  sendPushToClient(
    client: Client,
    title: string,
    body: string,
    type: 'pago' | 'recordatorio' | 'mora' | 'bienvenida',
    channel: 'fcm_push' | 'whatsapp' | 'sms' = 'fcm_push',
    receiptNumber?: string
  ): PushNotificationRecord {
    const record: PushNotificationRecord = {
      id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      clientId: client.id,
      clientName: client.name,
      title,
      body,
      timestamp: new Date().toISOString(),
      status: 'entregado',
      type,
      channel,
      receiptNumber,
    };

    // Play chime
    soundEffects.playNotification();

    // Trigger Native Browser Web Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch {
        // Fallback to internal banner
      }
    }

    // Save in history
    this.history.unshift(record);
    this.saveHistory();

    // Notify active listeners (in-app banner popups)
    this.listeners.forEach((listener) => listener(record));

    return record;
  }

  sendPaymentReceiptPush(client: Client, payment: Payment, loan: Loan): PushNotificationRecord {
    const title = `✅ Pago Recibido - Recibo #${payment.receiptNumber}`;
    const body = `Hola ${client.name}, hemos registrado su abono de $${payment.amount.toFixed(
      2
    )}. Su nuevo saldo pendiente es $${payment.newBalance.toFixed(2)}. ¡Gracias por su puntualidad!`;

    return this.sendPushToClient(client, title, body, 'pago', 'fcm_push', payment.receiptNumber);
  }

  sendDueDateReminderPush(client: Client, loan: Loan, nextInstallmentDate: string, amount: number): PushNotificationRecord {
    const title = `⏰ Recordatorio de Cuota - Crédito ${loan.loanNumber}`;
    const body = `Estimado(a) ${client.name}, le recordamos que su cuota de $${amount.toFixed(
      2
    )} vence el ${nextInstallmentDate}. Evite cargos por mora.`;

    return this.sendPushToClient(client, title, body, 'recordatorio', 'fcm_push');
  }

  sendOverdueNoticePush(client: Client, loan: Loan, overdueDays: number): PushNotificationRecord {
    const title = `⚠️ Aviso de Cuota Vencida (${overdueDays} días)`;
    const body = `Estimado(a) ${client.name}, su cuota de crédito ${loan.loanNumber} presenta ${overdueDays} días de retraso. Por favor coordine su pago con el cobrador asignado.`;

    return this.sendPushToClient(client, title, body, 'mora', 'fcm_push');
  }

  // Generate a formatted WhatsApp share link for the debtor
  generateWhatsAppShareUrl(client: Client, payment: Payment, businessName: string): string {
    const cleanPhone = client.phone.replace(/[^0-9]/g, '');
    const message = `*COMPROBANTE DE PAGO DIGITAL*\n` +
      `🏢 *${businessName.toUpperCase()}*\n` +
      `🧾 *Recibo N°:* #${payment.receiptNumber}\n` +
      `👤 *Cliente:* ${client.name}\n` +
      `💳 *Monto Pagado:* $${payment.amount.toFixed(2)}\n` +
      `📅 *Fecha:* ${new Date(payment.timestamp).toLocaleString('es-ES')}\n` +
      `📌 *Canal:* ${payment.paymentMethod.toUpperCase()}\n` +
      `💰 *Nuevo Saldo Restante:* $${payment.newBalance.toFixed(2)}\n` +
      `👨‍💼 *Cobrador:* ${payment.collectorName}\n\n` +
      `_Gracias por su pago puntual._`;

    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  }
}

export const pushService = new PushNotificationService();
