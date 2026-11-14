import { createTimer } from 'animejs'

type Axis = 'x' | 'y'

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

const screen = document.querySelector<HTMLElement>('#screen')
const badge = document.querySelector<HTMLElement>('#badge')
if (!screen || !badge) {
  throw new Error('index.html must contain both #screen and #badge elements')
}

const limits = (): Record<Axis, number> => ({
  x: screen.clientWidth - badge.offsetWidth,
  y: screen.clientHeight - badge.offsetHeight,
})

const start = limits()
const position: Record<Axis, number> = {
  x: Math.random() * start.x,
  y: Math.random() * start.y,
}
const direction: Record<Axis, 1 | -1> = { x: 1, y: 1 }
let colorIndex = 0

/** Moves one axis and reports whether it hit an edge. */
const advance = (axis: Axis, limit: number, distance: number): boolean => {
  const next = position[axis] + direction[axis] * distance
  const bounced = next <= 0 || next >= limit
  if (bounced) direction[axis] = next <= 0 ? 1 : -1
  position[axis] = Math.min(Math.max(next, 0), limit)
  return bounced
}

const paintColor = (): void => {
  badge.style.color = COLORS[colorIndex % COLORS.length] ?? COLORS[0]
}

paintColor()

createTimer({
  onUpdate: ({ deltaTime }) => {
    const limit = limits()
    const distance = (SPEED * deltaTime) / 1000
    const bouncedX = advance('x', limit.x, distance)
    const bouncedY = advance('y', limit.y, distance)
    if (bouncedX || bouncedY) {
      colorIndex += 1
      paintColor()
    }
    badge.style.transform = `translate(${position.x}px, ${position.y}px)`
  },
})
