import Box from '@mui/material/Box'
import {styled, type SxProps, type Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'

export const getPneSurfaceTitleSx = (hasExplicitColor = false): SxProps<Theme> => (
    theme: Theme,
) => ({
    padding: '0',
    fontWeight: '700',
    fontSize: '18px',
    lineHeight: '24px',
    color: !hasExplicitColor && theme.palette.mode === 'dark'
        ? theme.palette.text.primary
        : undefined,
})

export const pneSurfaceSubtitleSx: SystemStyleObject<Theme> = {
    padding: '0',
    fontWeight: '400',
    fontSize: '12px',
    lineHeight: '12px',
    letterSpacing: '0.15px',
}

export const pneSurfaceCloseButtonSx: SxProps<Theme> = (theme: Theme) => ({
    width: '40px',
    height: '40px',
    backgroundColor: theme.palette.pne?.surface.subtle ?? '#F1F5FA',
    borderRadius: '4px',
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.action.selected
            : '#F1F5FA',
    },
})

export const PneSurface = styled(Box)(({theme}) => ({
    boxSizing: 'border-box',
    colorScheme: theme.palette.mode,
    background: theme.palette.background.paper,
    color: theme.palette.text.primary,
    border: 'none',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: theme.palette.mode === 'dark'
        ? '0 16px 40px rgba(0, 0, 0, 0.48)'
        : '0px -1px 12px rgba(0, 0, 0, 0.03), 0px 3px 3px rgba(0, 0, 0, 0.02), 0px 7px 6px rgba(0, 0, 0, 0.06), 0px 12px 10px rgba(0, 0, 3, 0.03), 0px 22px 18px rgba(0, 0, 0, 0.04), 0px 40px 33px rgba(0, 0, 0, 0.04), 0px 100px 80px rgba(0, 0, 0, 0.04)',
}))

export const PneSurfaceHeader = styled(Box)(({theme}) => ({
    display: 'flex',
    flex: '0 0 auto',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: `1px solid ${theme.palette.pne?.border.subtle ?? '#F1F5FA'}`,
    gap: '16px',
}))

export const PneSurfaceBody = styled(Box)`
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 24px;
`

export const PneSurfaceFooter = styled(Box)(({theme}) => ({
    flex: '0 0 auto',
    padding: '16px 24px',
    borderTop: `1px solid ${theme.palette.pne?.border.subtle ?? '#F1F5FA'}`,
}))
