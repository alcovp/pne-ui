import { GlobalStyles } from '@mui/material'
import React from 'react'

type CloudscapeBoardStylesProps = {
    hideNavigationArrows?: boolean
}

/**
 * Global CSS overrides for Cloudscape Board containers to flatten chrome
 * and trim padding on small screens. Keeps arrows hidden by default.
 */
export function CloudscapeBoardStyles({ hideNavigationArrows = true }: CloudscapeBoardStylesProps) {
    return (
        <GlobalStyles
            styles={{
                '[class^="awsui_container-override"], [class*=" awsui_container-override"]': {
                    boxShadow: 'none !important',
                    border: '1px solid #e6e6e6 !important',
                    borderRadius: '0 !important',
                },
                '[class^="awsui_root_"], [class*=" awsui_root_"]': {
                    boxShadow: 'none !important',
                    borderRadius: '0 !important',
                },
                ...(hideNavigationArrows
                    ? {
                          '.awsui_direction-button-wrapper, [class*="direction-button-wrapper"]': {
                              display: 'none !important',
                              visibility: 'hidden !important',
                              opacity: '0 !important',
                              pointerEvents: 'none !important',
                          },
                      }
                    : {}),
                '@media (max-width: 600px)': {
                    '[data-awsui-board]': {
                        paddingLeft: '0 !important',
                        paddingRight: '0 !important',
                    },
                    '[data-awsui-board-item]': {
                        marginLeft: '0 !important',
                        marginRight: '0 !important',
                    },
                },
            }}
        />
    )
}
