![Main](https://github.com/miyanokomiya/clip-flappers/workflows/test/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# clip-flappers
This is the component to clip a image without any frontend framework.

## demo
https://miyanokomiya.github.io/clip-flappers/

## usage

### install
```sh
yarn add clip-flappers
```

### mount
```ts
import { ClipFlappers, Rectangle, Size, clipImage } from 'clip-flappers'

const clipFlappers = new ClipFlappers('target', {
  viewSize: { width: 300, height: 200 },
  clipSize: { width: 100, height: 100 },
  onUpdateClip: async (base64: string, clipRect: Rectangle, size: Size) => {
    const clipped = await clipImage(base64, clipRect, size)
    console.log(clipped)
  },
})

// clipFlappers.dispose()
```

### customize error messages
```ts
import { ClipFlappers, ErrorMessages } from 'clip-flappers'

new ClipFlappers('target', {
  errorMessages: ErrorMessages = {
    invalidImageFile: 'Invalid image file.',
  }
})
```

## commnad

``` bash
# install dependencies
$ yarn install

# start dev & demo server
$ yarn demo

# lint
$ yarn lint[:fix]

# test
$ yarn test [--watch]

# build
$ yarn build
```

## publish
Update `version` in `package.json`, commit with a comment `Release x.x.x` and merge into the `main` branch.
