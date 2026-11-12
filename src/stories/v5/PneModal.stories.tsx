import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneButton, PneField, PneModal, PneModalActions, PneSelect, PneTextField} from '../../index'

export default {
    title: 'pne-ui 5/PneModal',
    component: PneModal,
    parameters: {controls: {disable: true}},
} as Meta<typeof PneModal>

type Story = StoryObj<typeof PneModal>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px'} as const

// A window shown in the flow of the page, so several stand side by side as on the Figma sheet
// (StoryBook › pne-ui composites · v2 › PneModal). Product code opens a modal over the page.
const Specimen = ({caption, width = 320, ...props}: {
    caption: string
    width?: number
} & Pick<React.ComponentProps<typeof PneModal>, 'actions' | 'children' | 'subtitle' | 'hideCloseButton'> & {title: string}) => (
    <Box>
        <Typography sx={{...CAPTION_SX, mb: 1}}>{caption}</Typography>
        <PneModal
            {...props}
            closeLabel='Close'
            modalProps={{
                disablePortal: true,
                disableScrollLock: true,
                hideBackdrop: true,
                sx: {inset: 'auto', position: 'relative', zIndex: 'auto'},
            }}
            onClose={() => undefined}
            open
            slotProps={{container: {sx: {minWidth: 0, position: 'static', transform: 'none', width}}}}
        />
    </Box>
)

const noop = () => undefined

const CURRENCIES = ['EUR', 'USD', 'GBP'] as const

const AmountsForm = ({disabled, error}: {disabled?: boolean, error?: boolean}) => (
    <Stack spacing={2}>
        <PneField disabled={disabled} label='Currency'>
            <PneSelect onChange={noop} options={CURRENCIES} value='EUR' variant='filled'/>
        </PneField>
        <PneField disabled={disabled} label='Minimal amount'>
            <PneTextField onChange={noop} value={error ? '1.00' : '2.00'} variant='filled'/>
        </PneField>
        <PneField
            disabled={disabled}
            error={error}
            helperText={error ? 'Must be greater than the minimal amount' : undefined}
            label='Maximal amount'
        >
            <PneTextField onChange={noop} value={error ? '0.50' : '2.00'} variant='filled'/>
        </PneField>
    </Stack>
)

const GATES = [
    ['Contoso Visa EUR 3DS', 'Card acquiring, 3-D Secure, settlement in EUR'],
    ['Fabrikam Mastercard USD', 'Card acquiring without 3-D Secure, settlement in USD'],
    ['Northwind Payouts GBP', 'Payouts to cards, daily settlement'],
    ['Adventure Works APM Wallet', 'Alternative payment method, redirect flow'],
    ['Tailspin Toys Visa EUR', 'Card acquiring, 3-D Secure, settlement in EUR'],
    ['Woodgrove Mastercard GBP', 'Card acquiring, settlement in GBP'],
] as const

export const Sheets: Story = {
    render: () => (
        <Stack spacing={4} sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary', maxWidth: 900}}>
                The window of the UI Kit: a 16px-rounded card with 16px around its content, the title 18/26
                SemiBold, the subtitle 12/16, a 32px close cross without a fill, hairlines that stop short of
                the edges. The header and the buttons stay, the body scrolls. The buttons of a modal are
                medium (32px); their order and layout follow the pne-ui conventions of PneModalActions.
            </Typography>
            <Stack direction='row' spacing={3} sx={{alignItems: 'flex-start', flexWrap: 'wrap', rowGap: 3}}>
                <Specimen
                    actions={<PneModalActions
                        leading={<PneButton onClick={noop} pneStyle='text' size='medium'>Reset</PneButton>}
                        primary={<PneButton onClick={noop} size='medium'>Apply</PneButton>}
                        secondary={<PneButton onClick={noop} pneStyle='outlined' size='medium'>Cancel</PneButton>}
                    />}
                    caption='Anatomy'
                    subtitle='Subtitle: context of the dialog'
                    title='Title of the dialog'
                >
                    Any content: text, a form, a table. The header and the actions stay, the body scrolls.
                </Specimen>
                <Specimen
                    actions={<PneModalActions
                        primary={<PneButton onClick={noop} size='medium'>Сохранить</PneButton>}
                        secondary={<PneButton onClick={noop} pneStyle='outlined' size='medium'>Отмена</PneButton>}
                    />}
                    caption='Ordinary actions'
                    title='Редактирование профиля'
                >
                    Проверьте данные перед сохранением изменений.
                </Specimen>
                <Specimen
                    actions={<PneModalActions
                        primary={<PneButton onClick={noop} pneStyle='error' size='medium'>Удалить</PneButton>}
                        secondary={<PneButton onClick={noop} pneStyle='outlined' size='medium'>Отмена</PneButton>}
                    />}
                    caption='Destructive actions'
                    title='Удаление ключа'
                >
                    После удаления приватный ключ нельзя будет восстановить.
                </Specimen>
                <Specimen
                    actions={<PneModalActions
                        leading={<PneButton onClick={noop} pneStyle='text' size='medium'>Отмена</PneButton>}
                        primary={<PneButton onClick={noop} size='medium'>Далее</PneButton>}
                        secondary={<PneButton onClick={noop} pneStyle='outlined' size='medium'>Назад</PneButton>}
                    />}
                    caption='Wizard actions'
                    subtitle='Шаг 2 из 3'
                    title='Подключение терминала'
                >
                    Отмена относится ко всему процессу, а «Назад» и «Далее» управляют текущим шагом.
                </Specimen>
            </Stack>
            <Stack direction='row' spacing={3} sx={{alignItems: 'flex-start', flexWrap: 'wrap', rowGap: 3}}>
                <Specimen
                    actions={<PneModalActions
                        primary={<PneButton onClick={noop} size='medium'>Save</PneButton>}
                        secondary={<PneButton onClick={noop} pneStyle='outlined' size='medium'>Cancel</PneButton>}
                    />}
                    caption='Form'
                    hideCloseButton
                    subtitle='3 gates selected'
                    title='Min/max amounts'
                >
                    <AmountsForm error/>
                </Specimen>
                <Specimen
                    actions={<PneModalActions
                        primary={<PneButton loading onClick={noop} size='medium'>Save</PneButton>}
                        secondary={<PneButton disabled onClick={noop} pneStyle='outlined' size='medium'>Cancel</PneButton>}
                    />}
                    caption='Busy: the fields and Cancel are disabled, Save is loading'
                    subtitle='3 gates selected'
                    title='Min/max amounts'
                >
                    <AmountsForm disabled/>
                </Specimen>
                <Specimen
                    actions={<PneModalActions
                        primary={<PneButton onClick={noop} size='medium'>Apply</PneButton>}
                        secondary={<PneButton onClick={noop} pneStyle='outlined' size='medium'>Cancel</PneButton>}
                    />}
                    caption='Long content: the body scrolls, the header and the buttons stay'
                    subtitle='8 gates'
                    title='Selected gates'
                >
                    <Stack spacing={2} sx={{maxHeight: 200}}>
                        {GATES.map(([name, description]) => (
                            <Box key={name}>
                                <Box sx={{fontWeight: 500}}>{name}</Box>
                                <Box sx={{color: 'text.secondary', fontSize: 12, lineHeight: '16px'}}>{description}</Box>
                            </Box>
                        ))}
                    </Stack>
                </Specimen>
                <Specimen caption='No buttons' title='Сведения о ключе'>
                    Окно без кнопок закрывается крестиком; нижний край тела — отступ окна.
                </Specimen>
            </Stack>
        </Stack>
    ),
}
