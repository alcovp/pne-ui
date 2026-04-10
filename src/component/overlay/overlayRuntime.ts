let overlayHostCount = 0
let hasWarnedAboutMissingHost = false
let hasWarnedAboutMultipleHosts = false

const logOverlayConfigurationError = (message: string) => {
    console.error(message)
}

const getMissingHostMessage = (actionName: string) =>
    `[pne-ui] overlayActions.${actionName}() was called without a mounted <OverlayHost />. ` +
    'The snackbar was added to the overlay store but cannot render. ' +
    'Mount exactly one <OverlayHost /> near the application root.'

const getMultipleHostsMessage = () =>
    `[pne-ui] Detected ${overlayHostCount} mounted <OverlayHost /> instances. ` +
    'OverlayHost is a singleton and must be mounted exactly once near the application root. ' +
    'Multiple hosts duplicate snackbars and can desynchronize their timers.'

export const registerOverlayHost = () => {
    overlayHostCount += 1
    hasWarnedAboutMissingHost = false

    if (overlayHostCount > 1 && !hasWarnedAboutMultipleHosts) {
        hasWarnedAboutMultipleHosts = true
        logOverlayConfigurationError(getMultipleHostsMessage())
    }

    return () => {
        overlayHostCount = Math.max(overlayHostCount - 1, 0)

        if (overlayHostCount <= 1) {
            hasWarnedAboutMultipleHosts = false
        }
    }
}

export const reportMissingOverlayHost = (actionName: string) => {
    if (overlayHostCount > 0 || hasWarnedAboutMissingHost) {
        return
    }

    hasWarnedAboutMissingHost = true
    logOverlayConfigurationError(getMissingHostMessage(actionName))
}

export const resetOverlayRuntimeForTests = () => {
    overlayHostCount = 0
    hasWarnedAboutMissingHost = false
    hasWarnedAboutMultipleHosts = false
}
