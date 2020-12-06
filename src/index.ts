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
  getResetStyles,
  appendChild,
  appendChildren,
  createSVGElement,
  setStyles,
  setAttribute,
  createHTMLElement,
  createClipRectElm,
  createSvgWrapperElm,
  createSvg,
  createPhotoSVG,
  createDeleteSVG,
  show,
  hide,
} from './el'

export type Rectangle = _Rectangle
export type Size = _Size
export const clipImage = _clipImage
export const base64ToImage = _base64ToImage

export interface ErrorMessages {
  invalidImageFile: string
}

interface Props {
  viewSize?: Size
  clipSize?: Size
  errorMessages?: ErrorMessages
  onUpdateClip?: (base64: string, clipRect: Rectangle, size: Size) => void
}

const EL_PREFIX = 'clip-f'
type EL_KEYS = 'error' | 'drop' | 'delete'

export class ClipFlappers {
  private $el: Element
  private $svg: SVGElement | null = null
  private $clipRect: SVGElement | null = null
  private base64 = ''
  private image: HTMLImageElement | null = null
  private errorMessages: ErrorMessages = {
    invalidImageFile: 'Invalid image file.',
  }

  private errorTimer = 0

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
    this.$el.innerHTML = ''
    this.$el = null as any
    this.$svg = null
    this.$clipRect = null
    this.image = null
    this.disposeWindowPointer()
    this.dragListeners = null
  }

  reset() {
    this.$clipRect = null
    this.image = null
    this.disposeWindowPointer()
    this.dragListeners = null
    this.$svg!.innerHTML = ''
    hide(this.$svg)
    show(this.getElement('drop'))
    hide(this.getElement('delete'))
  }

  async clip(): Promise<string> {
    if (!this.image || !this.clipRect) throw new Error('image not loaded')
    return clipImage(this.image, this.clipRect, this.clipSize)
  }

  private getElement(key: EL_KEYS): HTMLElement | SVGElement | null {
    return this.$el.querySelector(`[data-key="${EL_PREFIX}_${key}"]`)
  }

  private render() {
    const $fileInput = createHTMLElement('input', {
      type: 'file',
      accept: 'image/*',
      oninput: (e: any) => this.onInputFile(e),
    })
    hide($fileInput)

    const $dropButton = createHTMLElement(
      'button',
      {
        onclick: () => $fileInput.click(),
        ..._getDataKey('drop'),
      },
      [createPhotoSVG()]
    )
    setStyles($dropButton, {
      ...getResetStyles(),
      width: '100%',
      height: '100%',
      cursor: 'pointer',
    })

    const $deleteButton = createHTMLElement(
      'button',
      {
        onclick: () => this.reset(),
        ..._getDataKey('delete'),
      },
      [createDeleteSVG()]
    )
    setStyles($deleteButton, {
      ...getResetStyles(),
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '20px',
      height: '20px',
      'border-radius': '100%',
      cursor: 'pointer',
    })
    hide($deleteButton)

    const $errorMessage = createHTMLElement('p', {
      ..._getDataKey('error'),
      onclick: () => this.hideError(),
    })
    setStyles($errorMessage, {
      ...getResetStyles(),
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      padding: '4px 8px',
      color: 'white',
      'background-color': 'red',
      'font-size': '16px',
      'word-break': 'break-all',
      cursor: 'pointer',
      transition: '0.5s all',
      transform: 'translateY(100%)',
    })

    const $svgWrapper = createSvgWrapperElm(this.viewSize)
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
    this.$svg = createSvg()
    hide(this.$svg)

    appendChildren(this.$el, [
      appendChildren(createHTMLElement('div', null, []), [
        $fileInput,
        appendChildren($svgWrapper, [
          this.$svg,
          $dropButton,
          $deleteButton,
          $errorMessage,
        ]),
      ]),
    ])
  }

  private async updateImage(base64: string) {
    let image = null
    try {
      image = await base64ToImage(base64)
    } catch (e) {
      this.setErrorMessage('invalidImageFile')
    }
    if (!image) return

    this.base64 = base64
    this.image = image
    const viewBoxRect = getCentralizedViewBox(this.clipSize, image)
    const $svg = this.$svg!
    $svg.innerHTML = ''
    show($svg)
    setAttribute(
      $svg,
      'viewBox',
      `${viewBoxRect.x} ${viewBoxRect.y} ${viewBoxRect.width} ${viewBoxRect.height}`
    )
    hide(this.getElement('drop'))
    show(this.getElement('delete'))

    const scale = getRate(
      this.viewSize,
      getCentralizedViewBox(this.clipSize, image)
    ).maxRate

    const dragListeners = useDrag((args) => this.onDrag(args, scale))
    this.dragListeners = dragListeners
    this.disposeWindowPointer()
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
      const base64 = await fileToBase64(files[0])
      this.updateImage(base64)
    } catch (e) {
      this.setErrorMessage('invalidImageFile')
    }
  }

  private setErrorMessage(message: keyof ErrorMessages) {
    const $errorEl = this.getElement('error')
    if ($errorEl) {
      $errorEl.textContent = this.errorMessages[message]
      $errorEl.style.transform = ''
      clearTimeout(this.errorTimer as any)
      this.errorTimer = setTimeout(() => this.hideError(), 5000) as any
    }
  }

  private hideError() {
    const $errorEl = this.getElement('error')
    if ($errorEl) {
      $errorEl.style.transform = 'translateY(100%)'
      clearTimeout(this.errorTimer as any)
      this.errorTimer = 0
    }
  }
}

function _getPedal(p: Vector, base: Vector, vec: Vector): Vector {
  const v1 = vec
  const v2 = { x: p.x - base.x, y: p.y - base.y }
  const dd = v1.x * v1.x + v1.y * v1.y
  const dot = v1.x * v2.x + v1.y * v2.y
  const t = dot / dd
  return { x: v1.x * t, y: v1.y * t }
}

function _getDataKey(key: EL_KEYS): { 'data-key': string } {
  return {
    'data-key': `${EL_PREFIX}_${key}`,
  }
}
