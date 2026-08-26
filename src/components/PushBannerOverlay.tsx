import React, { useEffect, useState } from 'react';
import { PushNotificationRecord } from '../types';
import { pushService } from '../services/pushService';
import { Bell, CheckCircle2, AlertTriangle, X, Smartphone } from 'lucide-react';

export const PushBannerOverlay: React.FC = () => {
  const [currentNotification, setCurrentNotification] = useState<PushNotificationRecord | null>(null);

  useEffect(() => {
    const unsubscribe = pushService.addListener((notif) => {
      setCurrentNotification(notif);
      const timer = setTimeout(() => {
        setCurrentNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  if (!currentNotification) return null;

  const isPayment = currentNotification.type === 'pago';
  const isOverdue = currentNotification.type === 'mora';

  return (
    <div
      id="push-banner-floating-toast"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-slate-900/95 border-2 border-indigo-500/60 text-slate-100 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isPayment
              ? 'bg-emerald-500/20 text-emerald-400'
              : isOverdue
              ? 'bg-rose-500/20 text-rose-400'
              : 'bg-indigo-500/20 text-indigo-400'
          }`}
        >
          {isPayment ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isOverdue ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Smartphone className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Notificación Push Cliente &middot; FCM
            </span>
            <span className="text-[9px] text-slate-400">Ahora</span>
          </div>

          <h4 className="font-bold text-xs text-white truncate mt-0.5">
            {currentNotification.title}
          </h4>

          <p className="text-[11px] text-slate-300 leading-snug mt-0.5 line-clamp-2">
            {currentNotification.body}
          </p>
        </div>

        <button
          onClick={() => setCurrentNotification(null)}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
