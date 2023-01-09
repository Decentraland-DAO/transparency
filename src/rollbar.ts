const Rollbar = require('rollbar')
export const rollbar = new Rollbar({
  accessToken: '73498737ed9b4205bf06c7a70911c833',
  captureUncaught: true,
  captureUnhandledRejections: true
})