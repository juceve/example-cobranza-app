import React, { useState } from 'react';
import { Client, Portfolio } from '../types';
import { storageService } from '../services/storage';
import {
  X,
  UserPlus,
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  onClientCreated: (client: Client) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  portfolios,
  onClientCreated,
}) => {
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('+591 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id || '');
  const [creditLimit, setCreditLimit] = useState<number>(2000);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !documentId.trim() || !phone.trim()) return;

    const newClient = storageService.createClient({
      name,
      documentId,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      address,
      neighborhood: neighborhood || 'Zona Comercial',
      portfolioId: portfolioId || portfolios[0]?.id || 'port_1',
      creditLimit,
      status: 'al_dia',
      creditScore: 85,
      notes,
      coordinates: { lat: -17.783 + (Math.random() - 0.5) * 0.02, lng: -63.18 + (Math.random() - 0.5) * 0.02 },
    });

    onClientCreated(newClient);
    onClose();
  };

  return (
    <div
      id="new-client-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        id="new-client-modal-container"
        className="relative w-full max-w-lg bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col my-0 sm:my-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Registrar Nuevo Deudor / Cliente
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Alta de cliente en cartera de cobro
              </p>
            </div>
          </div>
          <button
            id="close-new-client-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1 pb-6">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Nombre Completo / Razón Social *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="client-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Carlos Pérez Miranda"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                N° Documento (DNI / CI / RUC) *
              </label>
              <input
                id="client-document-input"
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Ej: 7891234"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Teléfono / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="client-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Ruta / Cartera Asignada
              </label>
              <select
                id="client-portfolio-select"
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Límite de Crédito ($)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="client-credit-limit-input"
                  type="number"
                  step="100"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Dirección de Domicilio o Negocio *
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="client-address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Calle Los Pinos #123, Caseta 5"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Barrio / Sector
            </label>
            <input
              id="client-neighborhood-input"
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ej: Mercado Central, Sector Abarrotes"
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Notas / Horario Recomendado de Cobro
            </label>
            <textarea
              id="client-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Encontrar por las mañanas entre 8am y 11am en su puesto..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
            />
          </div>

          <button
            type="submit"
            id="btn-confirm-create-client"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Deudor en Cartera</span>
          </button>
        </form>
      </div>
    </div>
  );
};
