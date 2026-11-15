import { useState, useEffect, useCallback } from 'react';
import { companyApi } from '../../../api/companyApi';

interface UseSettingsSectionResult<T> {
  settings: Partial<T>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
  updateField: <K extends keyof T>(key: K, value: T[K]) => void;
  save: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Hook موحّد لجلب/حفظ إعدادات قسم معين.
 * - يجلب كل الإعدادات مرة واحدة، ويستخرج فقط مفاتيح القسم.
 * - عند الحفظ، يرسل فقط المفاتيح المعدّلة.
 */
export function useSettingsSection<T extends Record<string, any>>(
  defaults: T,
  keys: (keyof T)[],
): UseSettingsSectionResult<T> {
  const [settings, setSettings] = useState<Partial<T>>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [original, setOriginal] = useState<Partial<T>>(defaults);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const grouped = await companyApi.getSettingsGrouped();

      // جمع المفاتيح المطلوبة من كل المجموعات
      const collected: Partial<T> = { ...defaults };
      for (const group of Object.values(grouped)) {
        for (const key of keys) {
          const k = key as string;
          if (k in group) {
            (collected as any)[k] = group[k];
          }
        }
      }

      setSettings(collected);
      setOriginal(collected);
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  }, [keys, defaults]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // أرسل فقط الحقول التي تغيّرت
      const changed: Record<string, any> = {};
      for (const key of keys) {
        if ((settings as any)[key] !== (original as any)[key]) {
          changed[key as string] = (settings as any)[key];
        }
      }

      if (Object.keys(changed).length === 0) {
        setSuccess(true);
        return;
      }

      await companyApi.updateSettings(changed);
      setOriginal(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  }, [settings, original, keys]);

  return { settings, loading, saving, error, success, updateField, save, reload };
}