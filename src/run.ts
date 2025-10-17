import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { error, getInput, info, setFailed } from '@actions/core'
import { create } from '@actions/glob'

export async function run() {
  const inputFile = getInput('input')
  const outputFile = getInput('output')
  const files = await (await create(`**/${inputFile}`)).glob()

  try {
    await Promise.all(
      files.map(async (file) => {
        try {
          const inputFileContent = await readFile(file, 'utf8')
          const newOutputFilePath = join(dirname(file), outputFile)
          await writeFile(newOutputFilePath, inputFileContent)
          info(`Overwrote ${file} to ${newOutputFilePath}`)
        } catch (err: unknown) {
          error(err as Error)
          throw err
        }
      }),
    )
  } catch (err: unknown) {
    setFailed(err as Error)
  }
}
