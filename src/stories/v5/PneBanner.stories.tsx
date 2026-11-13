import * as React from 'react'
import {Box, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneBanner} from '../../index'
import type {PneBannerTone} from '../../index'

export default {
    title: 'pne-ui 5/PneBanner',
    parameters: {controls: {disable: true}},
} as Meta

type Story = StoryObj

const TONES: PneBannerTone[] = ['info', 'success', 'warning', 'error']

// UI Kit Banner: a message built into the page. The pale fill of the tone in a ring of the tone,
// the sign of the tone, a title, the text, an action link and a close cross.
const SheetDemo = () => {
    const [message, setMessage] = React.useState('Nothing clicked yet')

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720, p: 3}}>
            <Typography data-story-banner-message sx={{color: 'text.secondary', fontSize: 14}}>{message}</Typography>
            {TONES.map(tone => (
                <PneBanner
                    actionLabel='Change the limit'
                    data-story-banner={tone}
                    key={tone}
                    onAction={() => setMessage(`Action of ${tone}`)}
                    onClose={() => setMessage(`Closed ${tone}`)}
                    title={`Traffic of the terminal is paused (${tone})`}
                    tone={tone}
                >
                    The limit of 75% of the daily amount is reached.
                </PneBanner>
            ))}
            <PneBanner tone='info'>Selection complete. Total items: 48</PneBanner>
            <PneBanner icon={false} tone='warning' title='Without the sign'>
                A long text wraps inside the banner and never pushes the close cross out of it, however
                long the message of the page turns out to be on a narrow screen.
            </PneBanner>
        </Box>
    )
}

export const Sheet: Story = {
    render: () => <SheetDemo/>,
    play: ({canvasElement}) => {
        const banners = canvasElement.querySelectorAll<HTMLElement>('[data-story-banner]')
        if (banners.length !== TONES.length) {
            throw new Error('The banner sheet must show a banner of every tone')
        }
        banners.forEach(banner => {
            const sign = banner.querySelector('[data-pne-banner-sign]')?.getBoundingClientRect()
            const close = banner.querySelector('[data-pne-banner-close]')?.getBoundingClientRect()
            if (!sign || sign.width !== 20 || sign.height !== 20) {
                throw new Error('The sign of a banner must be 20x20px')
            }
            if (!close || close.width !== 24 || close.height !== 24) {
                throw new Error('The close cross of a banner must be a 24x24px icon action')
            }
            if (getComputedStyle(banner).borderRadius !== '8px') {
                throw new Error('A banner must have a radius of 8px')
            }
        })
    },
}
