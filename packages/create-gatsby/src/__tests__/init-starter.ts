/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from "child_process"
import { x } from "tinyexec"
import { rm } from "fs/promises"
import fs from "fs-extra" // must use for test
import path from "path"
import { initStarter } from "../init-starter"
import { reporter } from "../utils/reporter"

jest.mock(`tiny-spin`, () => {
  return {
    spin: (): (() => void) => jest.fn(),
  }
})
jest.mock(`../utils/clear-line`)
jest.mock(`../utils/make-npm-safe`)
jest.mock(`tinyexec`)
jest.mock(`child_process`)
jest.mock(`fs/promises`)
jest.mock(`fs-extra`)
jest.mock(`path`)
jest.mock(`../utils/reporter`)
jest.mock(`../utils/get-config-store`, () => {
  return {
    getConfigStore: (): unknown => {
      return {
        items: {},
        set(key: string, value: unknown): void {
          ;(this as any).items[key] = value
        },
        get(key: string): unknown {
          return (this as any).items[key]
        },

        __reset(): void {
          ;(this as any).items = {}
        },
      }
    },
  }
})

describe(`init-starter`, () => {
  beforeEach(() => {
    process.chdir = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe(`initStarter / cloning`, () => {
    it(`reports an error when it s not possible to clone the repo`, async () => {
      ;(path as any).join.mockImplementation(() => `/somewhere-here`)
      ;(x as any).mockImplementation(() => {
        throw new Error(`Not possible to clone the repo`)
      })

      try {
        await initStarter(
          `gatsby-starter-hello-world`,
          `./somewhere`,
          [],
          `A site`
        )
      } catch (e) {
        expect(x).toBeCalledWith(`git`, [
          `clone`,
          `gatsby-starter-hello-world`,
          `--recursive`,
          `--depth=1`,
          `--quiet`,
        ])
        expect(reporter.panic).toBeCalledWith(`Not possible to clone the repo`)
        expect(reporter.success).not.toBeCalledWith(
          `Created site from template`
        )
        expect(rm).toBeCalledWith(`/somewhere-here`)
      }
    })

    it(`reports a success when everything is going ok`, async () => {
      ;(path as any).join.mockImplementation(() => `/somewhere-here`)
      ;(x as any).mockImplementation(() => Promise.resolve())
      ;(fs as any).readJSON.mockImplementation(() => {
        return { name: `gatsby-project` }
      })

      await initStarter(
        `gatsby-starter-hello-world`,
        `./somewhere`,
        [],
        `A site`
      )

      expect(x).toBeCalledWith(`git`, [
        `clone`,
        `gatsby-starter-hello-world`,
        `--recursive`,
        `--depth=1`,
        `--quiet`,
      ])
      expect(reporter.panic).not.toBeCalled()
      expect(reporter.success).toBeCalledWith(`Created site from template`)
      expect(rm).toBeCalledWith(`/somewhere-here`)
    })
  })

  describe(`initStarter / install`, () => {
    it(`process package installation with yarn`, async () => {
      process.env.npm_config_user_agent = `yarn`
      ;(path as any).join.mockImplementation(() => `/somewhere-here`)
      ;(x as any).mockImplementation(() => Promise.resolve())
      ;(fs as any).readJSON.mockImplementation(() => {
        return { name: `gatsby-project` }
      })

      await initStarter(
        `gatsby-starter-hello-world`,
        `./somewhere`,
        [],
        `A site`
      )

      expect(rm).toBeCalledWith(`package-lock.json`)
      expect(reporter.success).toBeCalledWith(`Installed plugins`)
      expect(reporter.panic).not.toBeCalled()
      expect(x).toBeCalledWith(`yarnpkg`, [`--silent`], {
        stderr: `inherit`,
      })
    })

    it(`process package installation with NPM`, async () => {
      process.env.npm_config_user_agent = `npm`
      ;(path as any).join.mockImplementation(() => `/somewhere-here`)
      ;(x as any).mockImplementation(() => Promise.resolve())
      ;(fs as any).readJSON.mockImplementation(() => {
        return { name: `gatsby-project` }
      })

      await initStarter(
        `gatsby-starter-hello-world`,
        `./somewhere`,
        [`one-package`],
        `A site`
      )

      expect(rm).toBeCalledWith(`yarn.lock`)
      expect(reporter.success).toBeCalledWith(`Installed Gatsby`)
      expect(reporter.success).toBeCalledWith(`Installed plugins`)
      expect(reporter.panic).not.toBeCalled()
      expect(x).toBeCalledWith(
        `npm`,
        [
          `install`,
          `--loglevel`,
          `error`,
          `--color`,
          `always`,
          `--legacy-peer-deps`,
          `--no-audit`,
        ],
        { stderr: `inherit` }
      )
      expect(x).toBeCalledWith(
        `npm`,
        [
          `install`,
          `--loglevel`,
          `error`,
          `--color`,
          `always`,
          `--legacy-peer-deps`,
          `--no-audit`,
          `one-package`,
        ],
        { stderr: `inherit` }
      )
    })

    it(`gently informs the user that yarn is not available when trying to use it`, async () => {
      process.env.npm_config_user_agent = `yarn`
      ;(execSync as any).mockImplementation(() => {
        throw new Error(`Something wrong occurred when trying to use yarn`)
      })
      ;(path as any).join.mockImplementation(() => `/somewhere-here`)
      ;(x as any).mockImplementation(() => Promise.resolve())
      ;(fs as any).readJSON.mockImplementation(() => {
        return { name: `gatsby-project` }
      })

      await initStarter(
        `gatsby-starter-hello-world`,
        `./somewhere`,
        [`one-package`],
        `A site`
      )

      expect(reporter.info).toBeCalledWith(
        `Woops! You have chosen "yarn" as your package manager, but it doesn't seem be installed on your machine. You can install it from https://yarnpkg.com/getting-started/install or change your preferred package manager with the command "gatsby options set pm npm". As a fallback, we will run the next steps with npm.`
      )
    })
  })
})
