import {measureNaturalWidth} from '../src/component/table/measureNaturalWidth'

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
