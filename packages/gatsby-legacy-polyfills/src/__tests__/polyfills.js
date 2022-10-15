import { resolve, join } from "node:path"
import { TraceMap } from "@jridgewell/trace-mapping"
import { execa } from "execa"
import { remove, existsSync, readFileSync } from "fs-extra"

jest.setTimeout(60000)

describe(`polyfills`, () => {
  const packageRoot = resolve(__dirname, `../../`)
  const tmpDir = `.tmp`

  beforeAll(async () => {
    const pkg = require(`../../package.json`)
    const buildScript = pkg.scripts[`build:polyfills`].replace(
      ` --no-sourcemap`,
      ``
    )

    await execa(
      `yarn`,
      [
        ...buildScript.split(` `),
        `--no-compress`,
        `-o`,
        join(tmpDir, `polyfills.js`),
      ],
      { cwd: packageRoot }
    )
  })

  afterAll(() => remove(join(packageRoot, tmpDir)))

  it(`has the correct polyfills`, () => {
    const polyfills = require(`../exclude`).LEGACY_POLYFILLS
    const polyfillMap = join(packageRoot, tmpDir, `polyfills.js.map`)
    expect(existsSync(polyfillMap)).toBe(true)

    const fileMap = polyfills.map(polyfill => {
      if (polyfill === `features/dom-collections`) {
        return `core-js/modules/web.dom-collections`
      }

      return `core-js/modules/${polyfill
        .replace(/^(features|modules)\//, `es.`)
        .replace(`/`, `.`)}`
    })

    const polyfillMapSource = readFileSync(polyfillMap, `utf8`)
    const tracer = new TraceMap(polyfillMapSource)
    const sources = tracer.sources.map(source =>
      source.replace(/.*\/node_modules\//, ``)
    )

    // check if all polyfills are in the bundle
    expect(sources).toEqual(
      expect.arrayContaining(fileMap.map(file => expect.stringContaining(file)))
    )
  })
})
