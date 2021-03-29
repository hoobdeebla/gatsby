import fs from "fs"
import path from "path"

const APP_DATA_JSON = `app-data.json`

export const write = (publicDir: string, hash: string): Promise<void> =>
  fs.promises
    .mkdir(publicDir, { recursive: true })
    .then(() =>
      fs.promises.writeFile(
        path.join(publicDir, `page-data`, APP_DATA_JSON),
        JSON.stringify({ webpackCompilationHash: hash }, null, 2)
      )
    )

export const exists = (publicDir: string): boolean =>
  fs.existsSync(path.join(publicDir, `page-data`, APP_DATA_JSON))
