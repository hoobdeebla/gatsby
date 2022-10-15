import { join, resolve, basename } from "path"
import { build } from "documentation"
import { writeFile } from "fs/promises"

const OUTPUT_FILE_NAME = `apis.json`

async function outputFile() {
  const apis = await Promise.all(
    [
      join("cache-dir", "api-ssr-docs.js"),
      join("src", "utils", "api-browser-docs.ts"),
      join("src", "utils", "api-node-docs.ts")
    ].map(filePath => {
      const resolved = resolve(filePath)
      const [, api] = basename(filePath).split("-")
      return build(resolved, {
          shallow: true
        })
        .then(contents => {
          return [contents, api]
        })
    })
  )

  const output = apis.reduce((merged, [output, api]) => {
    merged[api] = output.reduce((mergedOutput, doc, i) => {
      if (doc.kind === "typedef") return mergedOutput

      const tags = doc.tags.reduce((mergedTags, tag) => {
        mergedTags[tag.title] = tag.description
        return mergedTags
      }, {})
      mergedOutput[doc.name] = {
        deprecated: !!tags.deprecated || undefined,
        version: tags.gatsbyVersion
      }
      return mergedOutput
    }, {})
    return merged
  }, {})

  /** @type {Array<import("../index").AvailableFeatures>} */
  output.features = ["image-cdn", "graphql-typegen", "content-file-path", "slices", "stateful-source-nodes", "adapters"];

  return writeFile(
    resolve(OUTPUT_FILE_NAME),
    JSON.stringify(output, null, 2),
    "utf8"
  )
}

outputFile()
