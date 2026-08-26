import React, { useState } from 'react';
import { PrinterConfig } from '../types';
import { bluetoothPrinter, ESCPOSBuilder } from '../services/bluetoothPrinter';
import { storageService } from '../services/storage';
import { soundEffects } from '../utils/audio';
import {
  X,
  Printer,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Sparkles,
  Zap,
  Building,
  FileText,
  Radio,
} from 'lucide-react';

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PrinterConfig;
  onConfigUpdated: (newConfig: PrinterConfig) => void;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
}) => {
  const [form, setForm] = useState<PrinterConfig>({ ...config });
  const [isConnecting, setIsConnecting] = useState(false);
  const [testPrintStatus, setTestPrintStatus] = useState<string | null>(null);
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScanBluetooth = async () => {
    setIsConnecting(true);
    setBluetoothError(null);
    setTestPrintStatus(null);

    const res = await bluetoothPrinter.connectBluetooth();
    setIsConnecting(false);

    if (res.success) {
      const updated: PrinterConfig = {
        ...form,
        deviceName: res.deviceName || 'Impresora Bluetooth 58mm',
        isConnected: true,
        connectionType: 'bluetooth',
      };
      setForm(updated);
      onConfigUpdated(updated);
      storageService.savePrinterConfig(updated);
      setTestPrintStatus(`¡Conectado exitosamente a ${res.deviceName}!`);
    } else {
      setBluetoothError(res.error || 'No se pudo conectar a la impresora Bluetooth');
    }
  };

  const handleDisconnect = async () => {
    await bluetoothPrinter.disconnect();
    const updated: PrinterConfig = {
      ...form,
      isConnected: false,
    };
    setForm(updated);
    onConfigUpdated(updated);
    storageService.savePrinterConfig(updated);
  };

  const handleTestPrint = async () => {
    soundEffects.playPrinterBuzz();
    setTestPrintStatus('Imprimiendo ticket de prueba en formato ESC/POS...');

    const builder = new ESCPOSBuilder(form.paperSize);
    builder
      .align('center')
      .bold(true)
      .size('double_h')
      .line(form.businessName || 'COBROMOVIL POS')
      .size('normal')
      .bold(false)
      .line(form.taxId || 'NIT 10203040')
      .divider('=')
      .line('** TEST DE IMPRESION BLUETOOTH **')
      .line(`Ancho de papel: ${form.paperSize}`)
      .line(`Fecha: ${new Date().toLocaleString('es-ES')}`)
      .divider('-')
      .twoColumns('ESTADO CONEXION:', 'EN LINEA')
      .twoColumns('PROTOCOLO:', 'ESC/POS RAW')
      .divider('=')
      .line(form.receiptFooter || 'Sistema de Cobranza Móvil')
      .feed(4)
      .cut();

    const bytes = builder.getUint8Array();
    const res = await bluetoothPrinter.printRawBytes(bytes);

    setTestPrintStatus(res.message);
    setTimeout(() => setTestPrintStatus(null), 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigUpdated(form);
    storageService.savePrinterConfig(form);
    onClose();
  };

  return (
    <div
      id="printer-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="printer-settings-modal-container"
        className="relative w-full max-w-lg bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col my-0 sm:my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Configuración Impresora Térmica
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Bluetooth ESC/POS &middot; Formato de Tickets
              </p>
            </div>
          </div>
          <button
            id="close-printer-settings-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto flex-1 pb-6">
          {bluetoothError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{bluetoothError}</span>
            </div>
          )}

          {testPrintStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
              <span>{testPrintStatus}</span>
            </div>
          )}

          {/* Bluetooth Connection Control Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
                  <Bluetooth className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Dispositivo Térmico</div>
                  <div className="text-[11px] text-slate-500">{form.deviceName}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {form.isConnected ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Vinculada
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
                    Desconectada
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                id="btn-scan-bluetooth-device"
                onClick={handleScanBluetooth}
                disabled={isConnecting}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Radio className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Buscando BT...' : 'Escanear Bluetooth'}</span>
              </button>

              <button
                type="button"
                id="btn-test-print"
                onClick={handleTestPrint}
                className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Imprimir Test</span>
              </button>
            </div>
          </div>

          {/* Paper Size Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Ancho de Papel Térmico
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '58mm', label: '58 mm (Estándar Móvil)', desc: '32 caracteres / línea' },
                { id: '80mm', label: '80 mm (Ancho POS)', desc: '48 caracteres / línea' },
              ].map((size) => {
                const active = form.paperSize === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    id={`paper-size-${size.id}`}
                    onClick={() => setForm({ ...form, paperSize: size.id as any })}
                    className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{size.label}</div>
                    <div className="text-[10px] text-slate-500">{size.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Business Details for Header */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>Membrete del Recibo</span>
            </h4>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Razón Social / Nombre del Negocio</label>
              <input
                id="printer-biz-name"
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">NIT / RUC / Doc Fiscal</label>
                <input
                  id="printer-tax-id"
                  type="text"
                  value={form.taxId}
                  onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">Teléfono Contacto</label>
                <input
                  id="printer-phone"
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Dirección Principal</label>
              <input
                id="printer-address"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">Mensaje de Pie de Página</label>
              <input
                id="printer-footer-msg"
                type="text"
                value={form.receiptFooter}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              />
            </div>
          </div>

          {/* Auto Print Checkbox */}
          <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              id="printer-autoprint-check"
              checked={form.autoPrintAfterPayment}
              onChange={(e) => setForm({ ...form, autoPrintAfterPayment: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-0"
            />
            <span className="text-xs text-slate-700">
              Abrir automáticamente el recibo e imprimir al completar un cobro
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            id="btn-save-printer-config"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </form>
      </div>
    </div>
  );
};
