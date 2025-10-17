import { expect, mock, test } from 'bun:test'
import { readFile, writeFile } from 'node:fs/promises'
import { error, getInput, info, setFailed } from '@actions/core'
import { create, type Globber } from '@actions/glob'

const mockReadFile = mock(readFile)
const mockWriteFile = mock(writeFile)
const mockGetInput = mock(getInput)
const mockError = mock(error)
const mockInfo = mock(info)
const mockSetFailed = mock(setFailed)
const mockCreate = mock(create)

mock.module('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}))

mock.module('@actions/core', () => ({
  getInput: mockGetInput,
  error: mockError,
  info: mockInfo,
  setFailed: mockSetFailed,
}))

mock.module('@actions/glob', () => ({
  create: mockCreate,
}))

import { dirname, join } from 'node:path'
import { run } from '../run'

test('should overwrite files successfully', async () => {
  const testInputFile = 'test.env'
  const testOutputFile = 'output.env'
  const testFileContent = 'TEST_VAR=value1\nANOTHER_VAR=value2'
  const testFiles = ['path/to/test.env', 'another/path/test.env']

  // Reset mocks
  mockGetInput.mockClear()
  mockReadFile.mockClear()
  mockWriteFile.mockClear()
  mockInfo.mockClear()
  mockError.mockClear()
  mockSetFailed.mockClear()
  mockCreate.mockClear()

  // Setup mocks
  mockGetInput.mockImplementation((name: string) => {
    switch (name as 'input' | 'output') {
      case 'input':
        return testInputFile
      case 'output':
        return testOutputFile
    }
  })

  const mockGlob = {
    glob: mock(() => Promise.resolve(testFiles)),
  }
  mockCreate.mockResolvedValue(mockGlob as unknown as Globber)

  mockReadFile.mockResolvedValue(testFileContent)
  mockWriteFile.mockResolvedValue(undefined)

  await run()

  // Verify getInput was called with correct parameters
  expect(mockGetInput).toHaveBeenCalledWith('input')
  expect(mockGetInput).toHaveBeenCalledWith('output')

  // Verify glob was created with correct pattern
  expect(mockCreate).toHaveBeenCalledWith(`**/${testInputFile}`)

  // Verify readFile was called for each file
  expect(mockReadFile).toHaveBeenCalledTimes(testFiles.length)
  testFiles.forEach((file) => {
    expect(mockReadFile).toHaveBeenCalledWith(file, 'utf8')
  })

  // Verify writeFile was called for each file with correct content
  expect(mockWriteFile).toHaveBeenCalledTimes(testFiles.length)
  testFiles.forEach((file) => {
    const newOutputFilePath = join(dirname(file), testOutputFile)
    expect(mockWriteFile).toHaveBeenCalledWith(
      newOutputFilePath,
      testFileContent,
    )
  })

  // Verify info was called for each file
  expect(mockInfo).toHaveBeenCalledTimes(testFiles.length)
  testFiles.forEach((file) => {
    const newOutputFilePath = join(dirname(file), testOutputFile)
    expect(mockInfo).toHaveBeenCalledWith(
      `Overwrote ${file} to ${newOutputFilePath}`,
    )
  })
})

test('should handle readFile error', async () => {
  const testInputFile = 'test.env'
  const testOutputFile = 'output.env'
  const testFiles = ['path/to/test.env']
  const testError = new Error('Read failed')

  // Reset mocks
  mockGetInput.mockClear()
  mockReadFile.mockClear()
  mockWriteFile.mockClear()
  mockInfo.mockClear()
  mockError.mockClear()
  mockSetFailed.mockClear()
  mockCreate.mockClear()

  // Setup mocks
  mockGetInput.mockImplementation((name: string) => {
    switch (name as 'input' | 'output') {
      case 'input':
        return testInputFile
      case 'output':
        return testOutputFile
    }
  })

  const mockGlob = {
    glob: mock(() => Promise.resolve(testFiles)),
  }
  mockCreate.mockResolvedValue(mockGlob as unknown as Globber)

  mockReadFile.mockRejectedValue(testError)

  await run()

  // Verify error was called
  expect(mockError).toHaveBeenCalledWith(testError)

  // Verify setFailed was called
  expect(mockSetFailed).toHaveBeenCalledWith(testError)
  process.exitCode = 0
})

test('should handle writeFile error', async () => {
  const testInputFile = 'test.env'
  const testOutputFile = 'output.env'
  const testFileContent = 'TEST_VAR=value1'
  const testFiles = ['path/to/test.env']
  const testError = new Error('Write failed')

  // Reset mocks
  mockGetInput.mockClear()
  mockReadFile.mockClear()
  mockWriteFile.mockClear()
  mockInfo.mockClear()
  mockError.mockClear()
  mockSetFailed.mockClear()
  mockCreate.mockClear()

  // Setup mocks
  mockGetInput.mockImplementation((name: string) => {
    switch (name as 'input' | 'output') {
      case 'input':
        return testInputFile
      case 'output':
        return testOutputFile
    }
  })

  const mockGlob = {
    glob: mock(() => Promise.resolve(testFiles)),
  }
  mockCreate.mockResolvedValue(mockGlob as unknown as Globber)

  mockReadFile.mockResolvedValue(testFileContent)
  mockWriteFile.mockRejectedValue(testError)

  await run()

  // Verify error was called
  expect(mockError).toHaveBeenCalledWith(testError)

  // Verify setFailed was called
  expect(mockSetFailed).toHaveBeenCalledWith(testError)
  process.exitCode = 0
})

test('should handle empty file list', async () => {
  const testInputFile = 'nonexistent.env'
  const testOutputFile = 'output.env'
  const testFiles: string[] = []

  // Reset mocks
  mockGetInput.mockClear()
  mockReadFile.mockClear()
  mockWriteFile.mockClear()
  mockInfo.mockClear()
  mockError.mockClear()
  mockSetFailed.mockClear()
  mockCreate.mockClear()

  // Setup mocks
  mockGetInput.mockImplementation((name: string) => {
    switch (name as 'input' | 'output') {
      case 'input':
        return testInputFile
      case 'output':
        return testOutputFile
    }
  })

  const mockGlob = {
    glob: mock(() => Promise.resolve(testFiles)),
  }
  mockCreate.mockResolvedValue(mockGlob as unknown as Globber)

  await run()

  // Verify no files were processed
  expect(mockReadFile).not.toHaveBeenCalled()
  expect(mockWriteFile).not.toHaveBeenCalled()
  expect(mockInfo).not.toHaveBeenCalled()
  expect(mockError).not.toHaveBeenCalled()
  expect(mockSetFailed).not.toHaveBeenCalled()
})
