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
    const boardGridSelector = '[data-pne-widget-board="true"] [class*="awsui_grid_"][class*="awsui_columns-"]'
    const navigationStyles = hideNavigationArrows
        ? {
            '.awsui_direction-button-wrapper, [class*="direction-button-wrapper"]': {
                display: 'none !important',
                visibility: 'hidden !important',
                opacity: '0 !important',
                pointerEvents: 'none !important',
            },
        }
        : {}

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
                '[data-item-id] [data-height-mode="auto"] [class*="content-fit-height"]': {
                    overflow: 'hidden !important',
                },
                '[data-item-id] [data-height-mode="auto"] [class*="content-wrapper-fit-height"]': {
                    overflow: 'hidden !important',
                },
                // Cloudscape BoardItem adds top offsets for handle/settings wrappers.
                // With custom widget headers this shifts the drag grip ~2-3px down vs title baseline.
                // Limit centering to headers that actually contain board-item drag handle.
                '[class*="awsui_header_"]:has(> [class*="awsui_handle_"])': {
                    alignItems: 'center !important',
                    paddingBlockEnd: '0 !important',
                },
                '[class*="awsui_header_"] > [class*="awsui_handle_"]': {
                    marginBlockStart: '0 !important',
                },
                '[class*="awsui_header_"] > [class*="awsui_settings_"]': {
                    marginBlockStart: '0 !important',
                },
                // Cloudscape visual refresh applies:
                // .awsui_refresh_* > .awsui_handle_* { margin-block-start: calc(...2px + 1px); }
                // Pin it to zero explicitly to avoid 3px vertical drift.
                '[class*="awsui_header_"][class*="awsui_refresh_"] > [class*="awsui_handle_"]': {
                    marginBlockStart: '0 !important',
                },
                '[class*="awsui_header_"][class*="awsui_refresh_"] > [class*="awsui_settings_"]': {
                    marginBlockStart: '0 !important',
                },
                '@media (hover: none), (pointer: coarse)': {
                    '[data-item-id]': {
                        touchAction: 'manipulation !important',
                    },
                },
                [boardGridSelector]: {
                    gap: '16px !important',
                },
                ...navigationStyles,
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
                '@media (max-width: 639.95px)': {
                    [boardGridSelector]: {
                        gap: '8px !important',
                    },
                },
            }}
        />
    )
}
