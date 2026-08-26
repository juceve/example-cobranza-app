import React, { useState, useEffect } from 'react';
import { syncEngine } from '../services/syncEngine';
import { storageService } from '../services/storage';
import { SyncQueueItem } from '../types';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  Zap,
  Server,
} from 'lucide-react';

export const OfflineSyncCenter: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(syncEngine.getIsOnline());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(syncEngine.getSimulatedOffline());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queue, setQueue] = useState<SyncQueueItem[]>(storageService.getSyncQueue());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(syncEngine.getLastSyncTime());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = syncEngine.addListener((state) => {
      setIsOnline(state.isOnline);
      setIsSimulatedOffline(state.isSimulatedOffline);
      setIsSyncing(state.isSyncing);
      setLastSyncTime(state.lastSyncTime);
      setQueue(storageService.getSyncQueue());
    });
    return () => unsubscribe();
  }, []);

  const handleToggleOffline = (val: boolean) => {
    syncEngine.setSimulatedOffline(val);
    setIsSimulatedOffline(val);
    if (!val) {
      setStatusMessage('¡Conexión restaurada! Sincronizando transacciones pendientes en segundo plano...');
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage('Modo Offline activado. Los cobros que registres se guardarán localmente.');
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleManualSync = async () => {
    if (isSimulatedOffline) {
      setStatusMessage('Desactiva el modo offline primero para sincronizar con el servidor central.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    const res = await syncEngine.syncNow();
    if (res.success) {
      setStatusMessage(`Sincronización completada. ${res.syncedCount} transacciones sincronizadas con la nube.`);
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const effectiveOnline = isOnline && !isSimulatedOffline;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg border ${
              effectiveOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            {effectiveOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Motor de Sincronización Offline & Conectividad
            </h2>
            <p className="text-xs text-slate-500">
              Almacenamiento local SQLite/LocalStorage y sincronización bidireccional automática
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-force-sync"
            onClick={handleManualSync}
            disabled={isSyncing || !effectiveOnline}
            className="flex items-center gap-2 py-2 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Forzar Sincronización'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid: Connectivity Status & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status Card */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Estado de Red
            </span>
            {effectiveOnline ? (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                ONLINE
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                <WifiOff className="w-3 h-3" />
                OFFLINE
              </span>
            )}
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {effectiveOnline ? 'Conexión Estable' : 'Operando Sin Conexión'}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {effectiveOnline
              ? 'Todos los cobros y créditos se sincronizan en tiempo real con el servidor.'
              : 'Los cobros se firman, imprimen y almacenan en la base de datos local con token offline.'}
          </p>
        </div>

        {/* Offline Simulator Switch */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Simulador de Cobertura
            </span>
            <span className="text-[10px] font-mono text-blue-600 font-bold">TEST RUTA</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-700 font-semibold">
              Simular Pérdida de Señal
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-simulated-offline"
                type="checkbox"
                checked={isSimulatedOffline}
                onChange={(e) => handleToggleOffline(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <p className="text-[11px] text-slate-500">
            Activa este interruptor para probar cómo la app cobra en zonas rurales o sótanos sin internet.
          </p>
        </div>

        {/* Pending Queue Count */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Cola de Sincronización
            </span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {queue.length} <span className="text-xs font-normal text-slate-500">pendientes</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Último sync: {lastSyncTime || 'Al iniciar sesión'}</span>
          </div>
        </div>
      </div>

      {/* Sync Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Transacciones en Cola de Espera ({queue.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">SQLite / IndexedDB</span>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/80" />
            <p className="text-sm font-semibold text-slate-700">
              ¡Todas las transacciones están 100% sincronizadas!
            </p>
            <p className="text-xs text-slate-500">
              No hay cobros ni créditos pendientes en la cola local.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-amber-700 uppercase font-mono">
                      {item.entityType} ({item.action})
                    </span>
                    <span className="text-xs text-slate-900 font-bold">
                      Recibo #{item.data?.receiptNumber || item.id}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded font-medium">
                      Intento {item.attempts}/3
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Monto: <strong className="text-slate-900 font-mono">${item.data?.amount?.toFixed(2)}</strong> &middot; Creado: {new Date(item.createdAt).toLocaleTimeString('es-ES')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                    Pendiente de envío a servidor
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
