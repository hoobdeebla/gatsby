const { readFileSync, writeFileSync } = require(`fs-extra`)
const { join } = require(`node:path`)

const packagesToPin = [
  `@gatsbyjs/parcel-namer-relative-to-cwd`,
  `gatsby-parcel-config`,
]

function adjustDeps(packageDirectoryPath) {
  const packageJsonPath = join(packageDirectoryPath, `package.json`)
  const packageJsonString = readFileSync(packageJsonPath, `utf-8`)

  let updatedPackageJson = packageJsonString

  for (const packageToPin of packagesToPin) {
    const regexp = new RegExp(`"${packageToPin}": "\\^([^"]+)"`, `g`)

    updatedPackageJson = updatedPackageJson.replace(
      regexp,
      `"${packageToPin}": "$1"`
    )
  }

  if (updatedPackageJson !== packageJsonString) {
    writeFileSync(packageJsonPath, updatedPackageJson)
  }
}

adjustDeps(process.cwd())
