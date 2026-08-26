import React, { useState } from 'react';
import { Payment, Client, Loan, PrinterConfig } from '../types';
import { bluetoothPrinter, ESCPOSBuilder } from '../services/bluetoothPrinter';
import { soundEffects } from '../utils/audio';
import {
  Wallet,
  DollarSign,
  Printer,
  Calendar,
  Users,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Download,
} from 'lucide-react';

interface DailyCashRegisterProps {
  payments: Payment[];
  clients: Client[];
  loans: Loan[];
  printerConfig: PrinterConfig;
  onReprintReceipt: (payment: Payment) => void;
}

export const DailyCashRegister: React.FC<DailyCashRegisterProps> = ({
  payments,
  clients,
  loans,
  printerConfig,
  onReprintReceipt,
}) => {
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  // Filter payments done today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter((p) => p.timestamp.startsWith(todayStr));

  const totalCollectedToday = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCash = todayPayments
    .filter((p) => p.paymentMethod === 'efectivo')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalDigital = todayPayments
    .filter((p) => p.paymentMethod === 'transferencia' || p.paymentMethod === 'movil')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeLoans = loans.filter((l) => l.status === 'activo');
  const expectedDailyTarget = activeLoans.reduce((sum, l) => sum + l.installmentAmount, 0) || 500;
  const percentageAchieved = Math.min(100, Math.round((totalCollectedToday / expectedDailyTarget) * 100));

  const handlePrintDailyClosure = async () => {
    soundEffects.playPrinterBuzz();
    setPrintStatus('Imprimiendo reporte de cierre de caja en térmica...');

    const builder = new ESCPOSBuilder(printerConfig.paperSize);
    builder
      .align('center')
      .bold(true)
      .size('double_h')
      .line(printerConfig.businessName || 'SISTEMA DE COBRANZAS')
      .size('normal')
      .bold(false)
      .line(printerConfig.taxId)
      .line(`Fecha: ${new Date().toLocaleDateString('es-ES')}`)
      .line(`Hora: ${new Date().toLocaleTimeString('es-ES')}`)
      .divider('=')
      .size('double_h')
      .bold(true)
      .line('CIERRE DIARIO DE CAJA')
      .size('normal')
      .bold(false)
      .divider('-')
      .align('left')
      .twoColumns('COBRADOR:', 'Carlos Mendoza')
      .twoColumns('TOTAL COBROS REGISTRADOS:', `${todayPayments.length} Recibos`)
      .divider('.')
      .size('double_h')
      .bold(true)
      .twoColumns('TOTAL RECAUDADO:', `$ ${totalCollectedToday.toFixed(2)}`)
      .size('normal')
      .bold(false)
      .divider('.')
      .twoColumns('Total Efectivo:', `$ ${totalCash.toFixed(2)}`)
      .twoColumns('Total Digital/QR/Transf:', `$ ${totalDigital.toFixed(2)}`)
      .twoColumns('Meta de Cobro del Dia:', `$ ${expectedDailyTarget.toFixed(2)}`)
      .twoColumns('Cumplimiento de Meta:', `${percentageAchieved}%`)
      .divider('-')
      .bold(true)
      .line('DETALLE DE RECIBOS EMITIDOS:')
      .bold(false);

    todayPayments.forEach((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      const cName = client ? client.name.slice(0, 14) : 'Cliente';
      builder.twoColumns(`#${p.receiptNumber} ${cName}`, `$ ${p.amount.toFixed(2)}`);
    });

    builder
      .divider('=')
      .align('center')
      .line('FIRMA CONFORMIDAD COBRADOR')
      .feed(2)
      .line('___________________________')
      .line('Carlos Mendoza (Cobrador 01)')
      .feed(3)
      .cut();

    const bytes = builder.getUint8Array();
    const res = await bluetoothPrinter.printRawBytes(bytes);
    setPrintStatus(res.message);
    setTimeout(() => setPrintStatus(null), 4000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header with Title and Print Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cierre y Cuadre de Caja del Día
            </h2>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-print-daily-closure-thermal"
            onClick={handlePrintDailyClosure}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer w-full sm:w-auto min-h-[42px]"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Imprimir Cierre en Térmica</span>
          </button>
        </div>
      </div>

      {printStatus && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{printStatus}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Total Recaudado */}
        <div className="p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase tracking-wider truncate">
            <span className="truncate">Recaudado Hoy</span>
            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 font-mono tracking-tight truncate">
            ${totalCollectedToday.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{todayPayments.length} pagos registrados</span>
          </div>
        </div>

        {/* Efectivo */}
        <div className="p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase tracking-wider truncate">
            <span className="truncate">Efectivo en Mano</span>
            <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight truncate">
            ${totalCash.toFixed(2)}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 truncate">
            {todayPayments.filter((p) => p.paymentMethod === 'efectivo').length} transacciones
          </div>
        </div>

        {/* Digital / Transferencias */}
        <div className="p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase tracking-wider truncate">
            <span className="truncate">Transf. / QR</span>
            <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight truncate">
            ${totalDigital.toFixed(2)}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 truncate">
            {todayPayments.filter((p) => p.paymentMethod !== 'efectivo').length} transacciones
          </div>
        </div>

        {/* Meta Diaria */}
        <div className="p-3 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase tracking-wider truncate">
            <span className="truncate">Meta del Día</span>
            <span className="font-bold text-blue-600 font-mono">{percentageAchieved}%</span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono tracking-tight truncate">
            ${expectedDailyTarget.toFixed(2)}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${percentageAchieved}%` }}
            />
          </div>
        </div>
      </div>

      {/* List of Payments Registered Today */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Detalle de Cobros del Día ({todayPayments.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Ordenados por hora de cobro</span>
        </div>

        {todayPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Wallet className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-700">Aún no se han registrado cobros el día de hoy.</p>
            <p className="text-xs text-slate-500">
              Ve a la pestaña Cartera de Deudores para registrar abonos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayPayments.map((p) => {
              const client = clients.find((c) => c.id === p.clientId);
              return (
                <div
                  key={p.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
                      {client?.name ? client.name.charAt(0) : 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {client?.name || 'Cliente'}
                        </span>
                        <span className="text-xs font-mono text-blue-600 font-semibold">
                          #{p.receiptNumber}
                        </span>
                        {p.isOfflineSync && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-bold uppercase">
                            OFFLINE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{new Date(p.timestamp).toLocaleTimeString('es-ES')}</span>
                        <span>&middot;</span>
                        <span className="capitalize">{p.paymentMethod}</span>
                        <span>&middot;</span>
                        <span>Cuota(s): #{p.installmentsCovered.join(', #')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600 font-mono">
                        +${p.amount.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Saldo: ${p.newBalance.toFixed(2)}
                      </div>
                    </div>

                    <button
                      id={`btn-reprint-receipt-${p.id}`}
                      onClick={() => onReprintReceipt(p)}
                      title="Ver e Imprimir Recibo Térmico"
                      className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 shadow-xs transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
