import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckIcon from '@mui/icons-material/Check'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {PneButton, type PneButtonSize, type PneButtonStyle} from '../../index'

export default {
    title: 'pne-ui 5/PneButton',
    component: PneButton,
    args: {
        children: 'Button',
        pneStyle: 'contained',
        size: 'medium',
        disabled: false,
        loading: false,
    },
    argTypes: {
        pneStyle: {
            control: 'select',
            options: [
                'contained', 'outlined', 'text', 'errorText', 'successText', 'error', 'warning',
                'neutral', 'neutralText', 'primaryLight', 'white',
            ],
        },
        size: {control: 'inline-radio', options: ['small', 'medium', 'large']},
    },
} as Meta<typeof PneButton>

type Story = StoryObj<typeof PneButton>

// The Figma matrix (StoryBook › pne-ui primitives · v2 › PneButton): columns variant × size, rows
// the states and the icon placements. The four soft styles look the same, so one column. Warning
// is a pne-ui style the Figma matrix does not draw.
const MATRIX_STYLES: Array<{pneStyle: PneButtonStyle, label: string}> = [
    {pneStyle: 'contained', label: 'contained · Primary'},
    {pneStyle: 'outlined', label: 'outlined · Secondary'},
    {pneStyle: 'text', label: 'text · Tertiary'},
    {pneStyle: 'error', label: 'error · Destructive'},
    {pneStyle: 'neutral', label: 'neutral* · Soft'},
    {pneStyle: 'errorText', label: 'errorText · Tertiary danger'},
    {pneStyle: 'successText', label: 'successText · Tertiary success'},
    {pneStyle: 'warning', label: 'warning'},
]
const MATRIX_SIZES: PneButtonSize[] = ['small', 'medium', 'large']

type MatrixRow = {
    label: string
    props: Partial<React.ComponentProps<typeof PneButton>>
    /** The cells the library has this state for; the others show a dash, as in Figma. */
    only?: (pneStyle: PneButtonStyle, size: PneButtonSize) => boolean
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
        props: {activated: true, startIcon: <CheckIcon/>},
        only: pneStyle => pneStyle === 'successText',
    },
    {
        label: 'Active',
        props: {active: true},
        only: (pneStyle, size) => pneStyle === 'text' && size !== 'large',
    },
    {label: 'Start icon', props: {startIcon: <AddIcon/>}},
    {label: 'End icon', props: {endIcon: <ArrowForwardIcon/>}},
    {label: 'Icon only', props: {startIcon: <AddIcon/>, children: null, 'aria-label': 'Add'}},
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
                    <Box component='th' key={`${style.pneStyle}-${size}`} sx={{...CELL_LABEL_SX, fontWeight: 400, textAlign: 'left'}}>
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
                            <Box component='td' key={`${style.pneStyle}-${size}`} sx={{verticalAlign: 'middle'}}>
                                {row.only && !row.only(style.pneStyle, size)
                                    ? <Box component='span' sx={CELL_LABEL_SX}>—</Box>
                                    : <PneButton pneStyle={style.pneStyle} size={size} {...props}>
                                        {children}
                                    </PneButton>}
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
                Columns are pneStyle × size, rows the states as in the Figma matrix. Hover, Pressed and
                Focus are pinned with <code>data-pne-state</code>; product code never sets it.
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
    const timer = React.useRef<number | undefined>(undefined)
    React.useEffect(() => () => window.clearTimeout(timer.current), [])

    const save = () => {
        setState('saving')
        timer.current = window.setTimeout(() => setState(fails ? 'failed' : 'saved'), 1500)
    }

    return (
        <Stack direction='row' spacing={1.5} sx={{alignItems: 'center'}}>
            <PneButton
                size='medium'
                loading={state === 'saving'}
                startIcon={withIcon ? <CheckIcon/> : undefined}
                onClick={() => {
                    if (state === 'saved') setState('ready')
                    else save()
                }}
            >
                Сохранить
            </PneButton>
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
                <code>active</code> marks the picked item of a set, such as the current page: the lifted white
                look of <code>text</code>. <code>errorText</code> is a removal and <code>successText</code> an
                activation; once confirmed, <code>activated</code> turns the button into a status with no way back.
            </Typography>
            <Stack direction='row' spacing={0.5} sx={{alignItems: 'center'}}>
                {PAGES.map(item => (
                    <PneButton
                        active={item === page}
                        aria-current={item === page ? 'page' : undefined}
                        key={item}
                        onClick={() => setPage(item)}
                        pneStyle='text'
                        size='small'
                    >
                        {item}
                    </PneButton>
                ))}
            </Stack>
            <Stack direction='row' spacing={1.5} sx={{alignItems: 'center'}}>
                <PneButton pneStyle='errorText' size='medium'>Delete</PneButton>
                <PneButton
                    activated={active}
                    onClick={() => setActive(true)}
                    pneStyle='successText'
                    size='medium'
                    startIcon={<CheckIcon/>}
                >
                    {active ? 'Active' : 'Activate'}
                </PneButton>
                {active
                    ? <PneButton onClick={() => setActive(false)} pneStyle='text' size='small'>Reset the demo</PneButton>
                    : null}
            </Stack>
        </Stack>
    )
}

export const Sets: Story = {
    parameters: {controls: {disable: true}},
    render: () => <SetDemo/>,
}

export const Playground: Story = {
    render: args => (
        <Box sx={{p: 3}}>
            <PneButton {...args}/>
        </Box>
    ),
}

export const WithIcons: Story = {
    args: {startIcon: <AddIcon/>, children: 'Add merchant'},
    render: args => (
        <Stack direction='row' spacing={2} sx={{p: 3, alignItems: 'center'}}>
            <PneButton {...args}/>
            <PneButton {...args} startIcon={undefined} endIcon={<ArrowForwardIcon/>}>Next</PneButton>
            <PneButton {...args} aria-label='Add' startIcon={<AddIcon/>}>{null}</PneButton>
        </Stack>
    ),
}
