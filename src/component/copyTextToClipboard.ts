/** Puts the text on the clipboard; true when it got there. */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch {
            // Fall through to the legacy path. Clipboard access can be denied
            // in embedded or non-secure application contexts.
        }
    }

    if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.left = '-9999px'
    textarea.style.position = 'fixed'
    document.body.appendChild(textarea)
    textarea.select()

    try {
        return document.execCommand('copy')
    } catch {
        return false
    } finally {
        textarea.remove()
    }
}
