import { Size, Rectangle } from 'okanvas'

const SVG_URL = 'http://www.w3.org/2000/svg'

export const g = (el: string) => document.getElementById(el)
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
  const $moveG = createSVGElement('g', null, [
    createMoveAnchor(scale, listeners.onStartMove),
  ])
  const $resizeG = createSVGElement(
    'g',
    {
      transform: `translate(${clipRect.width}, ${clipRect.height})`,
    },
    [createResizeAnchor(scale, listeners.onStartResize)]
  )
  const $g = createSVGElement(
    'g',
    {
      transform: `translate(${clipRect.x}, ${clipRect.y})`,
    },
    [
      createSVGElement('rect', {
        x: 0,
        y: 0,
        width: clipRect.width,
        height: clipRect.height,
        fill: 'none',
        stroke: 'red',
        'stroke-width': 4 * scale,
      }),
      $moveG,
      $resizeG,
    ]
  )
  return $g
}

export function createSvgWrapperElm(viewSize: Size): HTMLElement {
  const $svgWrapper = createHTMLElement('div')
  setStyles($svgWrapper, {
    padding: '8px',
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
  return createSVGElement('circle', {
    cx: 0,
    cy: 0,
    r: 8 * scale,
    fill: 'red',
    stroke: 'none',
    onmousedown: onStartMove,
    ontouchstart: onStartMove,
  })
}

function createResizeAnchor(
  scale: number,
  onStartMove: (e: any) => void
): SVGElement {
  return createSVGElement('circle', {
    cx: 0,
    cy: 0,
    r: 8 * scale,
    fill: 'red',
    stroke: 'none',
    onmousedown: onStartMove,
    ontouchstart: onStartMove,
  })
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
          d: 'M0,45 L0,40 L15,25 L20,30 L30,20 L50,40 L50,45z',
        }),
        createSVGElement('circle', { cx: '10', cy: '15', r: '4' }),
      ]),
    ]),
  ])
}

export function createDeleteSVG(): SVGElement {
  return appendChildren(createSvg(), [
    createSVGElement('g', null, [
      createSVGElement('circle', {
        cx: 50,
        cy: 50,
        r: 50,
        fill: 'none',
        stroke: '#aaa',
        'stroke-width': 10,
      }),
      createSVGElement('path', {
        d: 'M24,24 L76,76 M24,76 L76,24',
        fill: 'none',
        stroke: '#aaa',
        'stroke-width': 12,
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
