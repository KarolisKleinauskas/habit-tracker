// Fixed palette for habits. Mid-tone colors that read well on both light and dark backgrounds.
export const HABIT_COLORS = {
  red: { label: "Raudona", hex: "#ef4444" },
  orange: { label: "Oranžinė", hex: "#f97316" },
  amber: { label: "Geltona", hex: "#eab308" },
  green: { label: "Žalia", hex: "#22c55e" },
  teal: { label: "Žalsvai mėlyna", hex: "#14b8a6" },
  blue: { label: "Mėlyna", hex: "#3b82f6" },
  violet: { label: "Violetinė", hex: "#8b5cf6" },
  pink: { label: "Rožinė", hex: "#ec4899" },
} as const;

export type HabitColor = keyof typeof HABIT_COLORS;

export const HABIT_COLOR_KEYS = Object.keys(HABIT_COLORS) as [HabitColor, ...HabitColor[]];

export const DEFAULT_HABIT_COLOR: HabitColor = "green";

export function habitColorHex(color: string): string {
  return color in HABIT_COLORS
    ? HABIT_COLORS[color as HabitColor].hex
    : HABIT_COLORS[DEFAULT_HABIT_COLOR].hex;
}
