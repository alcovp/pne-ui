import Box from '@mui/material/Box'
import {styled, type Theme} from '@mui/material/styles'
import type {SystemStyleObject} from '@mui/system'

export const pneSurfaceTitleSx: SystemStyleObject<Theme> = {
    padding: '0',
    fontWeight: '700',
    fontSize: '18px',
    lineHeight: '24px',
}

export const pneSurfaceSubtitleSx: SystemStyleObject<Theme> = {
    padding: '0',
    fontWeight: '400',
    fontSize: '12px',
    lineHeight: '12px',
    letterSpacing: '0.15px',
}

export const pneSurfaceCloseButtonSx: SystemStyleObject<Theme> = {
    width: '40px',
    height: '40px',
    background: '#F1F5FA',
    borderRadius: '4px',
}

export const PneSurface = styled(Box)`
    box-sizing: border-box;
    background: #fff;
    border: none;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0px -1px 12px rgba(0, 0, 0, 0.03), 0px 3px 3px rgba(0, 0, 0, 0.02), 0px 7px 6px rgba(0, 0, 0, 0.06), 0px 12px 10px rgba(0, 0, 3, 0.03), 0px 22px 18px rgba(0, 0, 0, 0.04), 0px 40px 33px rgba(0, 0, 0, 0.04), 0px 100px 80px rgba(0, 0, 0, 0.04);
`

export const PneSurfaceHeader = styled(Box)`
    display: flex;
    flex: 0 0 auto;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #F1F5FA;
    gap: 16px;
`

export const PneSurfaceBody = styled(Box)`
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 24px;
`

export const PneSurfaceFooter = styled(Box)`
    flex: 0 0 auto;
    padding: 16px 24px;
    border-top: 1px solid #F1F5FA;
`
