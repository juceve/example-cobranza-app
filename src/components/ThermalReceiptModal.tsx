import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Payment, Loan, Client, PrinterConfig } from '../types';
import { bluetoothPrinter } from '../services/bluetoothPrinter';
import { pushService } from '../services/pushService';
import {
  Printer,
  Share2,
  Download,
  CheckCircle2,
  X,
  Smartphone,
  Copy,
  WifiOff,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  client: Client | null;
  loan: Loan | null;
  printerConfig: PrinterConfig;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  client,
  loan,
  printerConfig,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && payment && client) {
      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#6366f1', '#f59e0b'],
        });
      } catch {
        // Ignore
      }

      // Generate QR Code containing fiscal verification payload
      const qrPayload = JSON.stringify({
        recibo: payment.receiptNumber,
        cliente: client.name,
        doc: client.documentId,
        monto: payment.amount,
        saldo: payment.newBalance,
        fecha: payment.timestamp,
        verif: `AUTH-${payment.id.toUpperCase()}`,
      });

      QRCode.toDataURL(qrPayload, { width: 140, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
        .then((url: string) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, payment, client]);

  if (!isOpen || !payment || !client || !loan) return null;

  const handlePrintBluetooth = async () => {
    setIsPrinting(true);
    setPrintStatusMessage('Generando comandos ESC/POS y enviando a impresora...');

    const bytes = bluetoothPrinter.buildReceiptCommands(payment, client, loan, printerConfig);
    const result = await bluetoothPrinter.printRawBytes(bytes);

    setIsPrinting(false);
    setPrintStatusMessage(result.message);

    setTimeout(() => {
      setPrintStatusMessage(null);
    }, 4000);
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const url = pushService.generateWhatsAppShareUrl(client, payment, printerConfig.businessName);
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = `*COMPROBANTE DE PAGO #${payment.receiptNumber}*\n` +
      `Cliente: ${client.name}\n` +
      `Monto: $${payment.amount.toFixed(2)}\n` +
      `Fecha: ${new Date(payment.timestamp).toLocaleString('es-ES')}\n` +
      `Nuevo Saldo: $${payment.newBalance.toFixed(2)}\n` +
      `Cobrador: ${payment.collectorName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const is58mm = printerConfig.paperSize === '58mm';

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="receipt-modal-container"
        className="relative w-full max-w-lg bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col my-0 sm:my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Recibo Térmico Bluetooth
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Formato ESC/POS ({printerConfig.paperSize}) &middot; #{payment.receiptNumber}
              </p>
            </div>
          </div>
          <button
            id="close-receipt-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 pb-6">
          {/* Status Message Alert if any */}
          {printStatusMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs flex items-center gap-2 animate-in slide-in-from-top duration-150">
              <Zap className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
              <span>{printStatusMessage}</span>
            </div>
          )}

          {/* Realistic Paper Thermal Ticket */}
          <div className="flex justify-center">
            <div
              ref={ticketRef}
              id="printable-ticket"
              style={{ width: is58mm ? '280px' : '340px' }}
              className="bg-white text-slate-950 p-4 rounded-t-sm shadow-md font-mono text-[11px] leading-tight border border-slate-200 border-t-4 border-t-slate-400 relative select-none"
            >
              {/* Jagged / Sawtooth top indicator */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
                <div className="font-extrabold text-sm tracking-wider uppercase text-slate-900">
                  {printerConfig.businessName}
                </div>
                <div className="text-[10px] text-slate-600">
                  {printerConfig.taxId}
                </div>
                <div className="text-[10px] text-slate-600">
                  {printerConfig.address}
                </div>
                <div className="text-[10px] text-slate-600">
                  Tel: {printerConfig.phone}
                </div>
                <div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                  {printerConfig.receiptHeader}
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="py-2 space-y-1 border-b border-dashed border-slate-300 text-[10px]">
                <div className="flex justify-between">
                  <span className="font-bold">RECIBO N°:</span>
                  <span className="font-extrabold text-slate-900">#{payment.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>FECHA:</span>
                  <span>{new Date(payment.timestamp).toLocaleString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>COBRADOR:</span>
                  <span className="font-medium text-slate-900">{payment.collectorName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>MÉTODO:</span>
                  <span className="font-bold uppercase text-slate-900">{payment.paymentMethod}</span>
                </div>
                {payment.isOfflineSync && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>MODO:</span>
                    <span>OFFLINE (Auto-Sync)</span>
                  </div>
                )}
              </div>

              {/* Debtor Details */}
              <div className="py-2 space-y-1 border-b border-dashed border-slate-300 text-[10px]">
                <div className="font-bold text-[11px] text-slate-900">DATOS DEL CLIENTE:</div>
                <div className="truncate font-bold text-slate-900">{client.name}</div>
                <div className="flex justify-between text-slate-600">
                  <span>Doc/DNI:</span>
                  <span className="text-slate-900">{client.documentId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Teléfono:</span>
                  <span className="text-slate-900">{client.phone}</span>
                </div>
                <div className="truncate text-slate-500 text-[9px]">{client.address}</div>
              </div>

              {/* Financial Balance & Installments Breakdown */}
              <div className="py-2.5 space-y-1.5 border-b-2 border-slate-800">
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Crédito N°:</span>
                  <span className="font-semibold text-slate-900">{loan.loanNumber}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Saldo Anterior:</span>
                  <span className="text-slate-900 font-mono">${payment.previousBalance.toFixed(2)}</span>
                </div>

                {/* Big Paid Box */}
                <div className="my-1 py-1.5 px-2 bg-slate-50 rounded border border-slate-200 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Total Recibido</div>
                  <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
                    ${payment.amount.toFixed(2)}
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Cuotas aplicadas:</span>
                  <span className="font-bold text-slate-900">#{payment.installmentsCovered.join(', #')}</span>
                </div>

                <div className="flex justify-between text-[11px] font-extrabold pt-1 border-t border-dotted border-slate-300">
                  <span>NUEVO SALDO:</span>
                  <span className="text-emerald-700 font-mono">${payment.newBalance.toFixed(2)}</span>
                </div>
              </div>

              {/* QR Code and Footer */}
              <div className="pt-2 text-center space-y-1.5">
                {qrDataUrl && (
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src={qrDataUrl}
                      alt="QR Verificación"
                      className="w-20 h-20 border border-slate-200 p-0.5 rounded"
                    />
                    <span className="text-[8px] text-slate-500 mt-0.5">
                      Escanee para verificar autenticidad
                    </span>
                  </div>
                )}

                <div className="text-[9px] text-slate-600 italic">
                  {printerConfig.receiptFooter}
                </div>
                <div className="text-[8px] text-slate-400 tracking-wider uppercase font-semibold">
                  *** COBROMÓVIL APP v2.4 ***
                </div>

                {/* Jagged bottom edge representation */}
                <div className="w-full flex justify-between text-slate-300 text-[10px] overflow-hidden pt-1">
                  <span>▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="btn-print-bluetooth-thermal"
              onClick={handlePrintBluetooth}
              disabled={isPrinting}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Printer className={`w-4 h-4 ${isPrinting ? 'animate-bounce' : ''}`} />
              <span>{isPrinting ? 'Imprimiendo...' : 'Imprimir BT Térmica'}</span>
            </button>

            <button
              id="btn-share-receipt-whatsapp"
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </button>

            <button
              id="btn-print-native-receipt"
              onClick={handleNativePrint}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              id="btn-copy-receipt-text"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="close-receipt-modal-footer-btn"
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
