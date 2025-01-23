import { detectProjects } from "lerna/utils"
// const { PackageGraph } = require(`@lerna/package-graph`)

const { projectGraph, projectFileMap } = await detectProjects()

console.log(projectFileMap)

// const sort = (a, b) => a.localeCompare(b)
const sorted = new Map(
  [...projectFileMap].sort((a, b) => String(a[0]).localeCompare(b[0]))
)

// const sorted = sort(projectFileMap[0])

console.log(sorted)

// getPackages().then(packages => {
//   console.log(packages)
//   const graph = new PackageGraph(packages, `allDependencies`, true)
//   console.log(graph)
// })
