const { readdirSync, readFileSync, statSync } = require(`fs-extra`)
const { basename, dirname, join } = require(`node:path`)
const { cwd } = require(`node:process`)
const makeTemplate = require(`lodash/template`)

const exclusionList = [
  `gatsby-starter-minimal`,
  `gatsby-starter-minimal-ts`,
  `gatsby-starter-plugin`,
  `gatsby-starter-theme-workspace`,
]

module.exports = {
  transforms: {
    LIST_STARTERS() {
      const base = join(cwd(), `starters`)
      const starters = readdirSync(base)
        .filter(dir => statSync(join(base, dir)).isDirectory())
        // Filter out excluded starters
        .filter(dir => !exclusionList.includes(dir))
        .reduce((merged, dir) => {
          merged[dir] = JSON.parse(
            readFileSync(join(base, dir, `package.json`), `utf8`)
          )
          return merged
        }, {})

      return `
        |Name|Demo|Description|
        |:--:|----|-----------|
        ${Object.keys(starters)
          .map(name => {
            const starter = starters[name]
            return `
            |[${name}](https://github.com/gatsbyjs/gatsby-starter-${name})|[gatsby-starter-${name}-demo.netlify.app](https://gatsby-starter-${name}-demo.netlify.app/)|${starter.description}|
          `.trim()
          })
          .join(`\n`)}
      `.replace(/^[^|]+/gm, ``)
    },
    STARTER(content, options, { originalPath }) {
      const starter = basename(dirname(originalPath))

      if (exclusionList.includes(starter)) {
        return ``
      }

      const template = readFileSync(
        join(cwd(), `starters`, `README-template.md`),
        `utf8`
      )
      return makeTemplate(template)({
        name: starter,
      })
    },
  },
}
