import React, { useId, useState } from 'react'
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Button, ListItemIcon, Menu, MenuItem } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { WidgetBoardEditScale } from './types'

export type WidgetBoardEditScaleControlProps = {
    scale: WidgetBoardEditScale
    onScaleChange: (scale: WidgetBoardEditScale) => void
    disabled?: boolean
    className?: string
    sx?: SxProps<Theme>
}

const editScales: readonly WidgetBoardEditScale[] = [1, 0.75, 0.5]

const toPercent = (scale: WidgetBoardEditScale) => Math.round(scale * 100)

export const WidgetBoardEditScaleControl: React.FC<WidgetBoardEditScaleControlProps> = ({
    scale,
    onScaleChange,
    disabled = false,
    className,
    sx,
}) => {
    const { t } = useTranslation()
    const menuId = useId()
    const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)
    const isOpen = Boolean(anchorElement)
    const percent = toPercent(scale)
    const label = t('pne.widgetBoard.rgl.scale.label', {
        defaultValue: 'Board scale',
    })
    const currentLabel = t('pne.widgetBoard.rgl.scale.current', {
        percent,
        defaultValue: 'Board scale: {{percent}}%',
    })

    const handleClose = () => setAnchorElement(null)
    const handleSelect = (nextScale: WidgetBoardEditScale) => {
        onScaleChange(nextScale)
        handleClose()
    }

    return (
        <Box
            className={className}
            data-pne-widget-board-edit-scale-control='true'
            sx={[
                { display: 'inline-flex', alignItems: 'center', flex: '0 0 auto' },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <Button
                aria-controls={isOpen ? menuId : undefined}
                aria-expanded={isOpen ? 'true' : undefined}
                aria-haspopup='menu'
                aria-label={currentLabel}
                data-pne-widget-board-edit-scale-trigger='true'
                disabled={disabled}
                endIcon={<ArrowDropDownRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={event => setAnchorElement(event.currentTarget)}
                size='small'
                title={currentLabel}
                variant='outlined'
                sx={{
                    height: 28,
                    minWidth: 58,
                    px: 1,
                    py: 0,
                    borderColor: 'rgba(94, 117, 148, 0.28)',
                    color: '#5E7594',
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1,
                    '& .MuiButton-endIcon': { ml: 0.25, mr: -0.5 },
                }}
            >
                {percent}%
            </Button>
            <Menu
                id={menuId}
                anchorEl={anchorElement}
                open={isOpen}
                onClose={handleClose}
                slotProps={{ list: { 'aria-label': label } }}
            >
                {editScales.map(option => {
                    const optionPercent = toPercent(option)
                    const optionLabel = option === 0.5
                        ? t('pne.widgetBoard.rgl.scale.overview', {
                            percent: optionPercent,
                            defaultValue: '{{percent}}% · Overview',
                        })
                        : `${optionPercent}%`

                    return (
                        <MenuItem
                            key={option}
                            data-pne-widget-board-edit-scale-option={option}
                            onClick={() => handleSelect(option)}
                            selected={scale === option}
                            sx={{ minWidth: 168 }}
                        >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                                {scale === option ? <CheckRoundedIcon fontSize='small' /> : null}
                            </ListItemIcon>
                            {optionLabel}
                        </MenuItem>
                    )
                })}
            </Menu>
        </Box>
    )
}

export default WidgetBoardEditScaleControl
