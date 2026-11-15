import React from 'react';
import { UnitsTab } from '../UnitsTab';

/**
 * قسم الوحدات — يُعيد استخدام UnitsTab من الصفحة القديمة
 * (منطق كامل: جدول + إضافة + تعديل + حذف + بحث + فلتر)
 */
export const UnitsSection: React.FC = () => {
  return <UnitsTab />;
};