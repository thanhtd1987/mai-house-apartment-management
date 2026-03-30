import { isPast, isWithinDays } from './date';
import { SmartLock } from '../types';

/**
 * Get the status of a smart lock based on password expiry and battery replacement dates
 * @param lock - SmartLock object to check
 * @returns Lock status: 'critical', 'warning', or 'ok'
 */
export function getLockStatus(lock: SmartLock): 'critical' | 'warning' | 'ok' {
  const isExpired = isPast(lock.passwordExpiryDate);
  const isExpiringSoon = !isExpired && isWithinDays(lock.passwordExpiryDate, 7);
  const needsBattery = isPast(lock.nextBatteryReplacementDate);

  if (isExpired || needsBattery) return 'critical';
  if (isExpiringSoon) return 'warning';
  return 'ok';
}
