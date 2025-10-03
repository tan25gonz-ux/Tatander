// utils.js — helpers
export function formatMoney(num) {
  try {
    return '₡' + (num || 0).toLocaleString('es-CR');
  } catch {
    return `₡${num}`;
  }
}

// Rango lunes→lunes que contiene 'date'
export function getWeekRangeMondayToMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const day = d.getDay(); // 0=Dom,1=Lun...6=Sab
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return { start: monday, end: nextMonday };
}

export function formatDateTime(ts){
  const d = new Date(ts);
  return d.toLocaleString('es-CR', { hour12:false });
}

export function formatDate(ts){
  const d = new Date(ts);
  return d.toLocaleDateString('es-CR');
}
