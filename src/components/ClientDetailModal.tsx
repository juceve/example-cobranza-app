import React, { useState } from 'react';
import { Client, Loan, Payment, Portfolio } from '../types';
import { pushService } from '../services/pushService';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Bell,
  ShieldCheck,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  portfolio: Portfolio | null;
  loans: Loan[];
  payments: Payment[];
  onOpenPayment: (client: Client, loan: Loan) => void;
  onOpenNewLoan: (client: Client) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  portfolio,
  loans,
  payments,
  onOpenPayment,
  onOpenNewLoan,
}) => {
  const [notificationSentMessage, setNotificationSentMessage] = useState<string | null>(null);

  if (!isOpen || !client) return null;

  const clientLoans = loans.filter((l) => l.clientId === client.id);
  const activeLoan = clientLoans.find((l) => l.status === 'activo') || clientLoans[0];
  const clientPayments = payments.filter((p) => p.clientId === client.id);

  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'al_dia':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" />
            Al Día
          </span>
        );
      case 'en_mora':
        return (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            En Mora
          </span>
        );
      case 'alerta':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            En Alerta
          </span>
        );
      case 'liquidado':
        return (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
            <UserCheck className="w-3 h-3" />
            Liquidado
          </span>
        );
    }
  };

  const handleSendReminderPush = () => {
    if (!activeLoan) return;
    const nextPending = activeLoan.schedule.find((s) => s.status === 'pendiente' || s.status === 'vencida');
    const dueDate = nextPending ? nextPending.dueDate : 'hoy';
    const amt = nextPending ? nextPending.amount : activeLoan.installmentAmount;

    pushService.sendDueDateReminderPush(client, activeLoan, dueDate, amt);
    setNotificationSentMessage(`Push de recordatorio enviado a ${client.name}`);
    setTimeout(() => setNotificationSentMessage(null), 3500);
  };

  const handleSendOverduePush = () => {
    if (!activeLoan) return;
    pushService.sendOverdueNoticePush(client, activeLoan, 4);
    setNotificationSentMessage(`Aviso de mora enviado a ${client.name}`);
    setTimeout(() => setNotificationSentMessage(null), 3500);
  };

  const percentPaid = activeLoan
    ? Math.min(100, Math.round((activeLoan.paidAmount / activeLoan.totalAmount) * 100))
    : 100;

  return (
    <div
      id="client-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="client-detail-modal-container"
        className="relative w-full max-w-2xl bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col my-0 sm:my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
              {client.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm truncate">{client.name}</h3>
                {getStatusBadge(client.status)}
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Doc: {client.documentId} &middot; Cartera: {portfolio?.name || 'Ruta General'}
              </p>
            </div>
          </div>
          <button
            id="close-client-detail-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push feedback alert */}
        {notificationSentMessage && (
          <div className="p-3 bg-blue-50 border-b border-blue-200 text-blue-800 text-xs flex items-center gap-2 animate-in slide-in-from-top duration-150">
            <Bell className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{notificationSentMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-4 max-h-[78vh] overflow-y-auto space-y-4">
          {/* Quick Contact & Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href={`tel:${client.phone}`}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-800 shadow-xs transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Llamar</div>
                <div className="font-bold text-xs truncate">{client.phone}</div>
              </div>
            </a>

            <a
              href={`https://api.whatsapp.com/send?phone=${client.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-800 shadow-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</div>
                <div className="font-bold text-xs text-emerald-700">Chat Directo</div>
              </div>
            </a>

            <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-800 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Score Crediticio</div>
                <div className="font-bold text-slate-900 font-mono">{client.creditScore}/100</div>
              </div>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-800 shadow-xs">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Último Pago</div>
                <div className="font-bold text-slate-800">{client.lastPaymentDate || 'Sin registro'}</div>
              </div>
            </div>
          </div>

          {/* Address and Notes */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span><strong>Dirección:</strong> {client.address} ({client.neighborhood})</span>
            </div>
            {client.notes && (
              <div className="text-slate-500 italic pl-6 text-[11px]">
                &ldquo;{client.notes}&rdquo;
              </div>
            )}
          </div>

          {/* Active Loan Section */}
          {activeLoan ? (
            <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Crédito Activo: {activeLoan.loanNumber}
                  </span>
                  <p className="text-xs text-slate-500">
                    Frecuencia: {activeLoan.frequency.toUpperCase()} &middot; Capital: ${activeLoan.principalAmount} (+{activeLoan.interestRatePercent}% Int)
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Saldo Pendiente</div>
                  <div className="text-xl font-black text-rose-600 font-mono">
                    ${activeLoan.remainingBalance.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>Pagado: ${activeLoan.paidAmount.toFixed(2)}</span>
                  <span>Total: ${activeLoan.totalAmount.toFixed(2)} ({percentPaid}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons for Active Loan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {activeLoan.remainingBalance > 0 ? (
                  <button
                    id="btn-open-cobro-from-detail"
                    onClick={() => onOpenPayment(client, activeLoan)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Cobrar Cuota (${activeLoan.installmentAmount})</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-200 text-slate-500 font-bold text-xs rounded-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Préstamo Liquidado</span>
                  </button>
                )}

                <button
                  id="btn-send-reminder-push"
                  onClick={handleSendReminderPush}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Push Recordatorio</span>
                </button>

                {client.status === 'en_mora' && (
                  <button
                    id="btn-send-overdue-push"
                    onClick={handleSendOverduePush}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Aviso de Mora</span>
                  </button>
                )}
              </div>

              {/* Installments Table / Schedule */}
              <div className="space-y-1.5 pt-2">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Tabla de Cuotas ({activeLoan.schedule.length} Cuotas)</span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {activeLoan.schedule.filter((s) => s.status === 'pagada').length} Pagadas
                  </span>
                </h4>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {activeLoan.schedule.map((item) => {
                    const isPaid = item.status === 'pagada';
                    const isOverdue = item.status === 'vencida';
                    return (
                      <div
                        key={item.installmentNumber}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                          isPaid
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : isOverdue
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-600 text-white'
                                : isOverdue
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {item.installmentNumber}
                          </span>
                          <span className="font-medium">Vence: {item.dueDate}</span>
                        </div>

                        <div className="flex items-center gap-2.5 font-mono">
                          <span className="font-bold">${item.amount.toFixed(2)}</span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600">Este cliente no tiene créditos activos en este momento.</p>
              <button
                onClick={() => onOpenNewLoan(client)}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Otorgar Nuevo Crédito</span>
              </button>
            </div>
          )}

          {/* Payment History */}
          {clientPayments.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Historial Reciente de Cobros ({clientPayments.length})
              </h4>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {clientPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        Recibo #{p.receiptNumber} &middot; ${p.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(p.timestamp).toLocaleString('es-ES')} &middot; {p.paymentMethod.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[11px] text-emerald-700 font-bold">
                        Saldo: ${p.newBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => onOpenNewLoan(client)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear otro crédito</span>
          </button>
          <button
            id="close-client-detail-footer-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
