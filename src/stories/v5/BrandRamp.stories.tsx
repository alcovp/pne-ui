import * as React from 'react'
import {Box, Stack, Typography} from '@mui/material'
import {getContrastRatio} from '@mui/material/styles'
import {Meta, StoryObj} from '@storybook/react-webpack5'
import {
    createPneBrandRamp,
    createPneTheme,
    PNE_BRAND_RAMP_STEPS,
    type PneBrandRamp,
    type PneButtonStateColors,
    type PneSemanticPalette,
    type Skin,
} from '../../index'
import {STORYBOOK_SKINS} from '../../../.storybook/skins'

type BrandRampArgs = {
    skinColor: string
}

export default {
    title: 'pne-ui 5/Foundations/Brand ramp',
    args: {skinColor: '#026fd7'},
    argTypes: {skinColor: {control: 'color'}},
} as Meta<BrandRampArgs>

type Story = StoryObj<BrandRampArgs>

const SKINS = STORYBOOK_SKINS.map(skin => ({name: skin.title, skinColor: skin.experimentalColor}))

const PAGE = '#FFFFFF'
const TEXT = '#2C3136'
const TEXT_MIN_CONTRAST = 4.5
const UI_MIN_CONTRAST = 3

// The label of a ramp swatch: whichever of white and dark reads better on it.
const labelOn = (fill: string): string =>
    getContrastRatio(fill, '#FFFFFF') >= getContrastRatio(fill, '#000000') ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)'

// A dark label is drawn at 87%; the contrast is counted for black.
const opaque = (color: string): string => color.startsWith('rgba') ? '#000000' : color

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
                    boxShadow: step === 600
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

const ButtonChip = ({colors}: {colors: PneButtonStateColors}) => (
    <Chip
        background={colors.fill === 'transparent' ? PAGE : colors.fill}
        color={colors.text}
        border={colors.border === 'transparent' ? undefined : colors.border}
    >
        Button
    </Chip>
)

// The roles of the light theme as the components take them from `theme.palette.pne`: primary fill
// 600/700/800, outline ring 600 with text 700, soft and outline tints 100/200, link 700, focus
// ring 600, selected row 100, moved by the three skin rules where a step does not read.
const UsageRow = ({pne}: {pne: PneSemanticPalette}) => {
    const {primary, outline, soft} = pne.button
    return (
        <Stack direction='row' spacing={3} useFlexGap sx={{flexWrap: 'wrap', alignItems: 'flex-start'}}>
            <Sample
                title='Primary · rest / hover / pressed'
                note={<Contrast foreground={opaque(primary.default.text)} background={primary.default.fill} minimum={TEXT_MIN_CONTRAST}/>}
            >
                <ButtonChip colors={primary.default}/>
                <ButtonChip colors={primary.hover}/>
                <ButtonChip colors={primary.pressed}/>
            </Sample>
            <Sample
                title='Outlined · rest / hover / pressed'
                note={<Contrast foreground={outline.default.text} background={PAGE} minimum={TEXT_MIN_CONTRAST}/>}
            >
                <ButtonChip colors={outline.default}/>
                <ButtonChip colors={outline.hover}/>
                <ButtonChip colors={outline.pressed}/>
            </Sample>
            <Sample
                title='Soft · rest / hover / pressed'
                note={<Contrast foreground={soft.pressed.text} background={soft.pressed.fill} minimum={TEXT_MIN_CONTRAST}/>}
            >
                <ButtonChip colors={soft.default}/>
                <ButtonChip colors={soft.hover}/>
                <ButtonChip colors={soft.pressed}/>
            </Sample>
            <Sample
                title='Link'
                note={<Contrast foreground={pne.link} background={PAGE} minimum={TEXT_MIN_CONTRAST}/>}
            >
                <Typography sx={{fontSize: 14, color: pne.link, textDecoration: 'underline'}}>Order 172883</Typography>
            </Sample>
            <Sample
                title='Focus ring'
                note={<Contrast foreground={pne.focusRing} background={PAGE} minimum={UI_MIN_CONTRAST}/>}
            >
                <Chip background={PAGE} color={TEXT} border='#B2B8BF' ring={pne.focusRing}>Button</Chip>
            </Sample>
            <Sample title='Selected row'>
                <Box sx={{width: 160, height: 32, px: 1, display: 'flex', alignItems: 'center', bgcolor: pne.dropdown.option.selected, color: TEXT, fontSize: 14}}>
                    Row
                </Box>
            </Sample>
        </Stack>
    )
}

const SkinBlock = ({name, skinColor}: {name: string, skinColor: string}) => {
    const ramp = createPneBrandRamp(skinColor)
    const {pne} = createPneTheme({experimentalColor: skinColor} as Skin).palette
    const kept = ramp[600] === skinColor.toUpperCase()
    return (
        <Stack spacing={1.5} sx={{py: 2, borderTop: '1px solid #E2E9F0'}}>
            <Typography sx={{fontSize: 14, fontWeight: 600, color: TEXT}}>
                {name} · {skinColor.toUpperCase()}{kept ? ' is the fill' : ` → fill ${ramp[600]}`}
            </Typography>
            <RampRow ramp={ramp}/>
            <UsageRow pne={pne}/>
        </Stack>
    )
}

export const Skins: Story = {
    render: () => (
        <Box sx={{bgcolor: PAGE, p: 2}}>
            <Typography sx={{mb: 1, fontSize: 13, color: 'text.secondary', maxWidth: 900}}>
                A skin has one colour. Step 600 is its fill: the skin colour itself when a white label reads
                on it at 4.5:1, and also when the colour is light and takes a dark label; a mid-tone in
                between is made darker until white reads. The other steps are the UI Kit brand ramp moved
                to that fill, so for #026FD7 this is exactly the UI Kit ramp. The samples take their colours
                from the theme. Red numbers are contrast below the minimum.
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
