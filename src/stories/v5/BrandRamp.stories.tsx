import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {getContrastRatio} from '@mui/material/styles'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {createPneBrandRamp, PNE_BRAND_RAMP_STEPS, type PneBrandRamp} from '../../index'
import {STORYBOOK_SKINS} from '../../../.storybook/skins'

type BrandRampArgs = {
    skinColor: string
}

export default {
    title: 'pne-ui 5/Foundations/Brand ramp',
    args: {skinColor: '#007dff'},
    argTypes: {skinColor: {control: 'color'}},
} as Meta<BrandRampArgs>

type Story = StoryObj<BrandRampArgs>

const SKINS = STORYBOOK_SKINS.map(skin => ({name: skin.title, skinColor: skin.experimentalColor}))

const PAGE = '#FFFFFF'
const TEXT = '#38434D'
const TEXT_MIN_CONTRAST = 4.5
const UI_MIN_CONTRAST = 3

// The light theme's label rule today: white when it reaches 3:1 on the fill, dark otherwise.
const labelOn = (fill: string): string =>
    getContrastRatio(fill, '#FFFFFF') >= UI_MIN_CONTRAST ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)'

const Contrast = ({foreground, background, minimum}: {
    foreground: string
    background: string
    minimum: number
}) => {
    const ratio = getContrastRatio(foreground, background)
    const passes = ratio >= minimum
    return (
        <Typography
            component='span'
            sx={{fontSize: 11, fontWeight: passes ? 400 : 700, color: passes ? 'text.secondary' : 'error.main'}}
        >
            {ratio.toFixed(1)}{passes ? '' : ` < ${minimum}`}
        </Typography>
    )
}

const Sample = ({title, children, note}: {title: string, children: React.ReactNode, note?: React.ReactNode}) => (
    <Stack spacing={0.5} sx={{minWidth: 0}}>
        <Typography sx={{fontSize: 11, color: 'text.secondary'}}>{title}</Typography>
        <Stack direction='row' spacing={0.5} sx={{alignItems: 'center'}}>{children}</Stack>
        {note}
    </Stack>
)

const Chip = ({background, color, border, ring, children}: {
    background: string
    color: string
    border?: string
    ring?: string
    children: React.ReactNode
}) => (
    <Box
        sx={{
            height: 32,
            px: 1.25,
            display: 'flex',
            alignItems: 'center',
            borderRadius: '4px',
            bgcolor: background,
            color,
            fontFamily: 'Roboto, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: [
                border ? `inset 0 0 0 1px ${border}` : '',
                ring ? `0 0 0 2px ${PAGE}, 0 0 0 4px ${ring}` : '',
            ].filter(Boolean).join(', ') || 'none',
        }}
    >
        {children}
    </Box>
)

const RampRow = ({ramp}: {ramp: PneBrandRamp}) => (
    <Box
        sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${PNE_BRAND_RAMP_STEPS.length}, minmax(48px, 1fr))`,
            gap: '2px',
        }}
    >
        {PNE_BRAND_RAMP_STEPS.map(step => (
            <Box
                key={step}
                sx={{
                    height: 44,
                    px: 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '2px',
                    bgcolor: ramp[step],
                    color: labelOn(ramp[step]),
                    fontSize: 10,
                    boxShadow: step === 500
                        ? `inset 0 0 0 2px ${labelOn(ramp[step])}`
                        : step === 0 ? 'inset 0 0 0 1px #E1E7EF' : 'none',
                }}
            >
                <span>{step}</span>
                <span>{ramp[step].slice(1)}</span>
            </Box>
        ))}
    </Box>
)

// UI Kit light theme: primary fill 500/600/700, outline 500 → 700, soft fill 50/100 with a
// 500/700 label, link 400, focus ring 600, selected row 50.
const UsageRow = ({ramp}: {ramp: PneBrandRamp}) => (
    <Stack direction='row' spacing={3} useFlexGap sx={{flexWrap: 'wrap', alignItems: 'flex-start'}}>
        <Sample
            title='Primary · rest / hover / pressed'
            note={<Contrast foreground={labelOn(ramp[500])} background={ramp[500]} minimum={TEXT_MIN_CONTRAST}/>}
        >
            <Chip background={ramp[500]} color={labelOn(ramp[500])}>Button</Chip>
            <Chip background={ramp[600]} color={labelOn(ramp[600])}>Button</Chip>
            <Chip background={ramp[700]} color={labelOn(ramp[700])}>Button</Chip>
        </Sample>
        <Sample
            title='Outlined · rest / hover'
            note={<Contrast foreground={ramp[500]} background={PAGE} minimum={TEXT_MIN_CONTRAST}/>}
        >
            <Chip background={PAGE} color={ramp[500]} border={ramp[500]}>Button</Chip>
            <Chip background={PAGE} color={ramp[500]} border={ramp[700]}>Button</Chip>
        </Sample>
        <Sample
            title='Soft · hover / pressed'
            note={<Contrast foreground={ramp[700]} background={ramp[100]} minimum={TEXT_MIN_CONTRAST}/>}
        >
            <Chip background={ramp[50]} color={ramp[500]}>Button</Chip>
            <Chip background={ramp[100]} color={ramp[700]}>Button</Chip>
        </Sample>
        <Sample
            title='Link (400)'
            note={<Contrast foreground={ramp[400]} background={PAGE} minimum={TEXT_MIN_CONTRAST}/>}
        >
            <Typography sx={{fontSize: 14, color: ramp[400], textDecoration: 'underline'}}>Order 172883</Typography>
        </Sample>
        <Sample
            title='Focus ring (600)'
            note={<Contrast foreground={ramp[600]} background={PAGE} minimum={UI_MIN_CONTRAST}/>}
        >
            <Chip background={PAGE} color={TEXT} border='#B0B7C3' ring={ramp[600]}>Button</Chip>
        </Sample>
        <Sample title='Selected row (50)'>
            <Box sx={{width: 160, height: 32, px: 1, display: 'flex', alignItems: 'center', bgcolor: ramp[50], color: TEXT, fontSize: 14}}>
                Row
            </Box>
        </Sample>
    </Stack>
)

const SkinBlock = ({name, skinColor}: {name: string, skinColor: string}) => {
    const ramp = createPneBrandRamp(skinColor)
    return (
        <Stack spacing={1.5} sx={{py: 2, borderTop: '1px solid #E1E7EF'}}>
            <Typography sx={{fontSize: 14, fontWeight: 600, color: TEXT}}>
                {name} · {ramp[500]}
            </Typography>
            <RampRow ramp={ramp}/>
            <UsageRow ramp={ramp}/>
        </Stack>
    )
}

export const Skins: Story = {
    render: () => (
        <Box sx={{bgcolor: PAGE, p: 2}}>
            <Typography sx={{mb: 1, fontSize: 13, color: 'text.secondary', maxWidth: 900}}>
                A skin has one colour, step 500. Lighter steps mix it with white, darker steps with
                step 1000: the same hue at a third of the saturation and about half the lightness.
                For #007DFF this is exactly the UI Kit brand ramp. Red numbers are contrast below the minimum.
            </Typography>
            {SKINS.map(skin => <SkinBlock key={skin.name} {...skin}/>)}
        </Box>
    ),
}

export const Playground: Story = {
    render: ({skinColor}) => (
        <Box sx={{bgcolor: PAGE, p: 2}}>
            <SkinBlock name='Skin colour' skinColor={skinColor}/>
        </Box>
    ),
}
