import { Config } from 'bili'

const config: Config = {
  plugins: {
    typescript2: {
      tsconfigOverride: {
        include: ['src'],
      },
    },
  },
  input: 'src/index.ts',
  output: {
    format: ['cjs-min', 'esm-min', 'umd-min'],
    moduleName: 'ClipFlappers',
  },
  banner: true,
}

export default config
