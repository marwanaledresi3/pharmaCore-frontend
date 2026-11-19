// pages/hr/dashboard/HRDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, CalendarOff, TrendingUp, Clock, Wallet,
  AlertCircle, UserPlus, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { hrDashboardApi, HRDashboardData } from '../../../api/hr/dashboardApi';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { ErrorAlert } from '../../../components/common/ErrorAlert';
import { useAuth } from '../../../context/AuthContext';
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS } from '../constants';
import { formatMoney, formatDate } from '../utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const HRDashboardPage: React.FC = () => {
  const { company } = useAuth();
  const currency = company?.currency_code || 'YER';

  const [data, setData] = useState<HRDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const stats = await hrDashboardApi.getStats();
      setData(stats);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات اللوحة');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (isLoading) return <LoadingSpinner message="جاري تحميل لوحة HR..." fullHeight />;
  if (error) return <ErrorAlert error={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="إجمالي الموظفين"
          value={String(data.total_employees)}
          subtitle={`${data.active_employees} نشط`}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          label="حضور اليوم"
          value={`${data.attendance_rate}%`}
          subtitle={`${data.present_today} حاضر · ${data.absent_today} غائب`}
          icon={<UserCheck className="w-5 h-5" />}
          color="emerald"
        />
        <KpiCard
          label="في إجازة اليوم"
          value={String(data.on_leave_today)}
          subtitle={`${data.new_hires_this_month} تعيين جديد`}
          icon={<CalendarOff className="w-5 h-5" />}
          color="amber"
        />
        <KpiCard
          label="رواتب الشهر"
          value={formatMoney(data.current_month_payroll_net, currency)}
          subtitle={data.current_month_payroll_status || 'لم يُحسب بعد'}
          icon={<Wallet className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* Second Row: Attendance chart + Departments pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend (7 days) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">اتجاه الحضور — آخر 7 أيام</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">عدد الحاضرين / الغائبين / المتأخرين يومياً</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          {data.attendance_trend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              لا توجد بيانات حضور مسجلة
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.attendance_trend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="present" name="حاضر" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="متأخر" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="غائب" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Departments Pie */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 mb-1">توزيع الموظفين</h3>
          <p className="text-[10px] text-slate-500 mb-4">حسب الأقسام</p>
          {data.departments_breakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              لا توجد أقسام
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.departments_breakdown}
                    dataKey="employee_count"
                    nameKey="department_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {data.departments_breakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {data.departments_breakdown.slice(0, 5).map((d, i) => (
                  <div key={d.department_id} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-slate-700">{d.department_name}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">{d.employee_count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Third Row: Pending leaves + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending leaves summary */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-black text-amber-900">طلبات إجازة معلقة</h3>
          </div>
          <p className="text-3xl font-black text-amber-700 font-mono mt-2">{data.pending_leave_requests}</p>
          <p className="text-[11px] text-amber-700 mt-1">
            {data.approved_this_month} معتمد هذا الشهر
          </p>
        </div>

        {/* Recent leave requests */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-900">آخر طلبات الإجازة</h3>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          {data.recent_leave_requests.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">لا توجد طلبات حديثة</div>
          ) : (
            <div className="space-y-2">
              {data.recent_leave_requests.map((lr) => (
                <div key={lr.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    {lr.employee_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{lr.employee_name}</p>
                    <p className="text-[10px] text-slate-500">
                      {lr.leave_type_name} · {lr.days_count} يوم
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${LEAVE_STATUS_COLORS[lr.status as keyof typeof LEAVE_STATUS_COLORS] || 'bg-slate-100'}`}>
                    {LEAVE_STATUS_LABELS[lr.status as keyof typeof LEAVE_STATUS_LABELS] || lr.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// KpiCard
// ═══════════════════════════════════════════════════════════════════════════
const KpiCard: React.FC<{
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'amber' | 'rose';
}> = ({ label, value, subtitle, icon, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</span>
        <span className="opacity-60">{icon}</span>
      </div>
      <p className="text-2xl font-black font-mono">{value}</p>
      <p className="text-[10px] opacity-75 mt-1">{subtitle}</p>
    </div>
  );
};