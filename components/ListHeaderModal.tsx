'use client';

import React, { useState } from 'react';
import { MaterialList, ListStatus, AppSettings } from '@/lib/types';
import { X, ArrowRight, Cog, Building2, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface ListHeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<MaterialList, 'id' | 'items' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => void;
  initialList?: MaterialList | null;
  settings: AppSettings;
  existingMachines: string[];
  existingClients: string[];
}

export const ListHeaderModal: React.FC<ListHeaderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialList,
  settings,
  existingMachines,
  existingClients,
}) => {
  if (!isOpen) return null;

  return (
    <ListHeaderModalContent
      key={initialList ? initialList.id : 'new-list'}
      onClose={onClose}
      onSave={onSave}
      initialList={initialList}
      settings={settings}
      existingMachines={existingMachines}
      existingClients={existingClients}
    />
  );
};

interface ListHeaderModalContentProps {
  onClose: () => void;
  onSave: (
    data: Omit<MaterialList, 'id' | 'items' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => void;
  initialList?: MaterialList | null;
  settings: AppSettings;
  existingMachines: string[];
  existingClients: string[];
}

const ListHeaderModalContent: React.FC<ListHeaderModalContentProps> = ({
  onClose,
  onSave,
  initialList,
  settings,
  existingMachines,
  existingClients,
}) => {
  const [name, setName] = useState(initialList?.name || '');
  const [machine, setMachine] = useState(initialList?.machine || '');
  const [client, setClient] = useState(initialList?.client || '');
  const [responsible, setResponsible] = useState(
    initialList?.responsible || settings.defaultResponsible || ''
  );
  const [date, setDate] = useState(
    initialList?.date || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<ListStatus>(
    initialList?.status || 'Em Andamento'
  );
  const [notes, setNotes] = useState(initialList?.notes || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Por favor, informe o nome ou título da lista / projeto.';
    }
    if (!machine.trim()) {
      newErrors.machine = 'Informe a máquina ou equipamento correspondente.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        name: name.trim(),
        machine: machine.trim(),
        client: client.trim() || 'Interno / Próprio',
        responsible: responsible.trim(),
        date,
        status,
        notes: notes.trim(),
      },
      initialList?.id
    );
  };

  const statusOptions: ListStatus[] = [
    'Rascunho',
    'Em Andamento',
    'Concluída',
    'Aprovada',
    'Entregue',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="modal-list-header"
        className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all sm:p-7"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
              <Cog className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                {initialList ? 'Editar Informações da Lista' : 'Nova Lista de Materiais'}
              </h2>
              <p className="text-xs text-zinc-400">
                {initialList
                  ? 'Atualize os dados de identificação e classificação'
                  : 'Passo 1: Defina os parâmetros da lista para iniciar a montagem'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nome da Lista */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
              Nome da Lista / Projeto / Ordem de Serviço <span className="text-red-400">*</span>
            </label>
            <input
              id="input-list-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Ex: Reforma Esteira Transportadora 01, Revisão Fresadora, Montagem Linha B"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Máquina e Cliente (2 colunas) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Máquina */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Cog className="h-3.5 w-3.5 text-cyan-400" />
                Máquina / Equipamento <span className="text-red-400">*</span>
              </label>
              <input
                id="input-list-machine"
                type="text"
                value={machine}
                onChange={(e) => {
                  setMachine(e.target.value);
                  if (errors.machine) setErrors({ ...errors, machine: '' });
                }}
                placeholder="Ex: Torno CNC, Misturador 500L, Prensa"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              />
              {errors.machine && <p className="mt-1 text-xs text-red-400">{errors.machine}</p>}

              {/* Sugestões de máquinas */}
              {existingMachines.length > 0 && !initialList && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="text-[10px] text-zinc-500">Recentes:</span>
                  {existingMachines.slice(0, 3).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMachine(m)}
                      className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cliente */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                Cliente / Destinatário
              </label>
              <input
                id="input-list-client"
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ex: Indústria ABC, Uso Interno"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              />

              {/* Sugestões de clientes */}
              {existingClients.length > 0 && !initialList && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="text-[10px] text-zinc-500">Recentes:</span>
                  {existingClients.slice(0, 3).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setClient(c)}
                      className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Responsável, Data e Status (3 colunas) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Responsável */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <User className="h-3.5 w-3.5 text-cyan-400" />
                Responsável
              </label>
              <input
                id="input-list-responsible"
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Nome do técnico"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
              />
            </div>

            {/* Data */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                Data de Emissão
              </label>
              <input
                id="input-list-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                Status
              </label>
              <select
                id="select-list-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ListStatus)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-cyan-500"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-zinc-900 text-zinc-100">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-300">
              Observações Gerais (Opcional)
            </label>
            <textarea
              id="input-list-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Instruções de corte, local de entrega, urgência, etc."
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-cyan-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800/80 pt-4">
            <button
              id="btn-cancel-header-modal"
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancelar
            </button>

            <button
              id="btn-confirm-header-modal"
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-950/50 transition hover:from-cyan-400 hover:to-blue-500"
            >
              <span>{initialList ? 'Salvar Alterações' : 'Avançar para Adicionar Itens'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
