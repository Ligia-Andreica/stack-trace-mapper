require('colors')
const fs = require('fs')
const fse = require('fs-extra')
const { resolve } = require('path')
const sourceMap = require('source-map')
const { execSync } = require('child_process')

const DIR = 'tmp'
const ZIP = 'apk.zip'
const APK_PATH = resolve(`./${DIR}/${ZIP}`)
const SOURCE_MAP_PATH = resolve(`./${DIR}/assets/index.android.bundle.map`)
const PREVIEW_WINDOW = 5
const IDEA_VERSION = 'IntelliJ IDEA 2019'

const OPTIONS = {
  string: ['apk', 'line', 'column', 'remote', 'local', 'help', 'open'],
  alias: {
    h: 'help',
    o: 'open',
  },
  default: {
    column: 0,
    remote: '/home/circleci/project/',
    local: '../',
    help: false,
    open: false,
  },
}

const transformSourceMaps = () => {
  if (HELP) {
    process.stdout.write(fs.readFileSync(__dirname + '/README.md'))
    process.exit(0)
  }

  if (!APK || !LINE || !COLUMN) {
    process.stderr.write(
      `Invalid command:${!APK ? '\n    --apk missing' : ''}${
        !LINE ? '\n    --line missing' : ''
      }${!COLUMN ? '\n    --column missing' : ''}\n`.red
    )
    process.exit(1)
  }

  fs.mkdirSync(DIR)
  fs.copyFileSync(APK, APK_PATH)
  execSync(`unzip ${APK_PATH} -d ${DIR}`)
}

const processSourceMaps = async () => {
  const sourcemap = JSON.parse(fs.readFileSync(SOURCE_MAP_PATH, 'utf8'))
  const sourceMapConsumer = await new sourceMap.SourceMapConsumer(sourcemap)
  const originalPosition = sourceMapConsumer.originalPositionFor({
    line: parseInt(LINE),
    column: parseInt(COLUMN),
  })

  process.stdout.write(
    `Original file: ${originalPosition.source}:${originalPosition.line}:${originalPosition.column}\n`
  )

  const sourceFile = resolve(
    originalPosition.source.replace(REMOTE_BUILD_PATH, LOCAL_PROJECT_PATH)
  )

  if (fs.existsSync(sourceFile)) {
    process.stdout.write(
      `Navigate to project tree source file: ${sourceFile}:${originalPosition.line}:${originalPosition.column}\n`
    )
    const previewBefore = execSync(
      `cat -n ${sourceFile} | head -n ${originalPosition.line -
        1} | tail -n ${PREVIEW_WINDOW}`
    ).toString().yellow
    const preview = execSync(
      `cat -n ${sourceFile} | head -n ${originalPosition.line} | tail -n 1`
    ).toString().red
    const previewAfter = execSync(
      `cat -n ${sourceFile} | head -n ${originalPosition.line +
        PREVIEW_WINDOW} | tail -n ${PREVIEW_WINDOW}`
    ).toString().yellow
    process.stdout.write(`\n\n${previewBefore}${preview}${previewAfter}\n\n`)

    OPEN && execSync(`open -a ${IDEA_VERSION}  ${sourceFile}`)
  } else {
    throw `Could not find project tree source file: ${sourceFile}.\n`.red
  }
}

const {
  apk: APK,
  line: LINE,
  column: COLUMN,
  remote: REMOTE_BUILD_PATH,
  local: LOCAL_PROJECT_PATH,
  help: HELP,
  open: OPEN,
} = require('minimist')(process.argv.slice(2), OPTIONS)

try {
  transformSourceMaps()
  processSourceMaps()
    .catch(error => {
      fse.removeSync(DIR, { recursive: true })
      process.stderr.write(`Something went wrong: ${error}\n`.red)
      process.exit(1)
    })
    .finally(() => fse.removeSync(DIR, { recursive: true }))
} catch (error) {
  process.stderr.write(`Something went wrong: ${error}\n`.red)
  process.exit(1)
}
