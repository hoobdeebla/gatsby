const { GraphQLString } = require(`gatsby/graphql`)
const { existsSync, cpSync } = require(`fs`)
const { join } = require(`path`)
const { prefixId, CODES } = require(`./error-utils`)

module.exports = ({
  type,
  getNodeAndSavePathDependency,
  pathPrefix = ``,
  reporter,
}) => {
  if (type.name !== `File`) {
    return {}
  }

  return {
    publicURL: {
      type: GraphQLString,
      args: {},
      description: `Copy file to static directory and return public url to it`,
      resolve: (file, fieldArgs, context) => {
        const details = getNodeAndSavePathDependency(file.id, context.path)
        const fileName = `${file.internal.contentDigest}/${details.base}`

        const publicPath = join(process.cwd(), `public`, `static`, fileName)

        if (!existsSync(publicPath)) {
          cpSync(
            details.absolutePath,
            publicPath,
            { dereference: true },
            err => {
              if (err) {
                reporter.panic(
                  {
                    id: prefixId(CODES.MissingResource),
                    context: {
                      sourceMessage: `error copying file from ${details.absolutePath} to ${publicPath}`,
                    },
                  },
                  err
                )
              }
            }
          )
        }

        return `${pathPrefix}/static/${fileName}`
      },
    },
  }
}
