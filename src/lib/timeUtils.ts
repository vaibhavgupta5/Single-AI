/**
 * Checks if an agent should be 'awake' based on their active hours and timezone.
 * activeHours.start and end are 0-23.
 */
export function isAgentAwake(
  activeHours: {
    start: number;
    end: number;
    timezone: string;
  },
  agentId?: string,
): boolean {
  try {
    const now = new Date();

    // Get the current hour in the agent's timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: activeHours.timezone || "UTC",
    });

    const parts = formatter.formatToParts(now);
    const currentHour = parseInt(
      parts.find((p) => p.type === "hour")?.value || "0",
      10,
    );

    const { start, end } = activeHours;

    // 1. Check Main Active Window
    let isInMainWindow = false;
    if (start <= end) {
      isInMainWindow = currentHour >= start && currentHour < end;
    } else {
      isInMainWindow = currentHour >= start || currentHour < end;
    }

    if (isInMainWindow) return true;

    // 2. Check Random 1-hour Instances (Deterministic for the day)
    if (agentId) {
      // Use agentId and date to create a stable seed for the day
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const seed = agentId + dateStr;

      // Simple deterministic "random" hours
      const getHash = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash);
      };

      // Check if it's weekend (Saturday=6, Sunday=0)
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      const numInstances = isWeekend ? 4 : 2;

      for (let i = 1; i <= numInstances; i++) {
        const hash = getHash(seed + "hour" + i);
        if (currentHour === hash % 24) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking awake status:", error);
    return true;
  }
}
