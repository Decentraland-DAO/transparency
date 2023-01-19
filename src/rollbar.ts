import { ROLLBAR_ACCESS_TOKEN } from './utils'
import Rollbar from 'rollbar'

export const rollbar = new Rollbar({
  accessToken: ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true
})