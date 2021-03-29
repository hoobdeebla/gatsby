import { existsSync } from "fs"
import { outputJson } from "fs-extra" // must use
import path from "path"

const APP_DATA_JSON = `app-data.json`

export const write = (publicDir: string, hash: string): Promise<void> =>
  outputJson(path.join(publicDir, `page-data`, APP_DATA_JSON), {
    webpackCompilationHash: hash,
  })

export const exists = (publicDir: string): boolean =>
  existsSync(path.join(publicDir, `page-data`, APP_DATA_JSON))
