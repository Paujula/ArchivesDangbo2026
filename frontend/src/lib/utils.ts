export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'il y a quelques secondes';
  if (mins < 60)  return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'hier';
  if (days < 30)  return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDateShort(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
