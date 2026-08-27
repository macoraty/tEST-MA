'use client';

import React, { useState } from 'react';
import { MaterialList, AppSettings } from '@/lib/types';
import { buildWhatsAppMessage, shareViaWhatsApp } from '@/lib/exportUtils';
import { X, Send, Copy, Check, MessageSquare, Phone, ExternalLink } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: MaterialList | null;
  settings: AppSettings;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  list,
  settings,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !list) return null;

  const messageText = buildWhatsAppMessage(list, settings);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = () => {
    shareViaWhatsApp(list, settings, phoneNumber);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-whatsapp"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all sm:p-7"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                Compartilhar Lista via WhatsApp
              </h2>
              <p className="text-xs text-zinc-400">
                {list.name} • {list.machine} ({list.items.length} itens)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4 flex flex-1 flex-col space-y-4 overflow-y-auto pr-1">
          {/* Optional phone input */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              Número de WhatsApp do Destinatário (Opcional)
            </label>
            <div className="relative">
              <input
                id="input-whatsapp-phone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 11999998888 (com DDD)"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
              <span className="absolute right-3 top-2.5 text-[11px] text-zinc-500">
                Deixe em branco para escolher o contato no WhatsApp
              </span>
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">
                Pré-visualização da Mensagem Formatada:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-800/80 bg-zinc-900/90 p-4 font-mono text-xs text-zinc-300 shadow-inner">
              {messageText}
            </pre>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
          <button
            id="btn-copy-whatsapp-text"
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-zinc-400" />}
            <span>{copied ? 'Mensagem Copiada!' : 'Copiar para a Área de Transferência'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Fechar
            </button>
            <button
              id="btn-open-whatsapp-web"
              type="button"
              onClick={handleSend}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/50 transition hover:bg-emerald-500"
            >
              <Send className="h-4 w-4" />
              <span>Abrir no WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
