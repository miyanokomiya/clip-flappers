import ClipFlappers, { Rectangle, Size, clipImage } from '../src/index'

async function addImage(base64: string) {
  const $image = new Image()
  $image.onload = () => {
    $image.style.border = 'solid 1px black'
    $image.style.margin = '2px'
    document.body.appendChild($image)
  }
  $image.src = base64
}

async function onUpdateClip(base64: string, clipRect: Rectangle, size: Size) {
  const clipped = await clipImage(base64, clipRect, size)
  addImage(clipped)
}

const clipFlappers = new ClipFlappers('target', {
  viewSize: {
    width: 300,
    height: 200,
  },
  onUpdateClip: onUpdateClip,
})

document.getElementById('dispose')?.addEventListener('click', () => {
  clipFlappers?.dispose()
})
document.getElementById('clip')?.addEventListener('click', async () => {
  const base64 = await clipFlappers?.clip()
  addImage(base64)
})
