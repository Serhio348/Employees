const MS_IN_DAY         = 86400000;
const EXPIRING_SOON_DAYS = 30;
const WARNING_DAYS       = 7;

// Сравниваем начало дней — без учёта времени суток
// Если замена сегодня → 0, завтра → 1, вчера → -1
function getDaysLeft(nextReplacementDate) {
  const today       = new Date();
  const todayStart  = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const replDate    = new Date(nextReplacementDate);
  const replStart   = new Date(replDate.getFullYear(), replDate.getMonth(), replDate.getDate());
  return Math.round((replStart - todayStart) / MS_IN_DAY);
}

// Форматирование для /mysiz — полный вид
function formatDaysLeft(days) {
  if (days < 0)  return `${Math.abs(days)} дн. назад 🔴 ПРОСРОЧЕНО`;
  if (days === 0) return `истекает сегодня 🔴`;
  if (days <= WARNING_DAYS)       return `${days} дн. 🔴`;
  if (days <= EXPIRING_SOON_DAYS) return `${days} дн. ⚠️`;
  if (days < 60) return `~${days} дн. ✅`;
  const months = Math.floor(days / 30);
  return `~${months} мес. ✅`;
}

// Форматирование для /expiring — краткий статус и эмодзи
function formatExpiringLine(addon, days) {
  const dateStr = new Date(addon.nextReplacementDate).toLocaleDateString('ru-RU');
  const emoji   = days <= 0 ? '🔴' : days <= WARNING_DAYS ? '🔴' : '⚠️';
  const status  = days < 0  ? 'ПРОСРОЧЕНО'
                : days === 0 ? 'истекает сегодня'
                : `через ${days} дн.`;
  return `${emoji} *${addon.name}* — ${status} (${dateStr})`;
}

module.exports = { getDaysLeft, formatDaysLeft, formatExpiringLine, EXPIRING_SOON_DAYS, MS_IN_DAY };
