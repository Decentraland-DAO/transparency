import { ROLLBAR_ACCESS_TOKEN } from './utils'

const Rollbar = require('rollbar')
export const rollbar = new Rollbar({
  accessToken: ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true
})