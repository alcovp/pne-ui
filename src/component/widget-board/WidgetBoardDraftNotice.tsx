import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Alert, AlertTitle, Box, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export type WidgetBoardDraftNoticeProps = {
    activeBreakpointId?: string
    dirtyBreakpointIds?: readonly string[]
    hasDraftChanges?: boolean
    className?: string
    sx?: SxProps<Theme>
}

const joinBreakpointLabels = (
    breakpointIds: readonly string[],
    activeBreakpointId: string | undefined,
    resolveLabel: (breakpointId: string) => string,
) => {
    const orderedIds = activeBreakpointId && breakpointIds.includes(activeBreakpointId)
        ? [activeBreakpointId, ...breakpointIds.filter(id => id !== activeBreakpointId)]
        : breakpointIds

    return orderedIds.map(resolveLabel).join(', ')
}

/** Persistent edit-mode notice for an immutable Default layout draft. */
export const WidgetBoardDraftNotice: React.FC<WidgetBoardDraftNoticeProps> = ({
    activeBreakpointId,
    dirtyBreakpointIds = [],
    hasDraftChanges = false,
    className,
    sx,
}) => {
    const { t } = useTranslation()
    const dirtyBreakpointsLabel = useMemo(
        () => joinBreakpointLabels(
            dirtyBreakpointIds,
            activeBreakpointId,
            breakpointId => String(t(`pne.widgetBoard.breakpoints.${breakpointId}`, {
                defaultValue: breakpointId,
            })),
        ),
        [activeBreakpointId, dirtyBreakpointIds, t],
    )

    return (
        <Alert
            className={className}
            data-pne-widget-board-default-draft-notice='true'
            data-pne-widget-board-dirty={hasDraftChanges ? 'true' : 'false'}
            data-pne-widget-board-dirty-breakpoint-ids={dirtyBreakpointIds.join(' ')}
            icon={<LockOutlinedIcon fontSize='small' />}
            role='status'
            severity={hasDraftChanges ? 'warning' : 'info'}
            sx={[
                {
                    alignItems: 'flex-start',
                    boxSizing: 'border-box',
                    maxWidth: 560,
                    py: 0.5,
                    width: '100%',
                    '& .MuiAlert-icon': { mt: 0.25, mr: 1 },
                    '& .MuiAlert-message': { minWidth: 0, py: 0.25 },
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            <AlertTitle sx={{ fontSize: 13, fontWeight: 700, lineHeight: '18px', mb: 0.25 }}>
                {t('pne.widgetBoard.draft.defaultTitle', {
                    defaultValue: 'You’re editing the Default layout',
                })}
            </AlertTitle>
            <Typography component='p' sx={{ fontSize: 12, lineHeight: '17px' }}>
                {t('pne.widgetBoard.draft.defaultDescription', {
                    defaultValue: 'The Default layout can’t be overwritten. Save your changes as a new layout to keep them.',
                })}
            </Typography>
            {hasDraftChanges && dirtyBreakpointsLabel ? (
                <Box
                    data-pne-widget-board-default-draft-status='true'
                    sx={{ fontSize: 12, fontWeight: 700, lineHeight: '17px', mt: 0.5 }}
                >
                    {t('pne.widgetBoard.draft.unsavedForBreakpoint', {
                        breakpoint: dirtyBreakpointsLabel,
                        defaultValue: 'Unsaved changes · {{breakpoint}}',
                    })}
                </Box>
            ) : null}
        </Alert>
    )
}

export default WidgetBoardDraftNotice
