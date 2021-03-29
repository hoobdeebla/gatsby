import { readFile, mkdir, writeFile } from "fs/promises"
import { dirname } from "path"

export async function ensureFileContent(
  file: string,
  data: any
): Promise<boolean> {
  let previousContent: string | undefined = undefined
  try {
    previousContent = await readFile(file, `utf8`)
  } catch (e) {
    // whatever throws, we'll just write the file
  }

  if (previousContent !== data) {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, data)
    return true
  }

  return false
}
