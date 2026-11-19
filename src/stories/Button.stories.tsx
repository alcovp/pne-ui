import * as React from 'react'
import {Box, Button, Stack, Typography} from '@mui/material'
import type {ButtonProps} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckIcon from '@mui/icons-material/Check'
import {Meta, StoryObj} from '@storybook/react-webpack5'
// The library has no button of its own: these are the stories of the MUI `Button` as the theme of
// pne-ui draws it. `variant` and `color` pick the UI Kit variant.
export default {
    title: 'pne-ui/Button',
    component: Button,
    args: {
        children: 'Button',
        variant: 'contained',
        color: 'primary',
        size: 'medium',
        disabled: false,
        loading: false,
    },
    argTypes: {
        variant: {control: 'select', options: ['contained', 'outlined', 'text', 'soft']},
        color: {control: 'select', options: ['primary', 'error', 'warning', 'success']},
        size: {control: 'inline-radio', options: ['small', 'medium', 'large']},
    },
} as Meta<typeof Button>

type Story = StoryObj<typeof Button>

type ButtonLook = Pick<ButtonProps, 'variant' | 'color'>
type ButtonSize = NonNullable<ButtonProps['size']>

// The Figma matrix (StoryBook › pne-ui primitives · v2 › PneButton): columns variant × size, rows
// the states and the icon placements. Warning is a pne-ui look the Figma matrix does not draw.
const MATRIX_STYLES: Array<{key: string, look: ButtonLook, label: string}> = [
    {key: 'primary', look: {variant: 'contained'}, label: 'contained · Primary'},
    {key: 'outline', look: {variant: 'outlined'}, label: 'outlined · Secondary'},
    {key: 'text', look: {variant: 'text'}, label: 'text · Tertiary'},
    {key: 'destructive', look: {variant: 'contained', color: 'error'}, label: 'contained error · Destructive'},
    {key: 'soft', look: {variant: 'soft'}, label: 'soft · Soft'},
    {key: 'textDanger', look: {variant: 'text', color: 'error'}, label: 'text error · Tertiary danger'},
    {key: 'textSuccess', look: {variant: 'text', color: 'success'}, label: 'text success · Tertiary success'},
    {key: 'warning', look: {variant: 'contained', color: 'warning'}, label: 'contained warning'},
]
const MATRIX_SIZES: ButtonSize[] = ['small', 'medium', 'large']

type MatrixRow = {
    label: string
    props: Partial<ButtonProps> & {'data-pne-state'?: 'hover' | 'pressed' | 'focus'}
    /** The cells the theme has this state for; the others show a dash, as in Figma. */
    only?: (key: string, size: ButtonSize) => boolean
}

const MATRIX_ROWS: MatrixRow[] = [
    {label: 'Enable', props: {}},
    {label: 'Hover', props: {'data-pne-state': 'hover'}},
    {label: 'Pressed', props: {'data-pne-state': 'pressed'}},
    {label: 'Focus', props: {'data-pne-state': 'focus'}},
    {label: 'Disabled', props: {disabled: true}},
    {label: 'Loading', props: {loading: true, startIcon: <AddIcon/>}},
    {
        label: 'Activated',
        props: {'aria-disabled': true, tabIndex: -1, startIcon: <CheckIcon/>},
        only: key => key === 'textSuccess',
    },
    {
        label: 'Active',
        props: {'aria-pressed': true},
        only: (key, size) => key === 'text' && size !== 'large',
    },
    {label: 'Start icon', props: {startIcon: <AddIcon/>}},
    {label: 'End icon', props: {endIcon: <ArrowForwardIcon/>}},
]

const CELL_LABEL_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

const MatrixTable = ({styles}: {styles: typeof MATRIX_STYLES}) => (
    <Box
        component='table'
        sx={{borderCollapse: 'separate', borderSpacing: '20px 16px', ml: -2.5, mt: -2}}
    >
        <thead>
            <tr>
                <th/>
                {styles.flatMap(style => MATRIX_SIZES.map(size => (
                    <Box component='th' key={`${style.key}-${size}`} sx={{...CELL_LABEL_SX, fontWeight: 400, textAlign: 'left'}}>
                        {style.label} {size}
                    </Box>
                )))}
            </tr>
        </thead>
        <tbody>
            {MATRIX_ROWS.map(row => (
                <tr key={row.label}>
                    <Box component='th' sx={{...CELL_LABEL_SX, fontWeight: 400, textAlign: 'left', verticalAlign: 'middle'}}>
                        {row.label}
                    </Box>
                    {styles.flatMap(style => MATRIX_SIZES.map(size => {
                        const {children = 'Button', ...props} = row.props
                        return (
                            <Box component='td' key={`${style.key}-${size}`} sx={{verticalAlign: 'middle'}}>
                                {row.only && !row.only(style.key, size)
                                    ? <Box component='span' sx={CELL_LABEL_SX}>—</Box>
                                    : <Button {...style.look} size={size} {...props}>
                                        {children}
                                    </Button>}
                            </Box>
                        )
                    }))}
                </tr>
            ))}
        </tbody>
    </Box>
)

export const Matrix: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={4} sx={{p: 3, overflowX: 'auto'}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                Columns are variant and color × size, rows the states as in the Figma matrix. Hover, Pressed
                and Focus are pinned with <code>data-pne-state</code>; product code never sets it.
            </Typography>
            <MatrixTable styles={MATRIX_STYLES.slice(0, 3)}/>
            <MatrixTable styles={MATRIX_STYLES.slice(3, 5)}/>
            <MatrixTable styles={MATRIX_STYLES.slice(5)}/>
        </Stack>
    ),
}

type SaveState = 'ready' | 'saving' | 'saved' | 'failed'

const SaveButton = ({fails, withIcon = true}: {fails?: boolean, withIcon?: boolean}) => {
    const [state, setState] = React.useState<SaveState>('ready')
    const timerRef = React.useRef<number | undefined>(undefined)
    React.useEffect(() => () => window.clearTimeout(timerRef.current), [])

    const save = () => {
        setState('saving')
        timerRef.current = window.setTimeout(() => setState(fails ? 'failed' : 'saved'), 1500)
    }

    return (
        <Stack direction='row' spacing={1.5} sx={{alignItems: 'center'}}>
            <Button
                variant='contained'
                size='medium'
                loading={state === 'saving'}
                startIcon={withIcon ? <CheckIcon/> : undefined}
                onClick={() => {
                    if (state === 'saved') setState('ready')
                    else save()
                }}
            >
                Сохранить
            </Button>
            <Typography sx={{fontSize: 13, color: state === 'failed' ? 'error.main' : 'text.secondary'}}>
                {state === 'ready' && 'Готово · иконка Approve'}
                {state === 'saving' && 'Запрос идёт · спиннер на месте иконки, ширина та же'}
                {state === 'saved' && 'Сохранено · результат снаружи (снекбар / переход)'}
                {state === 'failed' && 'Не удалось сохранить · кнопка снова доступна'}
            </Typography>
        </Stack>
    )
}

export const Dynamics: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={3} sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                Асинхронное действие: кнопка с <code>loading</code> всегда с иконкой слева, тогда спиннер
                встаёт на её место и ширина не меняется. Нажмите, чтобы запустить.
            </Typography>
            <Stack spacing={0.5}>
                <Typography sx={CELL_LABEL_SX}>Успех</Typography>
                <SaveButton/>
            </Stack>
            <Stack spacing={0.5}>
                <Typography sx={CELL_LABEL_SX}>Ошибка</Typography>
                <SaveButton fails/>
            </Stack>
            <Stack spacing={0.5}>
                <Typography sx={CELL_LABEL_SX}>Нельзя (без иконки): в Loading кнопка расширяется — так не делаем</Typography>
                <SaveButton withIcon={false}/>
            </Stack>
        </Stack>
    ),
}

const PAGES = [1, 2, 3, 4, 5]

const SetDemo = () => {
    const [page, setPage] = React.useState(2)
    const [active, setActive] = React.useState(false)

    return (
        <Stack spacing={3} sx={{p: 3}}>
            <Typography sx={{fontSize: 14, color: 'text.secondary'}}>
                The picked item of a set, such as the current page, says so with <code>aria-current</code>,
                {' '}<code>aria-pressed</code> or <code>aria-selected</code>, and a <code>text</code> button
                takes the lifted white look from it. <code>text</code> with <code>color=&quot;error&quot;</code> is
                a removal, with <code>color=&quot;success&quot;</code> an activation; once confirmed,
                {' '}<code>aria-disabled</code> turns that button into a status with no way back.
            </Typography>
            <Stack direction='row' spacing={0.5} sx={{alignItems: 'center'}}>
                {PAGES.map(item => (
                    <Button
                        aria-current={item === page ? 'page' : undefined}
                        key={item}
                        onClick={() => setPage(item)}
                        variant='text'
                        size='small'
                    >
                        {item}
                    </Button>
                ))}
            </Stack>
            <Stack direction='row' spacing={1.5} sx={{alignItems: 'center'}}>
                <Button variant='text' color='error' size='medium'>Delete</Button>
                <Button
                    aria-disabled={active || undefined}
                    onClick={active ? undefined : () => setActive(true)}
                    variant='text'
                    color='success'
                    size='medium'
                    startIcon={<CheckIcon/>}
                    tabIndex={active ? -1 : undefined}
                >
                    {active ? 'Active' : 'Activate'}
                </Button>
                {active
                    ? <Button onClick={() => setActive(false)} variant='text' size='small'>Reset the demo</Button>
                    : null}
            </Stack>
        </Stack>
    )
}

export const Sets: Story = {
    parameters: {controls: {disable: true}},
    render: () => <SetDemo/>,
}

// A label that does not fit the width wraps to a second line and is never cut with an ellipsis: one line
// is the target, two lines are the fallback, three and more mean the label or the layout needs rewriting.
const LONG_LABELS: Array<{label: string, width: number}> = [
    {label: 'Save changes', width: 224},
    {label: 'Send the application for review', width: 220},
    {label: 'Download, sign and send the application for an extra review', width: 184},
]

export const LongLabels: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack direction='row' spacing={5} sx={{p: 3, alignItems: 'flex-start', flexWrap: 'wrap'}} useFlexGap>
            {LONG_LABELS.map(({label, width}) => (
                <Stack key={label} spacing={2} sx={{width}}>
                    {MATRIX_SIZES.map(size => (
                        <Box key={size}>
                            <Typography sx={CELL_LABEL_SX}>{size} · {width}px</Typography>
                            <Button variant='contained' size={size} sx={{width: '100%'}}>{label}</Button>
                        </Box>
                    ))}
                </Stack>
            ))}
        </Stack>
    ),
}

export const Playground: Story = {
    render: args => (
        <Box sx={{p: 3}}>
            <Button {...args}/>
        </Box>
    ),
}

export const WithIcons: Story = {
    args: {startIcon: <AddIcon/>, children: 'Add merchant'},
    render: args => (
        <Stack direction='row' spacing={2} sx={{p: 3, alignItems: 'center'}}>
            <Button {...args}/>
            <Button {...args} startIcon={undefined} endIcon={<ArrowForwardIcon/>}>Next</Button>
        </Stack>
    ),
}
