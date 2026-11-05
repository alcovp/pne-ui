import dayjsBase from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

/**
 * The single place that installs the dayjs plugins SearchUI relies on.
 *
 * dayjs is a peer dependency: SearchUI and the MUI X pickers share the application's copy, and
 * `extend` installs each plugin on it once. Modules take `dayjs` from here, not from the package:
 * the export is a local binding, so a bundler that trusts the package's `sideEffects: false`
 * cannot skip this module and lose the plugins.
 */
dayjsBase.extend(utc)
dayjsBase.extend(timezone)
dayjsBase.extend(isoWeek)

export const dayjs = dayjsBase
