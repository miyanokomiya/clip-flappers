import ClipFlappers from '../src/index'

function addImage(base64: string) {
  const $image = new Image()
  $image.onload = () => {
    $image.style.border = 'solid 1px black'
    $image.style.margin = '2px'
    document.body.appendChild($image)
  }
  $image.src = base64
}

const clipFlappers = new ClipFlappers('target', {
  viewSize: {
    width: 300,
    height: 200,
  },
  onEachClip: addImage,
})

document.getElementById('dispose')?.addEventListener('click', () => {
  clipFlappers?.dispose()
})
document.getElementById('clip')?.addEventListener('click', async () => {
  const base64 = await clipFlappers?.clip()
  addImage(base64)
})
