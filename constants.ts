export const YARDS = ['Yard Cakung', 'Yard Sukapura', 'Yard Jababeka'];
export const DAYS_OPTION = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Daily'];
export const CATEGORY_OPTION = ['Makanan', 'Minuman'];
export const LOGO_URL = "https://github.com/chairulbreaks06-NR/claimMinumanYardRev1/blob/main/NEWLOGO.png?raw=true";

export const getDayName = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
};

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const formatDateTime = (timestamp: any) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(); 
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
};

export const isClaimWindowOpen = () => {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const currentMinutes = hour * 60 + min;
  const startMinutes = 7 * 60 + 30; // 07:30
  const endMinutes = 22 * 60;       // 22:00
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};