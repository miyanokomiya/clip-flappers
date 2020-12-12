import { Vector, Rectangle, getRate } from 'okanvas'

export function getInRange(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(val, min))
}
export function getPedal(p: Vector, base: Vector, vec: Vector): Vector {
  const v1 = vec
  const v2 = { x: p.x - base.x, y: p.y - base.y }
  const dd = v1.x * v1.x + v1.y * v1.y
  const dot = v1.x * v2.x + v1.y * v2.y
  const t = dot / dd
  return { x: v1.x * t, y: v1.y * t }
}
export function isSameRect(a: Rectangle | null, b: Rectangle | null): boolean {
  return (
    !!a &&
    !!b &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  )
}

export function adjustInRect(
  target: Rectangle,
  base: Rectangle,
  centralize = false
): Rectangle {
  const minRate = Math.min(getRate(target, base).minRate, 1)
  const width = target.width * minRate
  const height = target.height * minRate
  return centralize
    ? {
        x: base.x + (base.width - width) / 2,
        y: base.y + (base.height - height) / 2,
        width,
        height,
      }
    : {
        x: getInRange(target.x, base.x, base.x + base.width - width),
        y: getInRange(target.y, base.y, base.y + base.height - height),
        width,
        height,
      }
}
