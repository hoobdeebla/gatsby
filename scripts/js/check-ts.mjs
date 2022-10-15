// This file runs the typescript checker against packages.
// you can run it against all:
//   `yarn typecheck`
//
// or even scope it to specific packages.
//   `yarn typecheck gatsby-cli`
import { readdirSync, lstatSync, existsSync } from "node:fs"
import { join, resolve as resolvePath } from "node:path"
import { globSync } from "glob"
import chalk from "chalk"
import yargs from "yargs"
import { execaSync } from "execa"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

console.log(`TS Check: Running...`)

const toAbsolutePath = relativePath =>
  join(fileURLToPath(new URL(`.`, import.meta.url)), `../..`, relativePath)
const PACKAGES_DIR = toAbsolutePath(`/packages`)

const filterPackage = yargs.argv._[0]

const packages = readdirSync(PACKAGES_DIR)
  .map(file => resolvePath(PACKAGES_DIR, file))
  .filter(f => lstatSync(resolvePath(f)).isDirectory())

// We only want to typecheck against packages that have a tsconfig.json
// AND have some ts files in it's source code.
let packagesWithTs = packages
  .filter(p => existsSync(resolvePath(p, `tsconfig.json`)))
  .filter(
    project =>
      globSync(`/**/*.ts`, {
        root: project,
        ignore: `**/node_modules/**`,
      }).length
  )

if (filterPackage) {
  packagesWithTs = packagesWithTs.filter(project =>
    project.endsWith(filterPackage)
  )

  if (packagesWithTs.length === 0) {
    console.log()
    console.error(chalk.red(`Error:`))
    console.log(
      chalk.red(
        `A package matching "${filterPackage}" did not find a package with TypeScript enabled.`
      )
    )
    console.log(
      chalk.red(
        `Make sure that package exists at "/packages/${filterPackage}" and has a tsconfig.json file`
      )
    )
    console.log()
    process.exit(1)
  }
}

let totalTsFiles = 0
let totalJsFiles = 0

packagesWithTs.forEach(project => {
  const tsFiles = globSync(
    toAbsolutePath(
      `./packages/${project.split(/.*packages[/\\]/)[1]}/src/**/*.ts`
    )
  ).length

  const jsFiles = globSync(
    toAbsolutePath(
      `./packages/${project.split(/.*packages[/\\]/)[1]}/src/**/*.js`
    )
  ).length

  totalTsFiles += tsFiles
  totalJsFiles += jsFiles

  const percentConverted = Number(
    ((tsFiles / (jsFiles + tsFiles)) * 100).toFixed(1)
  )

  console.log(
    `TS Check: Checking ./packages/${project.split(/.*packages[/\\]/)[1]}`,
    `\n  - TS Files: ${tsFiles}`,
    `\n  - JS Files: ${jsFiles}`,
    `\n  - Percent Converted: ${percentConverted}%`
  )

  const require = createRequire(import.meta.url)

  const args = [
    `--max-old-space-size=4096`,
    resolvePath(
      require.resolve(`typescript/package.json`),
      `..`,
      require(`typescript/package.json`).bin.tsc
    ),
    `-p`,
    project,
    `--noEmit`,
  ]

  try {
    execaSync(`node`, args, { stdio: `inherit` })
  } catch (e) {
    process.exit(1)
  }
})

console.log(`TS Check: Success`)

if (!filterPackage) {
  const percentConverted = Number(
    ((totalTsFiles / (totalJsFiles + totalTsFiles)) * 100).toFixed(1)
  )

  console.log(
    `  - Total TS Files: ${totalTsFiles}`,
    `\n  - Total JS Files: ${totalJsFiles}`,
    `\n  - Percent Converted: ${percentConverted}%`
  )
}
