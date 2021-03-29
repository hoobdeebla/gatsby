const path = require(`path`)
const fs = require(`fs/promises`)
const chokidar = require(`chokidar`)

exports.createPagesStatefully = async ({ store, actions }, options, done) => {
  if (process.env.NODE_ENV !== `production`) {
    const { program } = store.getState()
    const { createPage } = actions
    const source = path.join(__dirname, `./raw_dev-404-page.js`)
    const destination = path.join(
      program.directory,
      `.cache`,
      `dev-404-page.js`
    )
    const copy = () => fs.cp(source, destination, { recursive: true })
    await copy()
    createPage({
      component: destination,
      path: `/dev-404-page/`,
    })
    chokidar
      .watch(source)
      .on(`change`, () => copy())
      .on(`ready`, () => done())
  } else {
    done()
  }
}
