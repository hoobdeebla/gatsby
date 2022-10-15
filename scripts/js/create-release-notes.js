require(`dotenv`).config()

const yargs = require(`yargs`)
const { readFileSync, mkdirSync, writeFileSync } = require(`node:fs`)
const { join, dirname } = require(`node:path`)
const { Octokit } = require(`@octokit/rest`)
const { execSync } = require(`child_process`)

yargs.parserConfiguration({
  "parse-numbers": false,
})

if (!process.env.GITHUB_ACCESS_TOKEN) {
  throw new Error(`GITHUB_ACCESS_TOKEN env var not set`)
}

const MONTH_NAMES = [
  `January`,
  `February`,
  `March`,
  `April`,
  `May`,
  `June`,
  `July`,
  `August`,
  `September`,
  `October`,
  `November`,
  `December`,
]

const octokit = new Octokit({
  auth: `token ${process.env.GITHUB_ACCESS_TOKEN}`,
})

const argv = yargs
  .command(
    `* <release> <date>`,
    `Creates a new release note PR`,
    commandBuilder =>
      commandBuilder
        .positional(`release`, { type: `string` })
        .positional(`date`, { type: `string` })
  )
  .check(argv => {
    if (!/^[1-9][0-9]*\.\d+$/.test(argv.release)) {
      throw new Error(`"${argv.release}" is not a release version`)
    }

    // loose date validation, but good enough
    if (!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(argv.date)) {
      throw new Error(`"${argv.date}" is not a valid YYYY-MM-DD date`)
    }

    return true
  }).argv

const repo = `gatsby`
const owner = `gatsbyjs`

// no try/catches - if it fails at any point - let it fail and just do stuff manually ;)
// this is just for happy path - if there is extra work needed - this script won't be able to do it
async function run() {
  const releaseNotesBranchName = `release-notes-${argv.release}`
  const releaseParts = argv.release.split(`.`)
  const [year, month] = argv.date.split(`-`)

  const commitMessage = `chore(docs): Release Notes for ${argv.release}`
  const body = [
    `## Description`,
    `Release notes for ${argv.release}`,
    `[Rendered View](https://github.com/gatsbyjs/gatsby/blob/release-notes-${argv.release}/docs/docs/reference/release-notes/v${argv.release}/index.md)`,
  ]

  const previousRelease =
    releaseParts[1] == `0`
      ? `UNKNOWN`
      : `${releaseParts[0]}.${parseInt(releaseParts[1]) - 1}`

  // TODO check how many releases were already done this month
  const monthYearIndex = ` TODO`

  execSync(`git checkout -b "${releaseNotesBranchName}"`, {
    stdio: `inherit`,
  })

  const newReleaseNotesPath = join(
    __dirname,
    `..`,
    `docs/docs/reference/release-notes/v${argv.release}/index.md`
  )

  const template = readFileSync(
    join(__dirname, `create-release-notes.template.md`)
  ).toString()

  const contents = template
    .replace(/\${VERSION}/g, argv.release)
    .replace(/\${PREVIOUS_VERSION}/g, previousRelease)
    .replace(/\${DATE}/g, argv.date)
    .replace(/\${INDEX}/g, monthYearIndex)
    .replace(/\${YEAR}/g, year)
    .replace(/\${MONTH}/g, MONTH_NAMES[parseInt(month) - 1])

  mkdirSync(dirname(newReleaseNotesPath), { recursive: true })
  writeFileSync(newReleaseNotesPath, contents)

  execSync(`git add ${newReleaseNotesPath}`, {
    stdio: `inherit`,
  })

  execSync(`git commit -m "${commitMessage}"`, {
    stdio: `inherit`,
  })

  execSync(`git push origin +${releaseNotesBranchName}`, {
    stdio: `inherit`,
  })

  const pr = await octokit.pulls.create({
    owner,
    repo,
    title: commitMessage,
    head: releaseNotesBranchName,
    base: `master`,
    draft: true,
    body: body.join(`\n\n`),
  })

  console.log(`\n---\n\nPR opened - ${pr.data.html_url}`)

  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: pr.data.number,
    labels: [`type: documentation`],
  })
}

run()
