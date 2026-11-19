// components/hr/EmploymentStatusBadge.tsx
import React from 'react';
import { EmployeeStatus } from '../../types/hr';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '../../pages/hr/constants';

interface Props {
  status: EmployeeStatus;
}

export const EmploymentStatusBadge: React.FC<Props> = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold ${EMPLOYEE_STATUS_COLORS[status]}`}>
      {EMPLOYEE_STATUS_LABELS[status]}
    </span>
  );
};