import { ClipFlappers as Target } from '../src/index'
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

      expectToShow(app.$el.querySelector('[data-key="clip-f_drop"]'))
      expectToHide(app.$el.querySelector('[data-key="clip-f_delete"]'))
      expectToHide(app.$svg)
      expect(
        app.$el.querySelector('[data-key="clip-f_error"]')!.style.transform
      ).toBe('translateY(100%)')
      expect(app.$el).toMatchSnapshot()
    })
    it('image loaded', async () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any
      await app.updateImage(image200x100)

      expectToHide(app.$el.querySelector('[data-key="clip-f_drop"]'))
      expectToShow(app.$el.querySelector('[data-key="clip-f_delete"]'))
      expectToShow(app.$svg)
      expect(app.$el).toMatchSnapshot()
    })
  })

  describe('reset', () => {
    it('back to default view', async () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any
      await app.updateImage(image200x100)
      app.$el.querySelector('[data-key="clip-f_delete"]').click()
      expectToShow(app.$el.querySelector('[data-key="clip-f_drop"]'))
      expectToHide(app.$el.querySelector('[data-key="clip-f_delete"]'))
      expectToHide(app.$svg)
    })
  })

  describe('dispolse', () => {
    it('remove all DOM', async () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any
      await app.updateImage(image200x100)
      app.dispose()

      expect(app.$el).toBe(null)
      expect(app.$svg).toBe(null)
      expect(app.$clipRect).toBe(null)
      expect($el.innerHTML).toBe('')
    })
  })

  describe('error message', () => {
    describe('hide', () => {
      it('if it is clicked', () => {
        const $el = document.createElement('div')
        const app = new Target($el) as any
        app.setErrorMessage('invalidImageFile')
        const $error = app.$el.querySelector('[data-key="clip-f_error"]')

        expect($error.style.transform).toBe('')
        $error.click()
        expect($error.style.transform).toBe('translateY(100%)')
      })
      it('after 5s', () => {
        const $el = document.createElement('div')
        const app = new Target($el) as any
        const _setTimeout = window.setTimeout
        const setTimeout = jest.fn().mockImplementation((fn, time) => {
          fn()
          expect(time).toBe(5000)
          return 1
        })
        ;(window.setTimeout as any) = setTimeout
        app.setErrorMessage('invalidImageFile')
        const $error = app.$el.querySelector('[data-key="clip-f_error"]')

        expect(app.errorTimer).toBe(1)
        expect($error.style.transform).toBe('translateY(100%)')
        window.setTimeout = _setTimeout
      })
    })

    describe('failed to load image', () => {
      it('show error message', async () => {
        console.error = jest.fn()
        const $el = document.createElement('div')
        const app = new Target($el) as any
        await app.updateImage('invalid image')

        expect(
          app.$el.querySelector('[data-key="clip-f_error"]')!.style.transform
        ).toBe('')
      })
    })
  })
})
