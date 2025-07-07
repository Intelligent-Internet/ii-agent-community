/**
 * Format currency values with proper locale and currency symbols
 */
export function formatCurrency(
  value: number,
  currency: string = "USD",
  locale: string = "en-US",
  options: Intl.NumberFormatOptions = {}
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  // For very large numbers, use compact notation
  if (Math.abs(value) >= 1e9) {
    defaultOptions.notation = "compact";
    defaultOptions.compactDisplay = "short";
  } else if (Math.abs(value) >= 1e6) {
    defaultOptions.notation = "compact";
    defaultOptions.compactDisplay = "short";
  }

  // For very small numbers, increase decimal places
  if (Math.abs(value) < 1 && Math.abs(value) > 0) {
    defaultOptions.minimumFractionDigits = 4;
    defaultOptions.maximumFractionDigits = 8;
  }

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(value);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format percentage values with proper signs and colors
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  includeSign: boolean = true
): string {
  const formatted = Math.abs(value).toFixed(decimals);
  const sign = value >= 0 ? "+" : "-";
  
  return includeSign ? `${sign}${formatted}%` : `${formatted}%`;
}

/**
 * Format large numbers with appropriate suffixes (K, M, B, T)
 */
export function formatLargeNumber(
  value: number,
  decimals: number = 1
): string {
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixIndex = 0;
  let formattedValue = value;

  while (Math.abs(formattedValue) >= 1000 && suffixIndex < suffixes.length - 1) {
    formattedValue /= 1000;
    suffixIndex++;
  }

  return `${formattedValue.toFixed(decimals)}${suffixes[suffixIndex]}`;
}

/**
 * Format market cap values
 */
export function formatMarketCap(value: number): string {
  return formatCurrency(value, "USD", "en-US", {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format volume values
 */
export function formatVolume(value: number): string {
  return formatCurrency(value, "USD", "en-US", {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

/**
 * Format date/time values
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", defaultOptions).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "unknown time";
  }
}

/**
 * Get color class based on percentage change
 */
export function getChangeColor(value: number): string {
  if (value > 0) return "text-green-500";
  if (value < 0) return "text-red-500";
  return "text-gray-400";
}

/**
 * Get color class for backgrounds based on percentage change
 */
export function getChangeBgColor(value: number): string {
  if (value > 0) return "bg-green-500/10 text-green-500";
  if (value < 0) return "bg-red-500/10 text-red-500";
  return "bg-gray-500/10 text-gray-400";
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Generate a random color for charts/avatars
 */
export function generateColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}