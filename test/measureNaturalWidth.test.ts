import {measureNaturalWidth, measureNaturalWidths} from '../src/component/table/measureNaturalWidth'

describe('measureNaturalWidth', () => {
    it('reports nothing for a missing element', () => {
        expect(measureNaturalWidth(null)).toBe(0)
        expect(measureNaturalWidth(undefined)).toBe(0)
    })

    it('restores the inline styles it borrowed for the measurement', () => {
        const element = document.createElement('div')
        element.style.cssText = 'color: red; width: 50px;'
        document.body.appendChild(element)

        try {
            measureNaturalWidth(element)

            expect(element.style.color).toBe('red')
            expect(element.style.width).toBe('50px')
            expect(element.style.position).toBe('')
            expect(element.style.visibility).toBe('')
        } finally {
            element.remove()
        }
    })

    it('measures the element in place instead of cloning it', () => {
        const parent = document.createElement('section')
        const element = document.createElement('div')
        parent.appendChild(element)
        document.body.appendChild(parent)
        const childCountDuringMeasurement: number[] = []

        Object.defineProperty(element, 'getBoundingClientRect', {
            configurable: true,
            value: () => {
                childCountDuringMeasurement.push(document.body.querySelectorAll('div').length)

                return {width: 120} as DOMRect
            },
        })

        try {
            expect(measureNaturalWidth(element)).toBe(120)
            // A clone in document.body would measure a different cascade.
            expect(childCountDuringMeasurement).toEqual([1])
            expect(element.parentElement).toBe(parent)
        } finally {
            parent.remove()
        }
    })

    it('measures several elements in one layout, all of them out of flow at once, and restores each', () => {
        const first = document.createElement('div')
        const second = document.createElement('div')
        first.style.cssText = 'color: red;'
        document.body.append(first, second)
        const outOfFlowWhileRead: string[] = []

        for (const [element, width] of [[first, 40], [second, 60]] as const) {
            Object.defineProperty(element, 'getBoundingClientRect', {
                configurable: true,
                value: () => {
                    outOfFlowWhileRead.push(`${first.style.position}/${second.style.position}`)
                    return {width} as DOMRect
                },
            })
        }

        try {
            expect(measureNaturalWidths([first, null, second])).toEqual([40, 0, 60])
            // Both left the flow before the first read: one layout serves every measurement.
            expect(outOfFlowWhileRead).toEqual(['fixed/fixed', 'fixed/fixed'])
            expect(first.style.cssText).toBe('color: red;')
            expect(second.style.position).toBe('')
        } finally {
            first.remove()
            second.remove()
        }
    })

    /*
     * jsdom rejects `width: max-content` as an inline style value, so only the
     * out-of-flow part of the swap is observable here; that the width itself
     * becomes intrinsic is asserted on real geometry by the GatesControls*
     * stories.
     */
    it('takes the element out of flow while it measures', () => {
        const element = document.createElement('div')
        document.body.appendChild(element)
        const observed: Record<string, string> = {}

        Object.defineProperty(element, 'getBoundingClientRect', {
            configurable: true,
            value: () => {
                observed.position = element.style.position
                observed.maxWidth = element.style.maxWidth
                observed.visibility = element.style.visibility

                return {width: 0} as DOMRect
            },
        })

        try {
            measureNaturalWidth(element)

            expect(observed).toEqual({
                maxWidth: 'none',
                position: 'fixed',
                visibility: 'hidden',
            })
        } finally {
            element.remove()
        }
    })
})
