import React, {forwardRef, ReactNode} from 'react'
import {SxProps, styled, Theme} from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

type PneModalActionsDataAttributes = {
    [attribute: `data-${string}`]: string | number | boolean | undefined
}

export type PneModalActionsProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'children' | 'dangerouslySetInnerHTML'
> & PneModalActionsDataAttributes & {
    /** Keep the leading action in the same 8px group instead of separating it to the opposite edge. */
    groupLeading?: boolean
    primary: ReactNode
    secondary?: ReactNode
    leading?: ReactNode
    sx?: SxProps<Theme>
}

const PneModalActions = forwardRef<HTMLDivElement, PneModalActionsProps>(
    function PneModalActions({
        primary,
        secondary,
        leading,
        groupLeading = false,
        ...rootProps
    }, ref) {
        const safeRootProps = sanitizeRootProps(rootProps)
        const isNarrow = useMediaQuery('(max-width:480px)')
        const leadingAction = leading != null
            ? <LeadingActionSlot
                $groupLeading={groupLeading}
                key='leading'
                data-pne-modal-action='leading'
            >
                {leading}
            </LeadingActionSlot>
            : null
        const secondaryAction = secondary != null
            ? <ActionSlot key='secondary' data-pne-modal-action='secondary'>
                {secondary}
            </ActionSlot>
            : null
        const primaryAction = <ActionSlot key='primary' data-pne-modal-action='primary'>
            {primary}
        </ActionSlot>
        const trailingActions = <TrailingActions
            key='trailing'
            data-pne-modal-actions-group='trailing'
        >
            {isNarrow
                ? <>{primaryAction}{secondaryAction}</>
                : <>{secondaryAction}{primaryAction}</>}
        </TrailingActions>

        return (
            <ActionsRoot
                {...safeRootProps}
                ref={ref}
                data-pne-modal-actions='true'
            >
                {isNarrow
                    ? <>{trailingActions}{leadingAction}</>
                    : <>{leadingAction}{trailingActions}</>}
            </ActionsRoot>
        )
    },
)

export default PneModalActions

const sanitizeRootProps = (
    props: Omit<PneModalActionsProps, 'leading' | 'primary' | 'secondary'>,
): Omit<PneModalActionsProps, 'leading' | 'primary' | 'secondary'> => {
    const safeProps: Record<string, unknown> = {...props}
    delete safeProps.as
    delete safeProps.children
    delete safeProps.component
    delete safeProps.dangerouslySetInnerHTML
    return safeProps as Omit<PneModalActionsProps, 'leading' | 'primary' | 'secondary'>
}

const ActionsRoot = styled('div')`
    display: flex;
    width: 100%;
    box-sizing: border-box;
    gap: 8px;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: nowrap;

    @media (max-width: 480px) {
        flex-direction: column;
        align-items: stretch;
    }
`

const ActionSlot = styled('div')`
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    flex-wrap: nowrap;
    gap: 8px;
    white-space: nowrap;

    & > *,
    & button,
    & .MuiButton-root {
        flex: 0 0 auto;
        white-space: nowrap;
    }

    @media (max-width: 480px) {
        align-items: stretch;
        flex: 0 1 auto;
        flex-direction: column;
        flex-wrap: nowrap;
        width: 100%;
        white-space: normal;

        & > *,
        & button,
        & .MuiButton-root {
            flex: 0 1 auto;
            white-space: normal;
            width: 100%;
        }
    }
`

const LeadingActionSlot = styled(ActionSlot, {
    shouldForwardProp: prop => prop !== '$groupLeading',
})<{ $groupLeading: boolean }>`
    margin-inline-end: ${({$groupLeading}) => $groupLeading ? '0px' : 'auto'};

    @media (max-width: 480px) {
        margin-inline-end: 0;
    }
`

const TrailingActions = styled('div')`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 auto;
    gap: 8px;

    @media (max-width: 480px) {
        flex: 0 1 auto;
        width: 100%;
        flex-direction: column;
        align-items: stretch;
    }
`
