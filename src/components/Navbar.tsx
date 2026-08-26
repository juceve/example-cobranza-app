import React from 'react';
import { ActiveTab, DeviceViewMode, PrinterConfig } from '../types';
import {
  Users,
  Wallet,
  Bell,
  Printer,
  RefreshCw,
  Code2,
  Wifi,
  WifiOff,
  Smartphone,
  Tablet,
  Monitor,
  Radio,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  deviceMode: DeviceViewMode;
  onSelectDeviceMode: (mode: DeviceViewMode) => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingSyncCount: number;
  printerConfig: PrinterConfig;
  onOpenPrinterSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  deviceMode,
  onSelectDeviceMode,
  isOnline,
  isSimulatedOffline,
  pendingSyncCount,
  printerConfig,
  onOpenPrinterSettings,
}) => {
  const effectiveOnline = isOnline && !isSimulatedOffline;

  const navItems = [
    { id: 'cartera', label: 'Cartera de Deudores', icon: Users },
    { id: 'caja', label: 'Cierre de Caja', icon: Wallet },
    { id: 'notificaciones', label: 'Alertas Push', icon: Bell },
    { id: 'sincronizacion', label: 'Sincronización Offline', icon: RefreshCw, badge: pendingSyncCount > 0 ? pendingSyncCount : undefined },
    { id: 'impresora', label: 'Impresora Térmica', icon: Printer },
    { id: 'codigo_flutter', label: 'Código Flutter', icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A] border-b border-slate-800 shadow-md">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & App Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-950">
            CM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-base tracking-tight">
                CobroMóvil
              </h1>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-md border border-blue-500/30 uppercase tracking-wider">
                Flutter POS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Gestión de carteras, cobros en tiempo real, recibos térmicos y modo offline
            </p>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bluetooth Printer Badge */}
          <button
            id="navbar-printer-status-btn"
            onClick={onOpenPrinterSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              printerConfig.isConnected
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Configuración de Impresora Bluetooth ESC/POS"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {printerConfig.isConnected ? `BT ${printerConfig.paperSize}` : 'Sin Impresora'}
            </span>
          </button>

          {/* Online/Offline Status Pill */}
          <button
            id="navbar-sync-status-btn"
            onClick={() => onSelectTab('sincronizacion')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              effectiveOnline
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse'
            }`}
          >
            {effectiveOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {effectiveOnline ? 'Online' : 'Offline'}
            </span>
            {pendingSyncCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                {pendingSyncCount}
              </span>
            )}
          </button>

          {/* Device Frame View Switcher */}
          <div className="hidden lg:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              id="device-mode-responsive"
              onClick={() => onSelectDeviceMode('responsive')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                deviceMode === 'responsive' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Completa Responsive"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              id="device-mode-tablet"
              onClick={() => onSelectDeviceMode('tablet')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                deviceMode === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Tablet POS (840px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              id="device-mode-mobile"
              onClick={() => onSelectDeviceMode('mobile')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                deviceMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Celular (390px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Header (Visible on tablet and desktop, mobile uses bottom nav) */}
      <div className="hidden sm:block border-t border-slate-800/80 bg-slate-950/80 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`navbar-tab-${item.id}`}
                onClick={() => onSelectTab(item.id as ActiveTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
