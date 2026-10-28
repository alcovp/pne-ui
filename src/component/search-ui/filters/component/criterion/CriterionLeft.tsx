import React, {useState} from 'react';
import {CriterionTypeEnum} from '../../types';
import {useTranslation} from 'react-i18next';
import {Box, Tooltip} from '@mui/material';
import type {SxProps, Theme} from '@mui/material/styles';
import {SEARCH_UI_FILTERS_TOOLTIP_DELAY} from '../../styled';

type Props = {
    criterionType: CriterionTypeEnum
}

export const CriterionLeft = (props: Props) => {
    const {
        criterionType
    } = props

    const {t} = useTranslation()
    const label = t('react.CriterionTypeEnum.' + criterionType)
    // Only a name cut by the column gets the tooltip; measured as the pointer arrives, before the
    // tooltip's delay runs out, so the column width at that moment decides.
    const [truncated, setTruncated] = useState(false)
    const measure = (event: React.SyntheticEvent<HTMLElement>) => {
        const element = event.currentTarget
        setTruncated(element.scrollWidth > element.clientWidth)
    }

    // A name that does not fit its column is cut with an ellipsis, never wrapped.
    return <Tooltip
        disableInteractive
        enterDelay={SEARCH_UI_FILTERS_TOOLTIP_DELAY}
        enterNextDelay={SEARCH_UI_FILTERS_TOOLTIP_DELAY}
        title={truncated ? label : ''}
    >
        <Box sx={titleSx} onMouseEnter={measure} onTouchStart={measure}>
            <Box component={'span'}>
                {label}
            </Box>
        </Box>
    </Tooltip>
}

// Full-strength label colour from the palette, so dark mode reads; the light colour stands in
// without the PNE theme.
const titleSx: SxProps<Theme> = {
    minWidth: '150px',
    maxWidth: '100%',
    fontSize: '15px',
    lineHeight: '20px',
    color: theme => theme.palette.pne?.text.default ?? '#38434D',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
}
