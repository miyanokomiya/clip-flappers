import {
  Rectangle as _Rectangle,
  Size as _Size,
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
  getElementById,
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
  createOverflowSVG,
  show,
  hide,
  bindDrop,
} from './el'

import { getPedal, isSameRect, adjustInRect } from './geo'

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
  overflow?: boolean
  errorMessages?: ErrorMessages
  onUpdateClip?: (base64: string, clipRect: Rectangle, size: Size) => void
}

const EL_PREFIX = 'clip-f'
type EL_KEYS = 'error' | 'drop' | 'delete' | 'overflow' | 'tools'

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

  private overflow: boolean = false

  constructor(el: string | Element, props?: Props) {
    if (el instanceof Element) {
      this.$el = el
    } else {
      const $el = getElementById(el)
      if (!($el instanceof Element)) {
        throw new Error(`Failed to mount target: ${el}`)
      }
      this.$el = $el
    }

    if (props?.errorMessages) this.errorMessages = props.errorMessages
    if (props?.viewSize) this.viewSize = props.viewSize
    if (props?.clipSize) this.clipSize = props.clipSize
    if (props?.onUpdateClip) this.onUpdateClip = props.onUpdateClip
    if (props?.overflow) this.overflow = props.overflow

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
    hide(this.getElement('tools'))
  }

  toggleOverflow() {
    this.overflow = !this.overflow
    const $overflowButton = this.getElement('overflow')
    if ($overflowButton) {
      $overflowButton.innerHTML = ''
      appendChild($overflowButton, createOverflowSVG(this.overflow))
    }
    if (this.clipRect) {
      const oldClipRect = { ...this.clipRect }
      this.updateClipRect(this.clipRect)
      if (!isSameRect(oldClipRect, this.clipRect)) this.onCompleteClip()
    }
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

    const toolButtonStyles = {
      ...getResetStyles(),
      width: '20px',
      height: '20px',
      'border-radius': '100%',
      cursor: 'pointer',
      'margin-bottom': '6px',
    }

    const $deleteButton = createHTMLElement(
      'button',
      {
        onclick: () => this.reset(),
        ..._getDataKey('delete'),
      },
      [createDeleteSVG()]
    )
    setStyles($deleteButton, toolButtonStyles)

    const $overflowButton = createHTMLElement(
      'button',
      {
        onclick: () => this.toggleOverflow(),
        ..._getDataKey('overflow'),
      },
      [createOverflowSVG(this.overflow)]
    )
    setStyles($overflowButton, toolButtonStyles)

    const $tools = createHTMLElement(
      'div',
      {
        style: 'position:absolute;top:2px;right:2px;',
        ..._getDataKey('tools'),
      },
      [
        createHTMLElement(
          'div',
          { style: 'display:flex;flex-direction:column;' },
          [$deleteButton, $overflowButton]
        ),
      ]
    )
    hide($tools)

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
    bindDrop($svgWrapper, (e) => this.onInputFile(e))
    this.$svg = createSvg()
    hide(this.$svg)

    appendChildren(this.$el, [
      appendChildren(createHTMLElement('div', null, []), [
        $fileInput,
        appendChildren($svgWrapper, [
          this.$svg,
          $dropButton,
          $tools,
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
    show(this.getElement('tools'))

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

    this.clipRect = this.overflow
      ? { ...viewBoxRect }
      : adjustInRect(
          viewBoxRect,
          {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          },
          true
        )

    this.$clipRect = createClipRectElm(this.clipRect, scale, {
      onStartMove: this.onStartMove,
      onStartResize: this.onStartResize,
    })

    appendChildren($svg, [
      createSVGElement('image', {
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
    if (!this.clipRect || !this.dragListeners) return
    this.dragMode = 'move'
    this.clipRectOrg = { ...this.clipRect }
    this.dragListeners.onDown(e)
  }

  private onStartResize = (e: any) => {
    if (!this.clipRect || !this.dragListeners) return
    this.dragMode = 'resize'
    this.clipRectOrg = { ...this.clipRect }
    this.dragListeners.onDown(e)
  }

  private updateClipRect(_rect: Rectangle) {
    if (!this.$svg || !this.$clipRect || !this.image || !this.clipRect) return

    const rect = this.overflow
      ? _rect
      : adjustInRect(_rect, {
          x: 0,
          y: 0,
          width: this.image.width,
          height: this.image.height,
        })

    if (isSameRect(this.clipRect, rect)) return

    this.clipRect = rect
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
    this.$clipRect = $clipRect
  }

  private async onCompleteClip() {
    if (!this.base64 || !this.clipRect || !this.onUpdateClip) return
    this.onUpdateClip(this.base64, this.clipRect, this.clipSize)
  }

  private onDrag(dragState: DragArgs, scale: number) {
    const dragMode = this.dragMode
    const clipRectOrg = this.clipRectOrg
    const clipSize = this.clipSize

    if (!dragMode || !clipRectOrg) return

    const dx = (dragState.p.x - dragState.base.x) * scale
    const dy = (dragState.p.y - dragState.base.y) * scale

    if (dragMode === 'move') {
      this.updateClipRect({
        ...clipRectOrg,
        x: clipRectOrg.x + dx,
        y: clipRectOrg.y + dy,
      })
    } else if (dragMode === 'resize') {
      const beforeDiagonal = {
        x: clipRectOrg.width + dx,
        y: clipRectOrg.height + dy,
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

function _getDataKey(key: EL_KEYS): { 'data-key': string } {
  return {
    'data-key': `${EL_PREFIX}_${key}`,
  }
}
