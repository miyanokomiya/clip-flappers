import * as target from '../src/geo'

describe('geo', () => {
  describe('getInRange', () => {
    it.each([
      [0, 1, 3, 1],
      [1, 1, 3, 1],
      [2, 1, 3, 2],
      [3, 1, 3, 3],
      [4, 1, 3, 3],
    ])('val: %s, min: %s, max: %s => %s', (val, min, max, expected) => {
      expect(target.getInRange(val, min, max)).toBe(expected)
    })
  })

  describe('getPedal', () => {
    it.each([
      [
        { x: 10, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 5, y: 5 },
      ],
      [
        { x: -10, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: -5, y: -5 },
      ],
    ])('p: %s, base: %s, vec: %s => %s', (p, base, vec, expected) => {
      expect(target.getPedal(p, base, vec)).toEqual(expected)
    })
  })

  describe('isSameRect', () => {
    it.each([
      [
        { x: 0, y: 0, width: 10, height: 20 },
        { x: 0, y: 0, width: 10, height: 20 },
        true,
      ],
      [
        { x: 1, y: 0, width: 10, height: 20 },
        { x: 0, y: 0, width: 10, height: 20 },
        false,
      ],
      [
        { x: 0, y: 1, width: 10, height: 20 },
        { x: 0, y: 0, width: 10, height: 20 },
        false,
      ],
      [
        { x: 0, y: 0, width: 11, height: 20 },
        { x: 0, y: 0, width: 10, height: 20 },
        false,
      ],
      [
        { x: 0, y: 0, width: 10, height: 21 },
        { x: 0, y: 0, width: 10, height: 20 },
        false,
      ],
    ])('a: %s, b: %s => %s', (a, b, expected) => {
      expect(target.isSameRect(a, b)).toEqual(expected)
    })
  })

  describe('adjustInRect', () => {
    describe('centralize: false', () => {
      it.each([
        [
          { x: 0, y: 0, width: 10, height: 20 },
          { x: 0, y: 0, width: 10, height: 20 },
          false,
          { x: 0, y: 0, width: 10, height: 20 },
        ],
        [
          { x: -1, y: -1, width: 12, height: 24 },
          { x: 0, y: 0, width: 10, height: 20 },
          false,
          { x: 0, y: 0, width: 10, height: 20 },
        ],
        [
          { x: 5, y: 5, width: 11, height: 22 },
          { x: 0, y: 0, width: 10, height: 20 },
          false,
          { x: 0, y: 0, width: 10, height: 20 },
        ],
        [
          { x: 0, y: 0, width: 20, height: 40 },
          { x: 0, y: 0, width: 10, height: 10 },
          false,
          { x: 0, y: 0, width: 5, height: 10 },
        ],
      ])(
        'target: %s, base: %s, centralize: %s => %s',
        (t, base, centralize, expected) => {
          expect(target.adjustInRect(t, base, centralize)).toEqual(expected)
        }
      )
    })
    describe('centralize: true', () => {
      it.each([
        [
          { x: 0, y: 0, width: 20, height: 40 },
          { x: 0, y: 0, width: 10, height: 10 },
          true,
          { x: 2.5, y: 0, width: 5, height: 10 },
        ],
        [
          { x: 0, y: 0, width: 40, height: 20 },
          { x: 0, y: 0, width: 10, height: 10 },
          true,
          { x: 0, y: 2.5, width: 10, height: 5 },
        ],
      ])(
        'target: %s, base: %s, centralize: %s => %s',
        (t, base, centralize, expected) => {
          expect(target.adjustInRect(t, base, centralize)).toEqual(expected)
        }
      )
    })
  })
})
