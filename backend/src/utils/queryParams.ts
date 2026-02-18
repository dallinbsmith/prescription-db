export const getString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

export const getInt = (value: unknown, defaultValue?: number): number | undefined => {
  const str = getString(value);
  if (str === undefined) return defaultValue;
  const num = parseInt(str, 10);
  return isNaN(num) ? defaultValue : num;
};
