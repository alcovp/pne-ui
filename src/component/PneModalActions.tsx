import React, {ReactNode} from 'react'
import Box, {BoxProps} from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import {styled} from '@mui/material/styles'

export type PneModalActionsProps = Omit<BoxProps, 'children'> & {
    primary: ReactNode
    secondary?: ReactNode
    leading?: ReactNode
}

const PneModalActions = ({
    primary,
    secondary,
    leading,
    ...boxProps
}: PneModalActionsProps) => {
    const isNarrow = useMediaQuery('(max-width:480px)')

    if (isNarrow) {
        return (
            <ActionsRoot
                {...boxProps}
                data-layout='narrow'
                data-pne-modal-actions='true'
            >
                <NarrowActionSlot data-pne-modal-action='primary'>
                    {primary}
                </NarrowActionSlot>
                {secondary != null && (
                    <NarrowActionSlot data-pne-modal-action='secondary'>
                        {secondary}
                    </NarrowActionSlot>
                )}
                {leading != null && (
                    <NarrowActionSlot data-pne-modal-action='leading'>
                        {leading}
                    </NarrowActionSlot>
                )}
            </ActionsRoot>
        )
    }

    return (
        <ActionsRoot
            {...boxProps}
            data-layout='desktop'
            data-pne-modal-actions='true'
        >
            {leading != null && (
                <LeadingActionSlot data-pne-modal-action='leading'>
                    {leading}
                </LeadingActionSlot>
            )}
            <TrailingActions data-pne-modal-actions-group='trailing'>
                {secondary != null && (
                    <ActionSlot data-pne-modal-action='secondary'>
                        {secondary}
                    </ActionSlot>
                )}
                <ActionSlot data-pne-modal-action='primary'>
                    {primary}
                </ActionSlot>
            </TrailingActions>
        </ActionsRoot>
    )
}

export default PneModalActions

const ActionsRoot = styled(Box)`
    display: flex;
    width: 100%;
    box-sizing: border-box;
    gap: 8px;

    &[data-layout='desktop'] {
        align-items: center;
        justify-content: flex-end;
    }

    &[data-layout='narrow'] {
        flex-direction: column;
        align-items: stretch;
    }
`

const ActionSlot = styled(Box)`
    display: flex;
`

const LeadingActionSlot = styled(ActionSlot)`
    margin-inline-end: auto;
`

const TrailingActions = styled(Box)`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
`

const NarrowActionSlot = styled(ActionSlot)`
    width: 100%;

    & > *,
    & button,
    & .MuiButton-root {
        width: 100%;
    }
`
