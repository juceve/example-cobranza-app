import React, { useState, useEffect } from 'react';
import { Client, Loan, PushNotificationRecord } from '../types';
import { pushService } from '../services/pushService';
import {
  Bell,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Smartphone,
  Sparkles,
  User,
  ShieldAlert,
} from 'lucide-react';

interface PushNotificationCenterProps {
  clients: Client[];
  loans: Loan[];
}

export const PushNotificationCenter: React.FC<PushNotificationCenterProps> = ({
  clients,
  loans,
}) => {
  const [history, setHistory] = useState<PushNotificationRecord[]>(pushService.getHistory());
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [template, setTemplate] = useState<string>('recordatorio');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for new push dispatches
    const unsubscribe = pushService.addListener((rec) => {
      setHistory(pushService.getHistory());
    });

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }

    return () => unsubscribe();
  }, []);

  // Update title & body when template or client changes
  useEffect(() => {
    const client = clients.find((c) => c.id === selectedClientId);
    const clientName = client ? client.name : 'Cliente';
    const clientLoan = loans.find((l) => l.clientId === selectedClientId);
    const cuota = clientLoan ? `$${clientLoan.installmentAmount.toFixed(2)}` : '$50.00';

    if (template === 'recordatorio') {
      setTitle(`⏰ Recordatorio de Cuota`);
      setBody(`Hola ${clientName}, le recordamos que su cuota diaria de ${cuota} vence hoy. ¡Evite cargos por mora!`);
    } else if (template === 'mora') {
      setTitle(`⚠️ Aviso Urgente de Saldo Vencido`);
      setBody(`Estimado(a) ${clientName}, presenta atraso en sus cuotas de crédito. Por favor reciba al cobrador asignado.`);
    } else if (template === 'ampliacion') {
      setTitle(`🎉 ¡Califica para Aumento de Crédito!`);
      setBody(`Estimado(a) ${clientName}, por su excelente historial de pago puede solicitar una ampliación de hasta $2,500 hoy mismo.`);
    } else if (template === 'personalizado') {
      setTitle(`Notificación CobroMóvil`);
      setBody(`Hola ${clientName}, `);
    }
  }, [template, selectedClientId, clients, loans]);

  const handleRequestPermission = async () => {
    const granted = await pushService.requestPermission();
    setPermissionGranted(granted);
    if (granted) {
      setFeedbackMessage('¡Permisos de Notificaciones Push activados en el navegador!');
    } else {
      setFeedbackMessage('Permiso denegado o no disponible en este navegador.');
    }
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client || !title.trim() || !body.trim()) return;

    pushService.sendPushToClient(
      client,
      title,
      body,
      template === 'mora' ? 'mora' : template === 'recordatorio' ? 'recordatorio' : 'bienvenida',
      'fcm_push'
    );

    setFeedbackMessage(`Push enviado con éxito al dispositivo de ${client.name}`);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Centro de Notificaciones Push a Clientes
            </h2>
            <p className="text-xs text-slate-500">
              Alertas en tiempo real, recordatorios de vencimiento y avisos de cobro
            </p>
          </div>
        </div>

        <div>
          {!permissionGranted ? (
            <button
              id="btn-request-browser-push-perm"
              onClick={handleRequestPermission}
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Activar Push en Navegador</span>
            </button>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Push Web Activo
            </span>
          )}
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Grid: Composer & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Composer Form (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>Enviar Notificación Directa</span>
          </h3>

          <form onSubmit={handleSendPush} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Seleccionar Deudor Destinatario
              </label>
              <select
                id="select-push-client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - Saldo: ${c.currentBalance}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Plantilla Rápida
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'recordatorio', label: 'Recordatorio Cuota' },
                  { id: 'mora', label: 'Aviso de Mora' },
                  { id: 'ampliacion', label: 'Promoción Crédito' },
                  { id: 'personalizado', label: 'Personalizado' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`py-1.5 px-2.5 rounded-lg border text-xs font-medium text-left transition-colors cursor-pointer ${
                      template === t.id
                        ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Título del Push
              </label>
              <input
                id="push-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Mensaje de Notificación
              </label>
              <textarea
                id="push-body-textarea"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                required
              />
            </div>

            <button
              type="submit"
              id="btn-dispatch-push"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enviar Notificación Push en Tiempo Real</span>
            </button>
          </form>
        </div>

        {/* Real-time Push Dispatch Log (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Registro de Notificaciones Entregadas ({history.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">FCM / In-App Push</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Bell className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-700">Aún no se han enviado notificaciones push.</p>
              </div>
            ) : (
              history.map((item) => {
                const isPayment = item.type === 'pago';
                const isOverdue = item.type === 'mora';
                return (
                  <div
                    key={item.id}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isPayment
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : isOverdue
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}
                      >
                        {isPayment ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isOverdue ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {item.title}
                          </span>
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold uppercase tracking-wider">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.body}
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                          <span className="font-semibold text-slate-700">👤 {item.clientName}</span>
                          <span>&middot;</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString('es-ES')}</span>
                          {item.receiptNumber && (
                            <>
                              <span>&middot;</span>
                              <span className="text-blue-600 font-mono font-semibold">#{item.receiptNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
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
