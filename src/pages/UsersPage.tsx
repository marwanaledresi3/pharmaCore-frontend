import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { companyApi } from '../api/companyApi';
import { User, Role } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { user: currentUser, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Available Roles & Permissions
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [savingUser, setSavingUser] = useState(false);

  // Password Change Modal
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Edit Roles Modal
  const [rolesUser, setRolesUser] = useState<User | null>(null);
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [savingUserRoles, setSavingUserRoles] = useState(false);

  // Create Role Modal
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [savingRole, setSavingRole] = useState(false);

  // === Load Users ===
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await companyApi.listUsers({ page, limit: 12 });
      setUsers(res.items || []);
      setTotalPages(res.pagination.pages || 1);
      setTotalCount(res.pagination.total || 0);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [page]);

  // === Load Roles & Permissions ===
  const loadRolesAndPermissions = useCallback(async () => {
    try {
      const [rolesList, permsList] = await Promise.all([
        companyApi.listRoles(),
        companyApi.listPermissions(),
      ]);
      setRoles(rolesList || []);
      setPermissions(permsList || []);
    } catch (err: any) {
      console.error('Failed to load roles/permissions', err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadRolesAndPermissions();
  }, [loadUsers, loadRolesAndPermissions]);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !userPassword) return;

    setSavingUser(true);
    try {
      await companyApi.createUser({
        name: userName.trim(),
        email: userEmail.trim(),
        password: userPassword,
        role_ids: selectedRoleIds,
      });
      setShowCreateModal(false);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setSelectedRoleIds([]);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'تعذر إنشاء المستخدم');
    } finally {
      setSavingUser(false);
    }
  };

  // Toggle User Status
  const handleToggleStatus = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      alert('لا يمكنك تعطيل حسابك الخاص');
      return;
    }
    const newStatus = !targetUser.is_active;
    try {
      await companyApi.setUserStatus(targetUser.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: newStatus } : u))
      );
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير حالة المستخدم');
    }
  };

  // Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser || !newPassword) return;

    setSavingPassword(true);
    try {
      await companyApi.changeUserPassword(passwordUser.id, newPassword);
      setPasswordUser(null);
      setNewPassword('');
      alert('تم تحديث كلمة المرور بنجاح');
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير كلمة المرور');
    } finally {
      setSavingPassword(false);
    }
  };

  // Save User Roles Submit
  const handleSaveUserRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolesUser) return;

    setSavingUserRoles(true);
    try {
      await companyApi.assignUserRoles(rolesUser.id, editRoleIds);
      setRolesUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'تعذر تحديث أدوار المستخدم');
    } finally {
      setSavingUserRoles(false);
    }
  };

  // Create Role Submit
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setSavingRole(true);
    try {
      await companyApi.createRole(roleName.trim(), selectedPermissionIds);
      setShowCreateRoleModal(false);
      setRoleName('');
      setSelectedPermissionIds([]);
      loadRolesAndPermissions();
    } catch (err: any) {
      alert(err.message || 'تعذر إنشاء الدور الوظيفي');
    } finally {
      setSavingRole(false);
    }
  };

  // Delete Role
  const handleDeleteRole = async (roleId: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الدور: ${name}؟`)) return;
    try {
      await companyApi.deleteRole(roleId);
      loadRolesAndPermissions();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الدور الوظيفي');
    }
  };

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            إدارة المستخدمين والأدوار الوظيفية
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            التحكم في حسابات الموظفين والصيادلة والمحاسبين وتعيين الصلاحيات الدقيقة لكل شاشة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'users' ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              إضافة مستخدم جديد
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateRoleModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              <Shield className="w-4 h-4" />
              إنشاء دور وظيفي جديد
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          المستخدمين والموظفين ({totalCount || users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'roles'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          الأدوار والصلاحيات ({roles.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: USERS LIST */}
      {/* ============================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>

          {error && <ErrorAlert message={error} onRetry={loadUsers} />}

          {loading ? (
            <div className="py-16">
              <LoadingSpinner message="جاري استرجاع مستخدمي المنشأة..." />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="لا يوجد مستخدمين"
              description="أضف أفراد فريق العمل من صيادلة ومحاسبين ومدراء للمنشأة"
              actionLabel="إضافة مستخدم"
              onAction={() => setShowCreateModal(true)}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-3 px-4">المستخدم</th>
                      <th className="py-3 px-4">البريد الإلكتروني</th>
                      <th className="py-3 px-4">الأدوار الممنوحة</th>
                      <th className="py-3 px-4">نوع الحساب</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isOwnerUser = u.role === 'owner' || u.user_type === 'owner';
                      const isSelf = u.id === currentUser?.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                                {u.name ? u.name.charAt(0) : 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{u.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] text-emerald-700 font-bold block">
                                    (أنت الآن)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles && u.roles.length > 0 ? (
                                u.roles.map((r) => (
                                  <span
                                    key={r.id}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]"
                                  >
                                    {r.name}
                                  </span>
                                ))
                              ) : isOwnerUser ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                                  مالك المنشأة (Owner)
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[11px]">بدون دور مخصص</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {u.user_type || 'staff'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                                u.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {u.is_active ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  نشط
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  معطل
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Assign Roles Button */}
                              <button
                                type="button"
                                title="تعيين الأدوار والصلاحيات"
                                onClick={() => {
                                  setRolesUser(u);
                                  setEditRoleIds(u.roles?.map((r) => r.id) || []);
                                }}
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                              >
                                <Shield className="w-4 h-4" />
                              </button>

                              {/* Reset Password Button */}
                              <button
                                type="button"
                                title="إعادة تعيين كلمة المرور"
                                onClick={() => setPasswordUser(u)}
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ROLES & PERMISSIONS */}
      {/* ============================================================== */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900">{role.name}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="حذف الدور"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">
                      الصلاحيات الممنوحة ({role.permissions?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg">
                      {role.permissions && role.permissions.length > 0 ? (
                        role.permissions.map((perm) => (
                          <span
                            key={perm.id || perm.name}
                            className="px-1.5 py-0.5 rounded-sm bg-white border border-slate-200 text-slate-700 text-[10px] font-mono"
                          >
                            {perm.name || perm}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600">لا توجد صلاحيات مخصصة</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-600 font-mono">
                  معرف الدور: #{role.id.slice(0, 8)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE USER */}
      {/* ============================================================== */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="إضافة مستخدم جديد إلى المنشأة"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="د. أحمد المحمدي"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني للولوج *
              </label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="pharmacist@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور الأولية *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                تعيين الأدوار الوظيفية
              </label>
              <div className="space-y-2 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                {roles.length === 0 ? (
                  <p className="text-xs text-slate-600">لا توجد أدوار مسبقة</p>
                ) : (
                  roles.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(r.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoleIds((prev) => [...prev, r.id]);
                          } else {
                            setSelectedRoleIds((prev) => prev.filter((id) => id !== r.id));
                          }
                        }}
                        className="rounded-md text-emerald-600"
                      />
                      <span className="font-bold">{r.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingUser}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {savingUser ? 'جاري الإنشاء...' : 'حفظ المستخدم'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: RESET PASSWORD */}
      {/* ============================================================== */}
      {passwordUser && (
        <Modal
          isOpen={!!passwordUser}
          onClose={() => setPasswordUser(null)}
          title={`تغيير كلمة مرور: ${passwordUser.name}`}
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور الجديدة *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة مرور لا تقل عن 6 خانات..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPasswordUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {savingPassword ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: ASSIGN USER ROLES */}
      {/* ============================================================== */}
      {rolesUser && (
        <Modal
          isOpen={!!rolesUser}
          onClose={() => setRolesUser(null)}
          title={`تعديل أدوار وصلاحيات: ${rolesUser.name}`}
        >
          <form onSubmit={handleSaveUserRoles} className="space-y-4">
            <p className="text-xs text-slate-600">
              حدد الأدوار الوظيفية التي ترغب في ربطها بهذا المستخدم لتحديد ما يمكنه رؤيته وإدارته:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
              {roles.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-2 text-xs text-slate-700 hover:bg-white p-1 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={editRoleIds.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditRoleIds((prev) => [...prev, r.id]);
                      } else {
                        setEditRoleIds((prev) => prev.filter((id) => id !== r.id));
                      }
                    }}
                    className="rounded-md text-emerald-600"
                  />
                  <span className="font-bold">{r.name}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRolesUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingUserRoles}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {savingUserRoles ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE ROLE */}
      {/* ============================================================== */}
      {showCreateRoleModal && (
        <Modal
          isOpen={showCreateRoleModal}
          onClose={() => setShowCreateRoleModal(false)}
          title="إنشاء دور وظيفي مخصص جديد"
        >
          <form onSubmit={handleCreateRole} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدور *</label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="مثال: صيدلي مستودع / محاسب مبيعات"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الصلاحيات الممنوحة
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                {permissions.map((perm) => {
                  const permId = perm.id || perm.name;
                  const isChecked = selectedPermissionIds.includes(permId);
                  return (
                    <label
                      key={permId}
                      className="flex items-center gap-2 text-xs text-slate-700 hover:bg-white p-1 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissionIds((prev) => [...prev, permId]);
                          } else {
                            setSelectedPermissionIds((prev) => prev.filter((id) => id !== permId));
                          }
                        }}
                        className="rounded-md text-emerald-600"
                      />
                      <span className="font-mono text-[11px] font-semibold">{perm.name || perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingRole}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {savingRole ? 'جاري الحفظ...' : 'حفظ الدور'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
