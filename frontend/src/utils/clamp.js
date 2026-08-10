// Keeps a number inside a range, so pointer maths never overshoots its limit.
export default function clamp(value, min = -1, max = 1) {
  return Math.min(max, Math.max(min, value))
}
