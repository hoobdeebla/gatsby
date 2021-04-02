const path = require(`path`)
const { camelCase, upperFirst } = require(`lodash`)

exports.typeNameFromDir = ({ node }) =>
  upperFirst(camelCase(`${path.basename(node.dir)} ${node.extension}`))

exports.typeNameFromFile = ({ node }) =>
  upperFirst(camelCase(`${node.name} ${node.extension}`))
