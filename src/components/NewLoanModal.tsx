import React, { useState } from 'react';
import { Client, Loan, PaymentFrequency } from '../types';
import { storageService } from '../services/storage';
import {
  X,
  CreditCard,
  Calculator,
  Calendar,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  initialClient?: Client | null;
  onLoanCreated: (newLoan: Loan) => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialClient,
  onLoanCreated,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClient ? initialClient.id : clients[0]?.id || ''
  );
  const [principal, setPrincipal] = useState<number>(1000);
  const [interestPercent, setInterestPercent] = useState<number>(20);
  const [installments, setInstallments] = useState<number>(24);
  const [frequency, setFrequency] = useState<PaymentFrequency>('diario');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalInterest = principal * (interestPercent / 100);
  const totalAmount = principal + totalInterest;
  const installmentAmount = installments > 0 ? Math.round((totalAmount / installments) * 100) / 100 : 0;

  // Calculate estimated end date
  const now = new Date();
  if (frequency === 'diario') now.setDate(now.getDate() + installments);
  else if (frequency === 'semanal') now.setDate(now.getDate() + installments * 7);
  else if (frequency === 'quincenal') now.setDate(now.getDate() + installments * 15);
  else if (frequency === 'mensual') now.setMonth(now.getMonth() + installments);
  const estimatedEndDate = now.toLocaleDateString('es-ES');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Seleccione un cliente para otorgar el crédito');
      return;
    }
    if (principal <= 0) {
      setError('El capital prestado debe ser mayor a 0');
      return;
    }
    if (installments <= 0) {
      setError('El número de cuotas debe ser al menos 1');
      return;
    }

    try {
      const newLoan = storageService.createNewLoan(
        selectedClientId,
        principal,
        interestPercent,
        installments,
        frequency
      );
      onLoanCreated(newLoan);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creando el préstamo');
    }
  };

  return (
    <div
      id="new-loan-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="new-loan-modal-container"
        className="relative w-full max-w-lg bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col my-0 sm:my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Nuevo Crédito / Préstamo
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Generador de amortizaciones y tabla de cuotas
              </p>
            </div>
          </div>
          <button
            id="close-new-loan-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1 pb-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Cliente Beneficiario
            </label>
            <select
              id="select-loan-client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Doc: {c.documentId}) - Saldo Actual: ${c.currentBalance}
                </option>
              ))}
            </select>
          </div>

          {/* Capital & Interest Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Capital Inicial ($)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="loan-principal-input"
                  type="number"
                  step="50"
                  min="50"
                  value={principal || ''}
                  onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Tasa de Interés (%)
              </label>
              <div className="relative">
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="loan-interest-input"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={interestPercent || ''}
                  onChange={(e) => setInterestPercent(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Frequency & Installments Count */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Frecuencia de Cobro
              </label>
              <select
                id="loan-frequency-select"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs capitalize"
              >
                <option value="diario">Diario (Lunes a Sábado)</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Cantidad de Cuotas
              </label>
              <input
                id="loan-installments-input"
                type="number"
                min="1"
                max="365"
                value={installments || ''}
                onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Live Loan Calculation Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5" />
              <span>Cálculo Automático del Crédito</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Intereses</span>
                <span className="text-xs font-bold text-blue-700 font-mono">${totalInterest.toFixed(2)}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Monto Total a Cobrar</span>
                <span className="text-xs font-black text-slate-900 font-mono">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-xs text-emerald-800 font-bold block">
                  Valor por Cuota ({frequency})
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {installments} pagos hasta {estimatedEndDate}
                </span>
              </div>
              <span className="text-lg font-black text-emerald-700 font-mono">
                ${installmentAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="btn-confirm-create-loan"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Generar y Activar Crédito</span>
          </button>
        </form>
      </div>
    </div>
  );
};
