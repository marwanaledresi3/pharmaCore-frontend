import { Link } from 'react-router-dom';

interface Props {
  to: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
}

export function QuickActionCard({ to, label, description, icon }: Props) {
  return (
    <Link
      to={to}
      className="group rounded-xl border bg-white p-4 hover:border-blue-400 hover:shadow-sm transition"
    >
      <div className="text-2xl text-blue-600 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="mt-2 font-medium">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </Link>
  );
}