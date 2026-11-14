import { createTimer } from 'animejs'

type Axis = 'x' | 'y'
type Point = Record<Axis, number>

const AXES = ['x', 'y'] as const

/** Travel speed along each axis, in pixels per second. */
const SPEED = 150
const COLORS = [
  '#ffffff',
  '#ffff00',
  '#00ffff',
  '#00ff00',
  '#ff00ff',
  '#ff0000',
] as const
/** Easter egg: this many clicks in a row make every bounce land in a corner. */
const SECRET_CLICKS = 15
/** Longest pause between two clicks that still counts as "in a row". */
const CLICK_GAP_MS = 1000
/** Longest frame time the motion honours, so a stalled frame cannot jump. */
const MAX_FRAME_MS = 100

const screen = document.querySelector<HTMLElement>('#screen')
const badge = document.querySelector<HTMLElement>('#badge')
if (!screen || !badge) {
  throw new Error('index.html must contain both #screen and #badge elements')
}

const limits = (): Point => ({
  x: screen.clientWidth - badge.offsetWidth,
  y: screen.clientHeight - badge.offsetHeight,
})

const start = limits()
const position: Point = {
  x: Math.random() * start.x,
  y: Math.random() * start.y,
}
const direction: Record<Axis, 1 | -1> = { x: 1, y: 1 }
let colorIndex = 0
/** Corner being chased, as 0/1 fractions of the limits; null while roaming. */
let corner: Point | null = null
let clicks = 0
let lastClickAt = 0

const clamp = (value: number, limit: number): number =>
  Math.min(Math.max(value, 0), limit)

/** Moves one axis and reports whether it hit an edge. */
const advance = (axis: Axis, limit: number, distance: number): boolean => {
  const next = position[axis] + direction[axis] * distance
  const bounced = next <= 0 || next >= limit
  if (bounced) direction[axis] = next <= 0 ? 1 : -1
  position[axis] = clamp(next, limit)
  return bounced
}

/** Bounces off the walls and reports whether any edge was hit. */
const roam = (limit: Point, distance: number): boolean => {
  const bouncedX = advance('x', limit.x, distance)
  const bouncedY = advance('y', limit.y, distance)
  return bouncedX || bouncedY
}

/**
 * Heads straight for the `goal` corner and reports whether it landed there.
 * On landing, the next corner is picked: diagonally across from a top corner,
 * straight up from a bottom one. That tour visits all four corners.
 */
const chase = (goal: Point, limit: Point, distance: number): boolean => {
  const target: Point = { x: goal.x * limit.x, y: goal.y * limit.y }
  const remaining = Math.hypot(target.x - position.x, target.y - position.y)
  const landed = remaining <= distance
  for (const axis of AXES) {
    const step = ((target[axis] - position[axis]) * distance) / remaining
    position[axis] = landed
      ? target[axis]
      : clamp(position[axis] + step, limit[axis])
  }
  if (landed) {
    corner = { x: goal.y === 0 ? 1 - goal.x : goal.x, y: 1 - goal.y }
  }
  return landed
}

const paintColor = (): void => {
  badge.style.color = COLORS[colorIndex % COLORS.length] ?? COLORS[0]
}

paintColor()

window.addEventListener('pointerdown', ({ timeStamp }) => {
  clicks = timeStamp - lastClickAt <= CLICK_GAP_MS ? clicks + 1 : 1
  lastClickAt = timeStamp
  if (clicks === SECRET_CLICKS && !corner) {
    corner = { x: direction.x > 0 ? 1 : 0, y: direction.y > 0 ? 1 : 0 }
  }
})

const tick = ({ deltaTime }: { deltaTime: number }): void => {
  const limit = limits()
  // anime.js reports a huge negative deltaTime on the first tick, and a long
  // gap after the tab resumes; either would slam the badge into a wall.
  const elapsed = Math.min(Math.max(deltaTime, 0), MAX_FRAME_MS)
  const distance = (SPEED * elapsed) / 1000
  // SPEED is per axis, so the pace along the travel line is √2 times that.
  const bounced = corner
    ? chase(corner, limit, distance * Math.SQRT2)
    : roam(limit, distance)
  if (bounced) {
    colorIndex += 1
    paintColor()
  }
  badge.style.transform = `translate(${position.x}px, ${position.y}px)`
}

createTimer({ onUpdate: tick })
