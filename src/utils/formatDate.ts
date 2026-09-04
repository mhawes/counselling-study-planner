export function formatDisplayDate(input?: string | Date | null, fallback = 'No date', includeTime = false): string {
  if (!input) return fallback;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return fallback;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let out = `${day}/${month}/${year}`;
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    out += ` ${hours}:${minutes}`;
  }
  return out;
}
