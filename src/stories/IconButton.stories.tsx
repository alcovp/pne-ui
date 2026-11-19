import * as React from 'react'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import ModeEditIcon from '@mui/icons-material/ModeEdit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import {Box, IconButton, InputAdornment, Stack, TextField, Typography} from '@mui/material'
import type {IconButtonProps} from '@mui/material'
import {styled} from '@mui/material/styles'
import {Meta, StoryObj} from '@storybook/react-webpack5'

// The library has no icon button of its own: these are the stories of the MUI `IconButton` as the
// theme of pne-ui draws it.
export default {
    title: 'pne-ui/IconButton',
    component: IconButton,
} as Meta<typeof IconButton>

type Story = StoryObj<typeof IconButton>

const CAPTION_SX = {color: 'text.secondary', fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap'} as const

// An icon of an application: a 16px drawing in the colour of the button, not a MUI icon.
const OwnBasketIcon = () => (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
            d='M2 4h12M6.5 4V2.5h3V4M3.5 4l.7 9.5h7.6l.7-9.5M6.5 7v4M9.5 7v4'
            stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'
        />
    </svg>
)

const SIZES: Array<IconButtonProps['size']> = ['small', 'medium', 'large']

const COLORS: Array<{label: string, props: IconButtonProps}> = [
    {label: 'default', props: {}},
    {label: 'primary', props: {color: 'primary'}},
    {label: 'error', props: {color: 'error'}},
    {label: 'success', props: {color: 'success'}},
    {label: 'pnePrimary', props: {color: 'pnePrimary'}},
    {label: 'pneNeutral', props: {color: 'pneNeutral'}},
    {label: 'disabled', props: {disabled: true}},
    {label: 'pnePrimary · disabled', props: {color: 'pnePrimary', disabled: true}},
]

/** `size` × `color`: the box does not depend on the glyph. */
export const Looks: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Box component='table' sx={{borderCollapse: 'separate', borderSpacing: '16px 10px', m: 1}}>
            <thead>
                <tr>
                    <td/>
                    {SIZES.map(size => <Box component='td' key={size} sx={CAPTION_SX}>{size}</Box>)}
                    <Box component='td' sx={CAPTION_SX}>own 16px icon</Box>
                </tr>
            </thead>
            <tbody>
                {COLORS.map(color => (
                    <tr key={color.label}>
                        <Box component='td' sx={CAPTION_SX}>{color.label}</Box>
                        {SIZES.map(size => (
                            <td key={size}>
                                <IconButton aria-label={`${color.label} ${size}`} size={size} {...color.props}>
                                    <SettingsOutlinedIcon/>
                                </IconButton>
                            </td>
                        ))}
                        <td>
                            <IconButton aria-label={`${color.label} own icon`} {...color.props}>
                                <OwnBasketIcon/>
                            </IconButton>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Box>
    ),
}

const Case = ({children, title}: {children: React.ReactNode, title: string}) => (
    <Box>
        <Typography sx={{...CAPTION_SX, mb: 0.5}}>{title}</Typography>
        {children}
    </Box>
)

const Row = ({children, label}: {children: React.ReactNode, label: string}) => (
    <Stack
        direction='row'
        sx={{alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', px: 1.5, py: 0.5, width: 420}}
    >
        <Typography sx={{flex: 1, fontSize: 14}}>{label}</Typography>
        {children}
    </Stack>
)

const BalancingButton = styled(IconButton)`
    width: 26px;
    height: 26px;
    border-radius: 4px;
`

/** Icon buttons the way pages of the applications build them. */
export const AsPagesUseIt: Story = {
    parameters: {controls: {disable: true}},
    render: () => (
        <Stack spacing={2.5} sx={{p: 3, maxWidth: 560}}>
            <Case title='The menu of a row (small)'>
                <Row label='Balance provider 12'>
                    <IconButton aria-label='open menu' size='small'><MoreVertIcon/></IconButton>
                </Row>
            </Case>
            <Case title='Edit and delete of a row (small)'>
                <Row label='Customer level 3'>
                    <IconButton aria-label='delete' size='small'><DeleteOutlinedIcon color='error'/></IconButton>
                    <IconButton aria-label='edit' size='small'><ModeEditIcon/></IconButton>
                </Row>
            </Case>
            <Case title='A row action with an own 16px icon (default size)'>
                <Row label='merchant_id'>
                    <IconButton aria-label='delete property'><OwnBasketIcon/></IconButton>
                </Row>
            </Case>
            <Case title='Inside a field (small, in an adornment)'>
                <TextField
                    defaultValue='4111 1111'
                    size='small'
                    slotProps={{input: {endAdornment: (
                        <InputAdornment position='end'>
                            <IconButton aria-label='clear' edge='end' size='small'><CloseIcon/></IconButton>
                        </InputAdornment>
                    )}}}
                    sx={{width: 240}}
                />
            </Case>
            <Case title='Next to a value: copy (small, with the usual `fontSize="small"` icon)'>
                <Stack direction='row' spacing={1} sx={{alignItems: 'center'}}>
                    <Typography sx={{fontFamily: 'monospace', fontSize: 14}}>u07a00g</Typography>
                    <IconButton aria-label='copy' size='small'><ContentCopyIcon fontSize='small'/></IconButton>
                </Stack>
            </Case>
            <Case title='In a row with a 40px field (large)'>
                <Stack direction='row' spacing={1} sx={{alignItems: 'center'}}>
                    <TextField defaultValue='ALL' sx={{width: 240}}/>
                    <IconButton aria-label='search' size='large'><SearchIcon/></IconButton>
                    <IconButton aria-label='upload' size='large'><FileUploadIcon/></IconButton>
                </Stack>
            </Case>
            <Case title='Filled squares of a toolbar (large, pneNeutral and pnePrimary)'>
                <Stack direction='row' spacing={1}>
                    <IconButton aria-label='settings' color='pneNeutral' size='large'><SettingsOutlinedIcon/></IconButton>
                    <IconButton aria-label='copy' color='pneNeutral' size='large'><ContentCopyIcon/></IconButton>
                    <IconButton aria-label='search' color='pnePrimary' size='large'><SearchIcon/></IconButton>
                </Stack>
            </Case>
            <Case title='The size set by the page: 40px by `sx`'>
                <IconButton aria-label='close' sx={{height: '40px', width: '40px'}}><CloseIcon/></IconButton>
            </Case>
            <Case title='A node of the balancing tree: 26px by `styled` of the page (small)'>
                <Stack direction='row' spacing={0.5}>
                    <BalancingButton aria-label='copy' size='small'><ContentCopyIcon/></BalancingButton>
                    <BalancingButton aria-label='edit' size='small'><ModeEditIcon/></BalancingButton>
                </Stack>
            </Case>
            <Case title='On a dark panel (inherit)'>
                <Box sx={{bgcolor: '#4b5055', color: '#fff', display: 'inline-flex', p: 1}}>
                    <IconButton aria-label='menu' color='inherit'><MoreVertIcon/></IconButton>
                </Box>
            </Case>
        </Stack>
    ),
}
