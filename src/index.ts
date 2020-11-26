import {
  Rectangle,
  Size,
  Vector,
  DragArgs,
  PointerListeners,
  fileToBase64,
  base64ToImage,
  getCentralizedViewBox,
  getRate,
  useDrag,
  useWindowPointerEffect,
} from 'okanvas'

const SVG_URL = 'http://www.w3.org/2000/svg'

const g = (el: string) => document.getElementById(el)
const appendChild = ($el: Element, $child: Element) => $el.appendChild($child)
const setAttribute = ($el: Element, name: string, value: string) =>
  $el.setAttribute(name, value)

function createHTMLElement(
  tag: string,
  attributes: { [key: string]: string | number } | null = null,
  children: Element[] | string = []
): HTMLElement {
  const $el = document.createElement(tag)
  return createElement($el, attributes, children)
}

function createSVGElement(
  tag: string,
  attributes: { [key: string]: string | number } | null = null,
  children: Element[] | string = []
): SVGElement {
  const $el = document.createElementNS(SVG_URL, tag)
  return createElement($el, attributes, children)
}

function createElement<T extends Element>(
  $el: T,
  attributes: { [key: string]: string | number } | null = null,
  children: Element[] | string = []
): T {
  for (const key in attributes) {
    setAttribute($el, key, attributes[key].toString())
  }
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      $el.appendChild(children[i])
    }
  } else {
    $el.textContent = children
  }
  return $el
}

function setStyles(el: Element, styles: { [key: string]: string }) {
  el.setAttribute(
    'style',
    Object.keys(styles)
      .map((key) => `${key}:${styles[key]};`)
      .join('')
  )
}

function createClipRectElm(
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
    }),
  ])
  $moveG.onmousedown = listeners.onStartMove
  $moveG.ontouchstart = listeners.onStartMove
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
      }),
    ]
  )
  $resizeG.onmousedown = listeners.onStartResize
  $resizeG.ontouchstart = listeners.onStartResize
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

function getPedal(p: Vector, base: Vector, vec: Vector): Vector {
  const v1 = vec
  const v2 = { x: p.x - base.x, y: p.y - base.y }
  const dd = v1.x * v1.x + v1.y * v1.y
  const dot = v1.x * v2.x + v1.y * v2.y
  const t = dot / dd
  return { x: v1.x * t, y: v1.y * t }
}

interface ErrorMessages {
  invalidImageFile: string
}

interface Props {
  viewSize?: Size
  clipSize?: Size
  errorMessages?: ErrorMessages
}

export default class ClipFlappers {
  private $el: Element
  private $svg: SVGElement | null = null
  private $clipRect: SVGElement | null = null
  private base64 = ''
  private image: HTMLImageElement | null = null
  private errorMessage = ''
  private errorMessages: ErrorMessages = {
    invalidImageFile: 'Invalid image file.',
  }

  private viewSize: Size = { width: 124, height: 124 }
  private clipSize: Size = { width: 124, height: 124 }
  private disposeWindowPointerEffect: () => void = () => {}
  private dragMode: '' | 'move' | 'resize' = ''
  private clipRect: Rectangle | null = null
  private clipRectOrg: Rectangle | null = null
  private dragListeners: PointerListeners | null = null

  constructor(el: string | Element, props?: Props) {
    if (el instanceof Element) {
      this.$el = el
    } else {
      const $el = g(el)
      if (!($el instanceof Element)) {
        throw new Error(`Failed to mount target: ${el}`)
      }
      this.$el = $el
    }

    if (props?.errorMessages) this.errorMessages = props.errorMessages
    if (props?.viewSize) this.viewSize = props.viewSize
    if (props?.clipSize) this.clipSize = props.clipSize

    this.render()
  }

  private render() {
    const $root = createHTMLElement('div', null, [])

    const $fileInput = createHTMLElement('input', {
      type: 'file',
      accept: 'image/*',
    })
    $fileInput.oninput = (e) => this.onInputFile(e)

    const $button = createHTMLElement('button', null, 'Select')
    $button.onclick = () => $fileInput.click()

    const $svgWrapper = createHTMLElement('div')
    setStyles($svgWrapper, {
      padding: '8px',
      border: '1px solid #000',
      backgroundColor: '#ccc',
      overflow: 'hidden',
      width: `${this.viewSize.width}px`,
      height: `${this.viewSize.height}px`,
    })

    const $svg = createSVGElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 100 100',
    })
    setStyles($svg, {
      overflow: 'visible',
      width: '100%',
      height: '100%',
    })
    this.$svg = $svg

    appendChild($svgWrapper, $svg)
    appendChild($root, $fileInput)
    appendChild($root, $button)
    appendChild($root, $svgWrapper)
    appendChild(this.$el, $root)
  }

  private async updateImage() {
    const image = await base64ToImage(this.base64)
    this.image = image
    const $image = createSVGElement('image', {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
      href: this.base64,
    })

    const viewBoxRect = getCentralizedViewBox(this.clipSize, image)
    const $svg = this.$svg!
    $svg.innerHTML = ''
    setAttribute(
      $svg,
      'viewBox',
      `${viewBoxRect.x} ${viewBoxRect.y} ${viewBoxRect.width} ${viewBoxRect.height}`
    )
    appendChild($svg, $image)

    const scale = getRate(
      this.viewSize,
      getCentralizedViewBox(this.clipSize, image)
    ).maxRate

    const dragListeners = useDrag((args) => this.onDrag(args, scale))
    this.dragListeners = dragListeners
    this.disposeWindowPointerEffect = useWindowPointerEffect({
      onMove: dragListeners.onMove,
      onUp: () => {
        dragListeners.onUp()
        this.dragMode = ''
        this.clipRectOrg = null
      },
    })

    const clipRect = { ...viewBoxRect }
    this.clipRect = clipRect
    const $clipRect = createClipRectElm(this.clipRect, scale, {
      onStartMove: this.onStartMove,
      onStartResize: this.onStartResize,
    })
    this.$clipRect = $clipRect
    appendChild($svg, $clipRect)
  }

  private onStartMove = (e: any) => {
    if (!this.clipRect) return
    if (!this.dragListeners) return
    this.dragMode = 'move'
    this.clipRectOrg = { ...this.clipRect }
    this.dragListeners.onDown(e)
  }

  private onStartResize = (e: any) => {
    if (!this.clipRect) return
    if (!this.dragListeners) return
    this.dragMode = 'resize'
    this.clipRectOrg = { ...this.clipRect }
    this.dragListeners.onDown(e)
  }

  private updateClipRect(rect: Rectangle) {
    if (!this.$svg) return
    if (!this.$clipRect) return
    if (!this.image) return
    if (!this.clipRect) return

    const scale = getRate(
      this.viewSize,
      getCentralizedViewBox(this.clipSize, this.image)
    ).maxRate
    const $clipRect = createClipRectElm(this.clipRect, scale, {
      onStartMove: this.onStartMove,
      onStartResize: this.onStartResize,
    })
    this.$svg.removeChild(this.$clipRect)
    this.$svg.appendChild($clipRect)
    this.clipRect = rect
    this.$clipRect = $clipRect
  }

  private onDrag(dragState: DragArgs, scale: number) {
    const dragMode = this.dragMode
    const clipRectOrg = this.clipRectOrg
    const clipSize = this.clipSize

    if (!dragMode) return
    if (!clipRectOrg) return

    if (dragMode === 'move') {
      this.updateClipRect({
        ...clipRectOrg,
        x: clipRectOrg.x + (dragState.p.x - dragState.base.x) * scale,
        y: clipRectOrg.y + (dragState.p.y - dragState.base.y) * scale,
      })
    } else if (dragMode === 'resize') {
      const beforeDiagonal = {
        x: clipRectOrg.width + (dragState.p.x - dragState.base.x) * scale,
        y: clipRectOrg.height + (dragState.p.y - dragState.base.y) * scale,
      }
      const afterDiagonal = getPedal(
        beforeDiagonal,
        { x: 0, y: 0 },
        {
          x: clipSize.width,
          y: clipSize.height,
        }
      )
      this.updateClipRect({
        ...clipRectOrg,
        width: afterDiagonal.x,
        height: afterDiagonal.y,
      })
    }
  }

  private async onInputFile(event: any) {
    try {
      if (!event?.target?.files) return
      this.base64 = await fileToBase64(event.target.files[0])
      this.updateImage()
    } catch (e) {
      this.errorMessage = this.errorMessages.invalidImageFile
    }
  }

  dispose() {
    if (this.$el?.parentElement) {
      this.$el.parentElement.removeChild(this.$el)
    }
    this.$el = null as any
    this.$svg = null as any
    this.$clipRect = null as any
    this.image = null
    this.disposeWindowPointerEffect()
    this.dragListeners = null
  }
}
