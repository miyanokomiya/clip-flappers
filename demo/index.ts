import { ClipFlappers, Rectangle, Size, clipImage } from '../src/index'

let clipFlappers: ClipFlappers | null = null

async function addImage(base64: string) {
  const $image = new Image()
  $image.onload = () => {
    $image.style.border = 'solid 1px black'
    $image.style.margin = '2px'
    const $clippedWrapper = document.getElementById('clipped')!
    $clippedWrapper.innerHTML = ''
    $clippedWrapper.appendChild($image)
  }
  $image.src = base64
}

async function onUpdateClip(base64: string, clipRect: Rectangle, size: Size) {
  const clipped = await clipImage(base64, clipRect, size)
  addImage(clipped)
}

function init() {
  clipFlappers = new ClipFlappers('target', {
    viewSize: {
      width: 300,
      height: 200,
    },
    onUpdateClip: onUpdateClip,
  })
}

document.getElementById('init')?.addEventListener('click', () => {
  clipFlappers?.dispose()
  init()
})
document.getElementById('dispose')?.addEventListener('click', () => {
  if (!clipFlappers) return
  clipFlappers.dispose()
  clipFlappers = null
})
document.getElementById('clip')?.addEventListener('click', async () => {
  if (!clipFlappers) return
  const base64 = await clipFlappers.clip()
  addImage(base64)
})

init()
