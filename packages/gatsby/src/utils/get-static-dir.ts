import { existsSync, cpSync } from "fs"
import { cp } from "fs/promises"
import { watch } from "chokidar"
import { resolve, join, relative } from "path"
import { store } from "../redux"

/**
 * copyStaticDirs
 * --
 * Copy files from the static directory to the public directory
 */
export const copyStaticDirs = (): void => {
  // access the store to get themes
  const { flattenedPlugins } = store.getState()
  // if there are legacy themes, only use them. Otherwise proceed with plugins
  const themesSet = flattenedPlugins.map(plugin => {
    return {
      themeDir: plugin.pluginFilepath,
      themeName: plugin.name,
    }
  })

  themesSet
    // create an array of potential theme static folders
    .map(theme => resolve(theme.themeDir, `static`))
    // filter out the static folders that don't exist
    .filter(themeStaticPath => existsSync(themeStaticPath))
    // copy the files for each folder into the user's build
    .map(folder =>
      cpSync(folder, join(process.cwd(), `public`), {
        dereference: true,
      })
    )

  const staticDir = join(process.cwd(), `static`)
  if (!existsSync(staticDir)) return undefined
  return cpSync(staticDir, join(process.cwd(), `public`), {
    dereference: true,
  })
}

/**
 * syncStaticDir
 * --
 * Set up a watcher to sync changes from the static directory to the public directory
 */
export const syncStaticDir = (): void => {
  const staticDir = join(process.cwd(), `static`)
  watch(staticDir)
    .on(`add`, path => {
      const relativePath = relative(staticDir, path)
      cp(path, `${process.cwd()}/public/${relativePath}`)
    })
    .on(`change`, path => {
      const relativePath = relative(staticDir, path)
      cp(path, `${process.cwd()}/public/${relativePath}`)
    })
}
