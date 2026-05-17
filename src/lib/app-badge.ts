export async function setAppBadgeCount(count: number) {
  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> }).setAppBadge(count);
      } else if ('clearAppBadge' in navigator) {
        await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }
    }
  } catch {
    /* Badging API not supported */
  }
}
