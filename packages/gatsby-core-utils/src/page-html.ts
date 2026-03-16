import { existsSync } from "fs"
import { rm } from "fs/promises"
import path from "path"

const checkForHtmlSuffix = (pagePath: string): boolean =>
  !/\.(html?)$/i.test(pagePath)

export function generateHtmlPath(dir: string, outputPath: string): string {
  let outputFileName = outputPath.replace(/^(\/|\\)/, ``) //  Remove leading slashes for webpack-dev-server

  if (checkForHtmlSuffix(outputPath)) {
    outputFileName = path.join(outputFileName, `index.html`)
  }

  return path.join(dir, outputFileName)
}

export async function remove(
  { publicDir }: { publicDir: string },
  pagePath: string
): Promise<void> {
  const filePath = generateHtmlPath(publicDir, pagePath)
  if (existsSync(filePath)) {
    return await rm(filePath, { force: true })
  }
  return Promise.resolve()
}
