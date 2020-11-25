import { Size, fileToBase64, base64ToImage } from 'okanvas'

const SVG_URL = 'http://www.w3.org/2000/svg'

const c = (tag: string) => document.createElement(tag)
const cs = (tag: string) => document.createElementNS(SVG_URL, tag)
const g = (el: string) => document.getElementById(el)

interface ErrorMessages {
  invalidImageFile: string
}

interface Props {
  viewSize?: Size
  errorMessages?: ErrorMessages
}

function setStyles(el: HTMLElement, styles: { [key: string]: string }) {
  el.setAttribute(
    'style',
    Object.keys(styles)
      .map((key) => `${key}:${styles[key]};`)
      .join('')
  )
}

export default class ClipFlappers {
  private $el: Element
  private base64 = ''
  private errorMessage = ''
  private errorMessages: ErrorMessages = {
    invalidImageFile: 'Invalid image file.',
  }

  private viewSize: Size = { width: 124, height: 124 }

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

    this.render()
  }

  private render() {
    const $root = c('div')

    const $fileInput = c('input')
    $fileInput.setAttribute('type', 'file')
    $fileInput.setAttribute('accept', 'image/*')
    $fileInput.oninput = (e) => this.onInputFile(e)
    $root.appendChild($fileInput)

    const $button = c('button')
    $button.innerText = 'Select'
    $button.onclick = () => $fileInput.click()
    $root.appendChild($button)

    const $svgWrapper = c('div')
    setStyles($svgWrapper, {
      padding: '8px',
      border: '1px solid #000',
      backgroundColor: '#ccc',
      overflow: 'hidden',
    })
    $svgWrapper.style.width = `${this.viewSize.width}px`
    $svgWrapper.style.height = `${this.viewSize.height}px`

    const $svg = cs('svg')
    $svg.setAttribute('xmlns', SVG_URL)
    $svg.setAttribute('viewBox', '0 0 100 100')
    $svg.style.width = '100%'
    $svg.style.height = '100%'

    $svgWrapper.appendChild($svg)
    $root.appendChild($svgWrapper)

    this.$el.appendChild($root)
  }

  private async updateImage() {
    const image = await base64ToImage(this.base64)
    const $image = cs('image')
    $image.setAttribute('href', this.base64)
    $image.setAttribute('x', '0')
    $image.setAttribute('y', '0')
    $image.setAttribute('width', `${image.width}`)
    $image.setAttribute('height', `${image.height}`)

    const $svg = this.$el.getElementsByTagName('svg')
    $svg[0]?.setAttribute('viewBox', `0 0 ${image.width} ${image.height}`)
    $svg[0]?.appendChild($image)
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
