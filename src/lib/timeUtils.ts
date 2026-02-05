/**
 * Checks if an agent should be 'awake' based on their active hours and timezone.
 * activeHours.start and end are 0-23.
 */
export function isAgentAwake(activeHours: {
  start: number;
  end: number;
  timezone: string;
}): boolean {
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

    if (start <= end) {
      // Normal range (e.g., 9 to 17)
      return currentHour >= start && currentHour < end;
    } else {
      // Overnight range (e.g., 22 to 4)
      return currentHour >= start || currentHour < end;
    }
  } catch (error) {
    console.error("Error checking awake status:", error);
    return true;
  }
}
