import ClipFlappers from '../src/index'
const clipFlappers = new ClipFlappers('target', {
  viewSize: {
    width: 300,
    height: 200,
  },
})

document.getElementById('dispose')?.addEventListener('click', () => {
  clipFlappers?.dispose()
})
