import { useEffect, useState } from 'react'

export const useWidgetBoardInteractionLock = () => {
    const [isInteractionLocked, setIsInteractionLocked] = useState(false)

    useEffect(() => {
        if (typeof document === 'undefined') return
        const isDragActive = () => {
            for (const className of document.body.classList) {
                if (className.includes('show-grab-cursor') || className.includes('show-resize-cursor')) {
                    return true
                }
            }
            return false
        }
        const update = () => {
            setIsInteractionLocked(isDragActive())
        }
        update()
        const observer = new MutationObserver(update)
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    return isInteractionLocked
}
