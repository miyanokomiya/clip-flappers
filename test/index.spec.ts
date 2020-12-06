import Target from '../src/index'
import { image200x100 } from './assets'

function expectToShow($el: HTMLElement | SVGElement) {
  expect($el.style.display).toBe('')
}
function expectToHide($el: HTMLElement | SVGElement) {
  expect($el.style.display).toBe('none')
}

describe('index', () => {
  describe('snapshot', () => {
    it('default', () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any

      expectToShow(app.$el.querySelector('[data-key="clip-f_drop-button"]'))
      expectToHide(app.$el.querySelector('[data-key="clip-f_delete-button"]'))
      expectToHide(app.$svg)
      expect(app.$el).toMatchSnapshot()
    })
    it('image loaded', async () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any
      app.base64 = image200x100
      await app.updateImage()

      expectToHide(app.$el.querySelector('[data-key="clip-f_drop-button"]'))
      expectToShow(app.$el.querySelector('[data-key="clip-f_delete-button"]'))
      expectToShow(app.$svg)
      expect(app.$el).toMatchSnapshot()
    })
  })

  describe('reset', () => {
    it('back to default view', async () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any
      app.base64 = image200x100
      await app.updateImage()
      app.$el.querySelector('[data-key="clip-f_delete-button"]').click()
      expectToShow(app.$el.querySelector('[data-key="clip-f_drop-button"]'))
      expectToHide(app.$el.querySelector('[data-key="clip-f_delete-button"]'))
      expectToHide(app.$svg)
    })
  })

  describe('dispolse', () => {
    it('remove all DOM', async () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any
      app.base64 = image200x100
      await app.updateImage()
      app.dispose()

      expect(app.$el).toBe(null)
      expect(app.$svg).toBe(null)
      expect(app.$clipRect).toBe(null)
      expect($el.innerHTML).toBe('')
    })
  })
})
