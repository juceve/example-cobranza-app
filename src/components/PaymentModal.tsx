import React, { useState, useEffect, useRef } from 'react';
import { Client, Loan, Payment, PaymentMethod } from '../types';
import { soundEffects } from '../utils/audio';
import {
  X,
  DollarSign,
  CreditCard,
  QrCode,
  MapPin,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  WifiOff,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  loan: Loan | null;
  isOffline: boolean;
  onPaymentSuccess: (
    payment: Payment,
    updatedLoan: Loan,
    updatedClient: Client
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  client,
  loan,
  isOffline,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState<string>('');
  const [collectorName] = useState<string>('Carlos Mendoza (Cobrador 01)');
  const [gpsCaptured, setGpsCaptured] = useState<boolean>(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hasSignature, setHasSignature] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Set default amount to 1 installment when opened
  useEffect(() => {
    if (isOpen && loan) {
      const defaultAmt = Math.min(loan.installmentAmount, loan.remainingBalance);
      setAmount(defaultAmt);
      setNotes('');
      setErrorMessage(null);
      setHasSignature(false);

      // Attempt to get device GPS location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsCaptured(true);
          },
          () => {
            // Simulated default route coordinates
            setCoords({ lat: -17.7832, lng: -63.1821 });
            setGpsCaptured(true);
          },
          { timeout: 4000 }
        );
      }
    }
  }, [isOpen, loan]);

  // Clean signature canvas on modal open
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isOpen]);

  if (!isOpen || !client || !loan) return null;

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2563eb';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handlePresetClick = (presetValue: number) => {
    setAmount(Math.min(presetValue, loan.remainingBalance));
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMessage('El monto a cobrar debe ser mayor a $0.00');
      return;
    }
    if (amount > loan.remainingBalance) {
      setErrorMessage(`El monto no puede exceder el saldo restante ($${loan.remainingBalance.toFixed(2)})`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Get signature image if drawn
      let sigBase64: string | undefined = undefined;
      if (canvasRef.current && hasSignature) {
        sigBase64 = canvasRef.current.toDataURL('image/png');
      }

      // Play POS success sound
      soundEffects.playPaymentSuccess();

      // Dynamic import or direct call to storage
      const { storageService } = await import('../services/storage');
      const { payment, updatedLoan, updatedClient } = storageService.recordPayment(
        loan.id,
        amount,
        paymentMethod,
        collectorName,
        notes,
        sigBase64,
        isOffline,
        coords || undefined
      );

      // Trigger push notification to client
      const { pushService } = await import('../services/pushService');
      pushService.sendPaymentReceiptPush(updatedClient, payment, updatedLoan);

      setIsSubmitting(false);
      onPaymentSuccess(payment, updatedLoan, updatedClient);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Error al procesar el pago');
    }
  };

  const remainingAfterPayment = Math.max(0, loan.remainingBalance - amount);

  return (
    <div
      id="payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="payment-modal-container"
        className="relative w-full max-w-lg bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col my-0 sm:my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Registrar Cobro en Ruta
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Crédito {loan.loanNumber} &middot; {loan.frequency.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            id="close-payment-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Offline Badge if active */}
        {isOffline && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-amber-900 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Modo Offline: Guardado local con auto-sincronización.</span>
            </div>
            <span className="font-mono text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded uppercase">AUTO-SYNC</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1 pb-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Client & Debt Overview Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Deudor</div>
                <div className="font-bold text-slate-900 text-xs">{client.name}</div>
                <div className="text-[11px] text-slate-500">DNI: {client.documentId} &middot; Tel: {client.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500">Saldo Pendiente</div>
                <div className="text-base font-black text-rose-600 font-mono">
                  ${loan.remainingBalance.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-200 flex justify-between text-[11px] text-slate-600 font-medium">
              <span>Valor por Cuota: <strong className="text-emerald-700 font-mono">${loan.installmentAmount.toFixed(2)}</strong></span>
              <span>Cuotas: {loan.schedule.filter(s => s.status === 'pagada').length}/{loan.installmentsCount}</span>
            </div>
          </div>

          {/* Amount Selection & Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Monto a Cobrar ($)
            </label>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                id="preset-1-installment"
                onClick={() => handlePresetClick(loan.installmentAmount)}
                className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-colors cursor-pointer min-h-[38px] ${
                  amount === loan.installmentAmount
                    ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                1 Cuota (${loan.installmentAmount})
              </button>

              <button
                type="button"
                id="preset-2-installments"
                onClick={() => handlePresetClick(loan.installmentAmount * 2)}
                className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-colors cursor-pointer min-h-[38px] ${
                  amount === loan.installmentAmount * 2
                    ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                2 Cuotas (${loan.installmentAmount * 2})
              </button>

              <button
                type="button"
                id="preset-half-balance"
                onClick={() => handlePresetClick(Math.round(loan.remainingBalance / 2))}
                className="py-2 px-2 text-center rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer min-h-[38px]"
              >
                50% Saldo
              </button>

              <button
                type="button"
                id="preset-full-balance"
                onClick={() => handlePresetClick(loan.remainingBalance)}
                className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-colors cursor-pointer min-h-[38px] ${
                  amount === loan.remainingBalance
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                    : 'bg-white text-emerald-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Liquidar Todo
              </button>
            </div>

            {/* Custom Amount Input */}
            <div className="relative mt-1.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                $
              </span>
              <input
                id="payment-amount-input"
                type="number"
                step="0.5"
                min="0.5"
                max={loan.remainingBalance}
                value={amount || ''}
                onChange={(e) => {
                  setAmount(parseFloat(e.target.value) || 0);
                  setErrorMessage(null);
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-white border-2 border-blue-500/80 rounded-lg text-xl font-black text-slate-900 font-mono focus:outline-none focus:border-blue-600 shadow-xs"
                required
              />
            </div>

            {/* Balance Preview */}
            <div className="flex justify-between items-center text-[11px] text-slate-500 px-1 pt-0.5">
              <span>Nuevo saldo tras cobro:</span>
              <span className="font-bold text-emerald-700 font-mono text-xs">
                ${remainingAfterPayment.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Método de Cobro
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                { id: 'transferencia', label: 'Transferencia', icon: CreditCard },
                { id: 'movil', label: 'QR / Móvil', icon: QrCode },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    id={`method-${m.id}`}
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GPS Capture Indicator */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Geo-Posición GPS de Cobro</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Capturando GPS...'}
            </span>
          </div>

          {/* Optional Signature Pad */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-blue-600" />
                <span>Firma Digital del Cliente (Opcional)</span>
              </label>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Limpiar firma
                </button>
              )}
            </div>
            <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden relative touch-none">
              <canvas
                ref={canvasRef}
                width={400}
                height={85}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[80px] cursor-crosshair block bg-white"
              />
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs italic">
                  Presione y dibuje la firma aquí...
                </div>
              )}
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Observaciones del Cobrador (Opcional)
            </label>
            <input
              id="payment-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Pagó cuota completa, próxima visita martes 9am..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-confirm-payment"
            disabled={isSubmitting || amount <= 0}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Registrando pago y generando recibo...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Cobrar ${amount.toFixed(2)} y Emitir Recibo BT</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
