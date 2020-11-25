import {
  Size,
  fileToBase64,
  base64ToImage,
  getCentralizedViewBox,
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
  private base64 = ''
  private errorMessage = ''
  private errorMessages: ErrorMessages = {
    invalidImageFile: 'Invalid image file.',
  }

  private viewSize: Size = { width: 124, height: 124 }
  private clipSize: Size = { width: 124, height: 124 }

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
    })
    setStyles($svgWrapper, {
      width: `${this.viewSize.width}px`,
      height: `${this.viewSize.height}px`,
    })

    const $svg = createSVGElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 100 100',
    })
    setStyles($svg, {
      width: '100%',
      height: '100%',
    })

    appendChild($svgWrapper, $svg)
    appendChild($root, $fileInput)
    appendChild($root, $button)
    appendChild($root, $svgWrapper)
    appendChild(this.$el, $root)
  }

  private async updateImage() {
    const image = await base64ToImage(this.base64)
    const $image = createSVGElement('image', {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
      href: this.base64,
    })

    const $svg = this.$el.getElementsByTagName('svg')[0]!
    $svg.innerHTML = ''
    setAttribute($svg, 'viewBox', `0 0 ${image.width} ${image.height}`)
    appendChild($svg, $image)

    const scale = 1
    const clipRect = getCentralizedViewBox(this.clipSize, image)
    const $clipRect = createSVGElement(
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
        createSVGElement('g', null, [
          createSVGElement('circle', {
            cx: 0,
            cy: 0,
            r: 8 * scale,
            fill: 'red',
            stroke: 'none',
          }),
        ]),
        createSVGElement(
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
        ),
      ]
    )

    appendChild($svg, $clipRect)
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
  }
}
