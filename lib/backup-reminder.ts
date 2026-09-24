import { SHOP_UTC_OFFSET_HOURS } from "@/lib/format";

export type BackupReminderFrequency = "off" | "daily" | "weekly" | "monthly";

export type BackupReminderConfig = {
  frequency: BackupReminderFrequency;
  /** "HH:mm" in shop-local time (UTC+2). */
  time: string;
  /** 0 (Sunday) – 6 (Saturday), shop-local. Required when frequency is "weekly". */
  dayOfWeek?: number;
  /** 1–31, shop-local. Required when frequency is "monthly". Clamped to the month's actual last day. */
  dayOfMonth?: number;
  /** ISO timestamp of the last time a reminder notification was created, if any. */
  lastFiredAt?: string;
};

type ShopLocalParts = { year: number; month: number; day: number; weekday: number; hours: number; minutes: number };

function toShopLocal(date: Date): ShopLocalParts {
  const shifted = new Date(date.getTime() + SHOP_UTC_OFFSET_HOURS * 3_600_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

function shopLocalToUtc(year: number, month: number, day: number, hours: number, minutes: number): Date {
  const asIfUtc = Date.UTC(year, month, day, hours, minutes, 0, 0);
  return new Date(asIfUtc - SHOP_UTC_OFFSET_HOURS * 3_600_000);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * The most recent occurrence of the configured schedule that is at or before `now`.
 * For weekly/monthly, walks back day-by-day/month-by-month from `now`'s shop-local
 * date until the configured weekday/day-of-month lines up, then applies the time.
 */
function mostRecentOccurrence(config: BackupReminderConfig, now: Date): Date | undefined {
  const local = toShopLocal(now);
  const [hhText, mmText] = config.time.split(":");
  if (!hhText || !mmText) return undefined;
  const hh = Number(hhText);
  const mm = Number(mmText);

  if (config.frequency === "daily") {
    const todayAtTime = shopLocalToUtc(local.year, local.month, local.day, hh, mm);
    return todayAtTime <= now ? todayAtTime : shopLocalToUtc(local.year, local.month, local.day - 1, hh, mm);
  }

  if (config.frequency === "weekly") {
    if (config.dayOfWeek === undefined) return undefined;
    const daysSinceTarget = (local.weekday - config.dayOfWeek + 7) % 7;
    const candidateDay = local.day - daysSinceTarget;
    const candidate = shopLocalToUtc(local.year, local.month, candidateDay, hh, mm);
    return candidate <= now ? candidate : shopLocalToUtc(local.year, local.month, candidateDay - 7, hh, mm);
  }

  if (config.frequency === "monthly") {
    if (config.dayOfMonth === undefined) return undefined;
    const thisMonthDay = Math.min(config.dayOfMonth, daysInMonth(local.year, local.month));
    const candidate = shopLocalToUtc(local.year, local.month, thisMonthDay, hh, mm);
    if (candidate <= now) return candidate;
    const prevMonth = local.month - 1;
    const prevMonthDay = Math.min(config.dayOfMonth, daysInMonth(local.year, prevMonth));
    return shopLocalToUtc(local.year, prevMonth, prevMonthDay, hh, mm);
  }

  return undefined;
}

/** True when the schedule's most recent due occurrence hasn't been fired yet. */
export function isBackupReminderDue(config: BackupReminderConfig, now: Date = new Date()): boolean {
  if (config.frequency === "off") return false;
  const occurrence = mostRecentOccurrence(config, now);
  if (!occurrence) return false;
  const lastFired = config.lastFiredAt ? new Date(config.lastFiredAt) : undefined;
  return !lastFired || lastFired < occurrence;
}
