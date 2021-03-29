import fs from "fs/promises"
import path from "path"
import { cache as findCacheDir } from "empathic/package"

import {
  userGetsSevenDayFeedback,
  userPassesFeedbackRequestHeuristic,
  showFeedbackRequest,
  showSevenDayFeedbackRequest,
} from "../utils/feedback"
import { IProgram } from "./types"

module.exports = async function clean(program: IProgram): Promise<void> {
  const { directory, report } = program

  const directories = [
    `.cache`,
    `public`,
    // Ensure we clean babel loader cache
    findCacheDir(`babel-loader`),
    findCacheDir(`minimizer-webpack-plugin`),
  ].filter(Boolean)

  report.info(`Deleting ${directories.join(`, `)}`)

  await Promise.all(
    directories.map(dir =>
      fs.rm(path.join(directory, dir!), { recursive: true, force: true })
    )
  )

  report.info(`Successfully deleted directories`)

  if (await userGetsSevenDayFeedback()) {
    showSevenDayFeedbackRequest()
  } else if (await userPassesFeedbackRequestHeuristic()) {
    showFeedbackRequest()
  }
}
