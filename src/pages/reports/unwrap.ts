/**
 * يستخرج البيانات من استجابة `{ success, data }` أو يُعيدها مباشرة.
 * يتعامل مع كل الأشكال الممكنة بأمان تام.
 */
export function unwrap<T = any>(input: any): T | null {
  if (!input) return null;

  // إذا كان { success, data } من الباك إند
  if (
    typeof input === 'object' &&
    'data' in input &&
    input.data !== undefined
  ) {
    return input.data as T;
  }

  // إذا كان البيانات مباشرة
  return input as T;
}