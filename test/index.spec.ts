import Target from '../src/index'
import { image200x100 } from './assets'

describe('index', () => {
  describe('snapshot', () => {
    it('default', () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any
      expect(app.$el).toMatchSnapshot()
    })
    it('image loaded', async () => {
      const $el = document.createElement('div')
      const app = new Target($el) as any
      app.base64 = image200x100
      await app.updateImage()
      expect(app.$el).toMatchSnapshot()
    })
  })
})
