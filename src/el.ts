import { Vector, Size, Rectangle } from 'okanvas'
import { getRectOutline } from './geo'

const SVG_URL = 'http://www.w3.org/2000/svg'

export const getElementById = (el: string) => document.getElementById(el)
export const appendChild = (
  $el: Element | DocumentFragment,
  $child: Element | DocumentFragment
) => $el.appendChild($child)
export const setAttribute = ($el: Element, name: string, value: string) =>
  $el.setAttribute(name, value)

export type Attributes = { [key: string]: string | number | Function } | null

export function getResetStyles() {
  return {
    padding: '0',
    margin: '0',
    border: 'none',
    'background-color': 'transparent',
  }
}

export function appendChildren<T extends Element>(
  $parent: T,
  $children: Element[]
): T {
  const $fragment = document.createDocumentFragment()
  $children.forEach(($c) => appendChild($fragment, $c))
  appendChild($parent, $fragment)
  return $parent
}

export function createHTMLElement(
  tag: string,
  attributes: Attributes = null,
  children: Element[] | string = []
): HTMLElement {
  const $el = document.createElement(tag)
  return createElement($el, attributes, children)
}

export function createSVGElement(
  tag: string,
  attributes: Attributes = null,
  children: Element[] | string = []
): SVGElement {
  const $el = document.createElementNS(SVG_URL, tag)
  return createElement($el, attributes, children)
}

export function createElement<T extends Element>(
  $el: T,
  attributes: Attributes = null,
  children: Element[] | string = []
): T {
  for (const key in attributes) {
    const attr = attributes[key]
    if (typeof attr === 'function') {
      ;($el as any)[key] = attr
    } else {
      setAttribute($el, key, attributes[key].toString())
    }
  }
  if (Array.isArray(children)) {
    const $fragment = document.createDocumentFragment()
    for (let i = 0; i < children.length; i++) {
      $fragment.appendChild(children[i])
    }
    $el.appendChild($fragment)
  } else {
    $el.textContent = children
  }
  return $el
}

export function setStyles(el: Element, styles: { [key: string]: string }) {
  if (el) {
    el.setAttribute(
      'style',
      Object.keys(styles)
        .map((key) => `${key}:${styles[key]};`)
        .join('')
    )
  }
}

export function createClipRectElm(
  clipRect: Rectangle,
  scale: number,
  listeners: {
    onStartMove: (e: any) => void
    onStartResize: (e: any) => void
  }
): SVGElement {
  const lineWidth = 4 * scale
  const anchorOffset = 6 * scale

  const $moveG = createSVGElement(
    'g',
    { transform: `translate(${-anchorOffset}, ${-anchorOffset})` },
    [createMoveAnchor(scale, listeners.onStartMove)]
  )
  const $resizeG = createSVGElement(
    'g',
    {
      transform: `translate(${anchorOffset + clipRect.width}, ${
        anchorOffset + clipRect.height
      })`,
    },
    [createResizeAnchor(scale, listeners.onStartResize)]
  )
  return createSVGElement(
    'g',
    { transform: `translate(${clipRect.x}, ${clipRect.y})` },
    [
      createSVGElement('path', {
        d: getD(getRectOutline(clipRect, lineWidth)),
        fill: 'red',
        stroke: 'none',
      }),
      $moveG,
      $resizeG,
    ]
  )
}

export function updateClipRectElm(
  $el: SVGElement,
  clipRect: Rectangle,
  scale: number
) {
  const lineWidth = 4 * scale
  const anchorOffset = 6 * scale
  const $path = $el.children[0]
  const $resize = $el.children[2]

  $el.setAttribute('transform', `translate(${clipRect.x}, ${clipRect.y})`)
  $path.setAttribute('d', getD(getRectOutline(clipRect, lineWidth)))
  $resize.setAttribute(
    'transform',
    `translate(${anchorOffset + clipRect.width}, ${
      anchorOffset + clipRect.height
    })`
  )
}

export function createSvgWrapperElm(viewSize: Size): HTMLElement {
  const $svgWrapper = createHTMLElement('div')
  setStyles($svgWrapper, {
    padding: '16px',
    border: '3px solid #aaa',
    'border-radius': '8px',
    'background-color': '#f4f4f4',
    overflow: 'hidden',
    position: 'relative',
    width: `${viewSize.width}px`,
    height: `${viewSize.height}px`,
  })
  return $svgWrapper
}

export function createSvg(): SVGElement {
  const $svg = createSVGElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 100 100',
  })
  setStyles($svg, {
    overflow: 'visible',
    width: '100%',
    height: '100%',
  })
  return $svg
}

function createMoveAnchor(
  scale: number,
  onStartMove: (e: any) => void
): SVGElement {
  return createSVGElement(
    'g',
    {
      onmousedown: onStartMove,
      ontouchstart: onStartMove,
      transform: `scale(${scale})`,
      stroke: 'none',
      style: 'cursor:pointer',
    },
    [
      createSVGElement('circle', {
        r: 8,
        fill: 'red',
      }),
      createSVGElement('path', {
        d: 'M-6-2L-6 2L6 2L6-2zM-2-6L-2 6L2 6L2-6z',
        fill: '#fff',
      }),
    ]
  )
}

function createResizeAnchor(
  scale: number,
  onStartResize: (e: any) => void
): SVGElement {
  return createSVGElement(
    'g',
    {
      onmousedown: onStartResize,
      ontouchstart: onStartResize,
      transform: `scale(${scale}) rotate(45)`,
      stroke: 'none',
      style: 'cursor:pointer',
    },
    [
      createSVGElement('circle', {
        r: 8,
        fill: 'red',
      }),
      createSVGElement('path', {
        d: 'M-2-2-2-5L-7 0L-2 5L-2 2L2 2L2 5L7 0L2-5L2-2z',
        fill: '#fff',
      }),
    ]
  )
}

export function createPhotoSVG(): SVGElement {
  return appendChildren(createSvg(), [
    createSVGElement('g', { transform: 'translate(25,25)' }, [
      createSVGElement('rect', {
        width: '50',
        height: '50',
        rx: '4',
        ry: '4',
        fill: 'none',
        stroke: '#aaa',
        'stroke-width': '2',
      }),
      createSVGElement('g', { fill: '#aaa' }, [
        createSVGElement('path', {
          d: 'M0 45L0 40L15 25L20 30L30 20L50 40L50 45z',
        }),
        createSVGElement('circle', { cx: '10', cy: '15', r: '4' }),
      ]),
    ]),
  ])
}

function createIconCircle(color = '#aaa'): SVGElement {
  return createSVGElement('circle', {
    cx: 50,
    cy: 50,
    r: 50,
    fill: 'none',
    stroke: color,
    'stroke-width': 10,
  })
}

export function createDeleteSVG(): SVGElement {
  return appendChildren(createSvg(), [
    createSVGElement('g', null, [
      createIconCircle(),
      createSVGElement('path', {
        d: 'M24 24L76 76M24 76L76,24',
        fill: 'none',
        stroke: '#aaa',
        'stroke-width': 12,
      }),
    ]),
  ])
}

export function createOverflowSVG(light = false): SVGElement {
  const color = light ? 'limegreen' : '#aaa'
  return appendChildren(createSvg(), [
    createSVGElement('g', null, [
      createIconCircle(color),
      createSVGElement('path', {
        d: 'M40 6L40 80L14 80',
        fill: 'none',
        stroke: color,
        'stroke-width': 8,
      }),
      createSVGElement('path', {
        d: 'M90 50L60 80L60 58L20 58L20 42L60 42L60 20z',
        fill: color,
        stroke: 'none',
      }),
    ]),
  ])
}

export function show<T extends HTMLElement | SVGElement | null>(
  $el: T,
  display?: string
): T {
  if ($el) {
    $el.style.display = display ?? ''
  }
  return $el
}

export function hide<T extends HTMLElement | SVGElement | null>($el: T): T {
  if ($el) {
    $el.style.display = 'none'
  }
  return $el
}

export function bindDrop(
  $el: HTMLElement | SVGElement,
  onDrop: (e: DragEvent) => void
) {
  $el.ondragover = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
    $el.style.opacity = '0.7'
  }
  $el.ondragleave = (e: DragEvent) => {
    e.preventDefault()
    $el.style.opacity = ''
  }
  $el.ondrop = (e: DragEvent) => {
    e.preventDefault()
    $el.style.opacity = ''
    onDrop(e)
  }
}

function getD(polygon: Vector[]): string {
  return `M${polygon.map((p) => `${p.x} ${p.y}`).join('L')}z`
}
