import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import type {Theme} from '@mui/material/styles'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneButton} from '../../index'
import OverlayToast from '../../component/overlay/OverlayToast'

export default {
    title: 'pne-ui 5/OverlayHost toasts',
    component: OverlayToast,
    parameters: {controls: {disable: true}},
} as Meta<typeof OverlayToast>

type Story = StoryObj<typeof OverlayToast>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px'} as const
const noop = () => undefined

const TONES = [
    {tone: 'success', title: 'Готово', description: 'Изменения сохранены.'},
    {tone: 'info', title: 'Отчёт формируется', description: 'Файл появится в списке отчётов.'},
    {tone: 'warning', title: 'Лимит почти исчерпан', description: 'Достигнуто 75% суточного лимита.'},
    {tone: 'error', title: 'Ошибка', description: 'Не удалось выполнить операцию.'},
] as const

// The label of a toast's action reads as the primary text on the soft fill.
const ACTION_SX = (theme: Theme) => ({color: theme.palette.pne.toast.title})

const Cell = ({caption, children}: {caption: string, children: React.ReactNode}) => (
    <Box sx={{width: 448}}>
        <Typography sx={{...CAPTION_SX, mb: 0.5}}>{caption}</Typography>
        {children}
    </Box>
)

// Figma «Feedback & Overlays › Toast» and the toasts of the PneModal flows: the card of each tone
// with a title alone, with a description, with an action and with the timer running.
export const Sheet: Story = {
    render: () => (
        <Stack spacing={3} sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', maxWidth: 900}}>
                A notification of OverlayHost is 448px wide. A toast is filled with the colour of its tone and
                shows the message as its title, an optional description in the text colour of the tone, an
                action and the close cross; the 3px bar along the bottom is the time left. The specimens
                stand in the flow of the page; OverlayHost stacks them at the lower left corner.
            </Typography>
            {TONES.map(({tone, title, description}) => (
                <Stack direction='row' key={tone} spacing={3} sx={{alignItems: 'flex-start', flexWrap: 'wrap', rowGap: 2}}>
                    <Cell caption={`${tone} · title`}>
                        <OverlayToast onClose={noop} tone={tone}>{title}</OverlayToast>
                    </Cell>
                    <Cell caption={`${tone} · description, timer`}>
                        <OverlayToast description={description} onClose={noop} progress={0.64} tone={tone}>{title}</OverlayToast>
                    </Cell>
                    <Cell caption={`${tone} · action`}>
                        <OverlayToast
                            action={<PneButton onClick={noop} pneStyle='neutral' size='small' sx={ACTION_SX}>
                                {tone === 'error' ? 'Повторить' : 'Отменить'}
                            </PneButton>}
                            description={description}
                            onClose={noop}
                            tone={tone}
                        >
                            {title}
                        </OverlayToast>
                    </Cell>
                </Stack>
            ))}
            <Cell caption='a long message wraps'>
                <OverlayToast onClose={noop} progress={0.3} tone='success'>
                    Шаблон «Ежемесячный отчёт по оборотам» сохранён и будет применён при следующем поиске
                </OverlayToast>
            </Cell>
        </Stack>
    ),
}
