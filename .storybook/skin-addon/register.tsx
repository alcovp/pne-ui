import React, {useCallback, useEffect} from 'react'
import {addons, types, useGlobals} from 'storybook/manager-api'
import {IconButton} from 'storybook/internal/components'
import {ArrowLeftIcon, ArrowRightIcon} from '@storybook/icons'
import {STORYBOOK_DEFAULT_SKIN, STORYBOOK_SKINS} from '../skins'

// Toolbar tool that picks the skin colour (the `skin` global): a select, previous/next buttons
// and the arrow keys, like the skin tool of the paynet-react Storybook.
const ADDON_ID = 'pne-skin'
const TOOL_ID = `${ADDON_ID}/tool`
const SKIN_IDS = STORYBOOK_SKINS.map(skin => skin.id)

const isTypingTarget = (target: EventTarget | null): boolean =>
    target instanceof HTMLElement
    && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))

const SkinTool = () => {
    const [globals, updateGlobals] = useGlobals()
    const current: string = SKIN_IDS.includes(globals.skin) ? globals.skin : STORYBOOK_DEFAULT_SKIN
    const select = useCallback((id: string) => updateGlobals({skin: id}), [updateGlobals])
    const step = useCallback((delta: number) => {
        const index = SKIN_IDS.indexOf(current)
        select(SKIN_IDS[(index + delta + SKIN_IDS.length) % SKIN_IDS.length])
    }, [current, select])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (isTypingTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
            if (event.key === 'ArrowRight') step(1)
            else if (event.key === 'ArrowLeft') step(-1)
        }
        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [step])

    const color = STORYBOOK_SKINS.find(skin => skin.id === current)?.experimentalColor

    return <>
        <span
            aria-hidden
            style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                margin: '0 6px 0 8px',
                borderRadius: 6,
                background: color,
                boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.2)',
            }}
        />
        <select title='Skin colour' value={current} onChange={event => select(event.target.value)}>
            {STORYBOOK_SKINS.map(skin => (
                <option key={skin.id} value={skin.id}>{skin.title} {skin.experimentalColor}</option>
            ))}
        </select>
        <IconButton title='Previous skin [Left arrow]' onClick={() => step(-1)}>
            <ArrowLeftIcon/>
        </IconButton>
        <IconButton title='Next skin [Right arrow]' onClick={() => step(1)}>
            <ArrowRightIcon/>
        </IconButton>
    </>
}

addons.register(ADDON_ID, () => {
    addons.add(TOOL_ID, {
        title: 'Skin colour',
        type: types.TOOL,
        match: ({viewMode}) => viewMode === 'story',
        render: () => <SkinTool/>,
    })
})
