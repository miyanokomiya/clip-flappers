import { Rectangle } from 'okanvas'

const SVG_URL = 'http://www.w3.org/2000/svg'

export const g = (el: string) => document.getElementById(el)
export const appendChild = (
  $el: Element | DocumentFragment,
  $child: Element | DocumentFragment
) => $el.appendChild($child)
export const setAttribute = ($el: Element, name: string, value: string) =>
  $el.setAttribute(name, value)

export type Attributes = { [key: string]: string | number | Function } | null

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
  el.setAttribute(
    'style',
    Object.keys(styles)
      .map((key) => `${key}:${styles[key]};`)
      .join('')
  )
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
    createSVGElement('circle', {
      cx: 0,
      cy: 0,
      r: 8 * scale,
      fill: 'red',
      stroke: 'none',
      onmousedown: listeners.onStartMove,
      ontouchstart: listeners.onStartMove,
    }),
  ])
  const $resizeG = createSVGElement(
    'g',
    {
      transform: `translate(${clipRect.width}, ${clipRect.height})`,
    },
    [
      createSVGElement('circle', {
        cx: 0,
        cy: 0,
        r: 8 * scale,
        fill: 'red',
        stroke: 'none',
        onmousedown: listeners.onStartResize,
        ontouchstart: listeners.onStartResize,
      }),
    ]
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
