'use client';

import React, { useState } from 'react';
import { useAppAuth } from '@/lib/authContext';
import { AppUser, UserRole } from '@/lib/types';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  KeyRound,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';

export const UserManagementSection: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser, isAdmin } = useAppAuth();

  // Create user form modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operador');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Edit password modal
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('operador');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleOpenAddModal = () => {
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('operador');
    setAddFeedback(null);
    setIsAddUserOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) {
      setAddFeedback({
        success: false,
        message: 'Preencha o nome, usuário e a senha para continuar.',
      });
      return;
    }

    const res = await addUser({
      username: newUsername.trim(),
      name: newName.trim(),
      email: newEmail.trim() || undefined,
      password: newPassword.trim(),
      role: newRole,
    });

    setAddFeedback(res);
    if (res.success) {
      setTimeout(() => {
        setIsAddUserOpen(false);
      }, 1200);
    }
  };

  const handleOpenEditModal = (u: AppUser) => {
    setEditingUser(u);
    setEditPassword(u.password || '');
    setEditRole(u.role);
    setEditFeedback(null);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editPassword.trim()) {
      setEditFeedback({ success: false, message: 'A senha não pode ficar em branco.' });
      return;
    }

    const res = await updateUser(editingUser.id, {
      password: editPassword.trim(),
      role: editRole,
    });

    setEditFeedback(res);
    if (res.success) {
      setTimeout(() => {
        setEditingUser(null);
      }, 1200);
    }
  };

  const handleDeleteUser = async (u: AppUser) => {
    if (u.id === currentUser?.id) {
      if (!confirm(`Tem certeza que deseja excluir sua própria conta (${u.username})? Você será desconectado.`)) {
        return;
      }
    } else {
      if (!confirm(`Deseja realmente remover o usuário "${u.name}" (${u.username})?`)) {
        return;
      }
    }

    const res = await deleteUser(u.id);
    if (!res.success) {
      alert(res.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-center">
        <ShieldCheck className="h-10 w-10 text-amber-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-zinc-100">Acesso Restrito ao Administrador</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
          Apenas usuários com o perfil de Administrador podem gerenciar contas, criar novos logins e alterar senhas de acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-zinc-950 to-zinc-950 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100">
                  Gerenciamento de Usuários & Controle de Acesso
                </h3>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  {users.length} usuário(s)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Crie e gerencie as contas de Administradores e Operadores. Dados salvos no Supabase.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-add-new-user-open"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-cyan-950/50 hover:bg-cyan-400 transition active:scale-98 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Usuário</span>
          </button>
        </div>

        {/* Info badges */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Perfil: Administrador</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Acesso total ao sistema: criação de listas, catálogo, requisições, exclusão em massa e todas as telas de <strong>Configurações</strong> e <strong>Usuários</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <span>Perfil: Operador</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Acesso operacional para criar e editar Listas de Materiais (BOM), gerar Requisições e consultar Catálogo. As Configurações são restritas.
            </p>
          </div>
        </div>

        {/* User List: Mobile Cards + Desktop Table */}
        {/* MOBILE VIEW */}
        <div className="mt-6 block sm:hidden space-y-3">
          {users.map((u) => {
            const isCurrent = currentUser?.id === u.id;
            const isUserAdmin = u.role === 'admin';

            return (
              <div
                key={u.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-zinc-100">
                      <span>{u.username}</span>
                      {isCurrent && (
                        <span className="rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.2 text-[9px] font-bold">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-300 font-medium mt-0.5">{u.name}</div>
                    {u.email && (
                      <div className="text-[10px] text-zinc-500">{u.email}</div>
                    )}
                  </div>

                  {isUserAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Admin</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      <UserCheck className="h-3 w-3" />
                      <span>Operador</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <span>Senha:</span>
                    <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">
                      {u.password || '••••••••'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(u)}
                      className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 min-h-[38px] transition"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Alterar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      disabled={isUserAdmin && users.filter((x) => x.role === 'admin').length <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-950/30 text-red-400 hover:bg-red-900/50 hover:text-red-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP VIEW: User Table */}
        <div className="mt-6 hidden sm:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Nome Completo</th>
                  <th className="px-4 py-3">Papel / Acesso</th>
                  <th className="px-4 py-3">Senha Atual</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isUserAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-zinc-850/50 transition">
                      {/* Username */}
                      <td className="px-4 py-3 font-mono font-semibold text-zinc-200">
                        <div className="flex items-center gap-2">
                          <span>{u.username}</span>
                          {isCurrent && (
                            <span className="rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.2 text-[9px] font-bold">
                              Você
                            </span>
                          )}
                        </div>
                        {u.email && (
                          <div className="text-[10px] text-zinc-500 font-sans">{u.email}</div>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-zinc-100">{u.name}</td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        {isUserAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Administrador</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            <UserCheck className="h-3 w-3" />
                            <span>Operador</span>
                          </span>
                        )}
                      </td>

                      {/* Password */}
                      <td className="px-4 py-3 font-mono text-zinc-400">
                        <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[11px] text-zinc-300">
                          {u.password || '••••••••'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700 transition"
                            title="Editar senha ou papel"
                          >
                            <KeyRound className="h-3 w-3 text-cyan-400" />
                            <span>Alterar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isUserAdmin && users.filter((x) => x.role === 'admin').length <= 1}
                            className="rounded-lg border border-red-500/30 bg-red-950/30 p-1 text-red-400 hover:bg-red-900/50 hover:text-red-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              isUserAdmin && users.filter((x) => x.role === 'admin').length <= 1
                                ? 'Não é possível remover o único Administrador'
                                : 'Excluir usuário'
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Add User */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Criar Novo Usuário</h3>
                <p className="text-xs text-zinc-400">Defina as credenciais e o nível de acesso</p>
              </div>
            </div>

            {addFeedback && (
              <div
                className={`mb-4 rounded-xl p-3 text-xs flex items-center gap-2 ${
                  addFeedback.success
                    ? 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border border-red-500/40 bg-red-950/30 text-red-300'
                }`}
              >
                {addFeedback.success ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                )}
                <span>{addFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome de Usuário (Login):
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: joao ou silva.eng"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-mono text-zinc-100 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  E-mail (Opcional):
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="joao@empresa.com.br"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Senha de Acesso:
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo de caracteres recomendado"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-3.5 pr-10 py-2 text-xs font-mono text-zinc-100 focus:border-cyan-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nível de Acesso (Papel):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('operador')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      newRole === 'operador'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Operador</div>
                    <div className="text-[10px] text-zinc-400">Listas e Catálogo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      newRole === 'admin'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Administrador</div>
                    <div className="text-[10px] text-zinc-400">Acesso Total</div>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-400 shadow-md"
                >
                  <Check className="h-4 w-4" />
                  <span>Cadastrar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User & Password */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Alterar Usuário: {editingUser.username}
                </h3>
                <p className="text-xs text-zinc-400">{editingUser.name}</p>
              </div>
            </div>

            {editFeedback && (
              <div
                className={`mb-4 rounded-xl p-3 text-xs flex items-center gap-2 ${
                  editFeedback.success
                    ? 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                    : 'border border-red-500/40 bg-red-950/30 text-red-300'
                }`}
              >
                {editFeedback.success ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                )}
                <span>{editFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nova Senha de Acesso:
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-3.5 pr-10 py-2 text-xs font-mono text-zinc-100 focus:border-cyan-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nível de Acesso (Papel):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('operador')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      editRole === 'operador'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Operador</div>
                    <div className="text-[10px] text-zinc-400">Listas e Catálogo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('admin')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      editRole === 'admin'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Administrador</div>
                    <div className="text-[10px] text-zinc-400">Acesso Total</div>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-400 shadow-md"
                >
                  <Check className="h-4 w-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
