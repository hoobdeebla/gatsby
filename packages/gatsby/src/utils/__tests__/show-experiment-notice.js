import { createNoticeMessage } from "../show-experiment-notice"
import { stripVTControlCharacters as stripAnsi } from "util"

describe(`show-experiment-notice`, () => {
  it(`generates a message`, () => {
    expect(
      stripAnsi(
        createNoticeMessage([
          {
            noticeText: `hi`,
            umbrellaLink: `http://example.com`,
            experimentIdentifier: `The Flag`,
          },
        ])
      )
    ).toMatchSnapshot()
  })
})
