import React from 'react'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import VerticalAlignTopRoundedIcon from '@mui/icons-material/VerticalAlignTopRounded'
import { Box, ToggleButton, Tooltip } from '@mui/material'
import { alpha, type SxProps, type Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { WidgetBoardReactGridLayoutTuning } from './types'

export type WidgetBoardReactGridLayoutTuningControlsProps = {
    tuning: WidgetBoardReactGridLayoutTuning
    onTuningChange: (tuning: WidgetBoardReactGridLayoutTuning) => void
    className?: string
    sx?: SxProps<Theme>
}

const neutralColor = '#5E7594'
const tuningButtonSx: SxProps<Theme> = {
    width: 28,
    minWidth: 28,
    height: 28,
    p: 0,
    flexShrink: 0,
    color: neutralColor,
    borderColor: 'rgba(94, 117, 148, 0.28)',
    borderRadius: 1,
    '&:hover': {
        color: 'primary.main',
        borderColor: theme => alpha(theme.palette.primary.main, 0.42),
        bgcolor: theme => alpha(theme.palette.primary.main, 0.06),
    },
    '&.Mui-selected': {
        color: 'primary.main',
        borderColor: theme => alpha(theme.palette.primary.main, 0.52),
        bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
    },
    '&.Mui-selected:hover': {
        bgcolor: theme => alpha(theme.palette.primary.main, 0.14),
    },
}

export const WidgetBoardReactGridLayoutTuningControls: React.FC<
    WidgetBoardReactGridLayoutTuningControlsProps
> = ({ tuning, onTuningChange, className, sx }) => {
    const { t } = useTranslation()
    const verticalCompactionLabel = t('pne.widgetBoard.rgl.verticalCompaction', {
        defaultValue: 'Vertical compaction: fill empty space',
    })
    const preventCollisionsLabel = t('pne.widgetBoard.rgl.preventCollisions', {
        defaultValue: 'Prevent collisions: block occupied positions',
    })

    return (
        <Box
            className={className}
            data-pne-widget-board-rgl-tuning-controls='true'
            sx={[
                { display: 'flex', alignItems: 'center', gap: 0.5 },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <Tooltip title={verticalCompactionLabel} enterDelay={400}>
                <ToggleButton
                    value='vertical-compaction'
                    selected={tuning.compaction === 'vertical'}
                    aria-label={verticalCompactionLabel}
                    data-pne-widget-board-rgl-compaction-toggle='true'
                    onChange={() =>
                        onTuningChange({
                            ...tuning,
                            compaction: tuning.compaction === 'vertical' ? 'none' : 'vertical',
                        })
                    }
                    sx={tuningButtonSx}
                >
                    <VerticalAlignTopRoundedIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
            </Tooltip>
            <Tooltip title={preventCollisionsLabel} enterDelay={400}>
                <ToggleButton
                    value='prevent-collisions'
                    selected={tuning.collisionBehavior === 'prevent'}
                    aria-label={preventCollisionsLabel}
                    data-pne-widget-board-rgl-collision-toggle='true'
                    onChange={() =>
                        onTuningChange({
                            ...tuning,
                            collisionBehavior:
                                tuning.collisionBehavior === 'prevent' ? 'push' : 'prevent',
                        })
                    }
                    sx={tuningButtonSx}
                >
                    <BlockRoundedIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
            </Tooltip>
        </Box>
    )
}

export default WidgetBoardReactGridLayoutTuningControls
