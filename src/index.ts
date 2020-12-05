import {
  Rectangle as _Rectangle,
  Size as _Size,
  Vector,
  DragArgs,
  PointerListeners,
  fileToBase64,
  base64ToImage as _base64ToImage,
  getCentralizedViewBox,
  getRate,
  useDrag,
  useWindowPointerEffect,
  clipImage as _clipImage,
} from 'okanvas'

import {
  g,
  appendChild,
  appendChildren,
  createSVGElement,
  setStyles,
  setAttribute,
  createHTMLElement,
  createClipRectElm,
} from './el'

export type Rectangle = _Rectangle
export type Size = _Size
export const clipImage = _clipImage
export const base64ToImage = _base64ToImage

interface ErrorMessages {
  invalidImageFile: string
  failedToClipImage: string
}

interface Props {
  viewSize?: Size
  clipSize?: Size
  errorMessages?: ErrorMessages
  onUpdateClip?: (base64: string, clipRect: Rectangle, size: Size) => void
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
    failedToClipImage: 'Failed to clip a image',
  }

  private viewSize: Size = { width: 124, height: 124 }
  private clipSize: Size = { width: 124, height: 124 }
  private disposeWindowPointer: () => void = () => {}
  private dragMode: '' | 'move' | 'resize' = ''
  private clipRect: Rectangle | null = null
  private clipRectOrg: Rectangle | null = null
  private dragListeners: PointerListeners | null = null
  private onUpdateClip:
    | ((base64: string, clipRect: Rectangle, size: Size) => void)
    | null = null

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
    if (props?.onUpdateClip) this.onUpdateClip = props.onUpdateClip

    this.render()
  }

  dispose() {
    if (this.$el?.parentElement) {
      this.$el.parentElement.removeChild(this.$el)
    }
    this.$el = null as any
    this.$svg = null as any
    this.$clipRect = null as any
    this.image = null
    this.disposeWindowPointer()
    this.dragListeners = null
  }

  async clip(): Promise<string> {
    if (!this.image || !this.clipRect) throw new Error('image not loaded')
    return clipImage(this.image, this.clipRect, this.clipSize)
  }

  private render() {
    const $fileInput = createHTMLElement('input', {
      type: 'file',
      accept: 'image/*',
      oninput: (e: any) => this.onInputFile(e),
    })

    const $button = createHTMLElement(
      'button',
      { onclick: () => $fileInput.click() },
      'Select'
    )

    const $svgWrapper = _createSvgWrapperElm(this.viewSize)
    $svgWrapper.ondragover = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
      $svgWrapper.style.opacity = '0.7'
    }
    $svgWrapper.ondragleave = (e: DragEvent) => {
      e.preventDefault()
      $svgWrapper.style.opacity = ''
    }
    $svgWrapper.ondrop = (e: DragEvent) => {
      e.preventDefault()
      $svgWrapper.style.opacity = ''
      this.onInputFile(e)
    }
    this.$svg = _createSvg()

    appendChildren(this.$el, [
      appendChildren(createHTMLElement('div', null, []), [
        $fileInput,
        $button,
        appendChildren($svgWrapper, [this.$svg]),
      ]),
    ])
  }

  private async updateImage() {
    const image = await base64ToImage(this.base64)
    this.image = image
    const viewBoxRect = getCentralizedViewBox(this.clipSize, image)
    const $svg = this.$svg!
    $svg.innerHTML = ''
    setAttribute(
      $svg,
      'viewBox',
      `${viewBoxRect.x} ${viewBoxRect.y} ${viewBoxRect.width} ${viewBoxRect.height}`
    )

    const scale = getRate(
      this.viewSize,
      getCentralizedViewBox(this.clipSize, image)
    ).maxRate

    const dragListeners = useDrag((args) => this.onDrag(args, scale))
    this.dragListeners = dragListeners
    if (this.disposeWindowPointer) {
      this.disposeWindowPointer()
    }
    this.disposeWindowPointer = useWindowPointerEffect({
      onMove: dragListeners.onMove,
      onUp: this.onUp,
    })

    this.clipRect = { ...viewBoxRect }
    this.$clipRect = createClipRectElm(this.clipRect, scale, {
      onStartMove: this.onStartMove,
      onStartResize: this.onStartResize,
    })

    appendChildren($svg, [
      createSVGElement('image', {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
        href: this.base64,
      }),
      this.$clipRect,
    ])
  }

  private onUp = () => {
    if (!this.dragListeners) return
    this.dragListeners.onUp()
    if (this.clipRectOrg) {
      this.onCompleteClip()
    }
    this.dragMode = ''
    this.clipRectOrg = null
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
    appendChild(this.$svg, $clipRect)
    this.clipRect = rect
    this.$clipRect = $clipRect
  }

  private async onCompleteClip() {
    if (!this.image) return
    if (!this.clipRect) return

    if (this.onUpdateClip) {
      this.onUpdateClip(this.base64, this.clipRect, this.clipSize)
    }
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
      const afterDiagonal = _getPedal(
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
    const files = event?.target?.files ?? event.dataTransfer?.files
    if (!files) return
    try {
      this.base64 = await fileToBase64(files[0])
      this.updateImage()
    } catch (e) {
      this.errorMessage = this.errorMessages.invalidImageFile
    }
  }
}

function _createSvgWrapperElm(viewSize: Size): HTMLElement {
  const $svgWrapper = createHTMLElement('div')
  setStyles($svgWrapper, {
    padding: '8px',
    border: '1px solid #000',
    backgroundColor: '#ccc',
    overflow: 'hidden',
    width: `${viewSize.width}px`,
    height: `${viewSize.height}px`,
  })
  return $svgWrapper
}

function _createSvg(): SVGElement {
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

function _getPedal(p: Vector, base: Vector, vec: Vector): Vector {
  const v1 = vec
  const v2 = { x: p.x - base.x, y: p.y - base.y }
  const dd = v1.x * v1.x + v1.y * v1.y
  const dot = v1.x * v2.x + v1.y * v2.y
  const t = dot / dd
  return { x: v1.x * t, y: v1.y * t }
}
