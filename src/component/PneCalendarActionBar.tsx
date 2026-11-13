import * as React from 'react'
import {Box} from '@mui/material'
import {usePickerContext, usePickerTranslations} from '@mui/x-date-pickers/hooks'
import type {PickersActionBarAction, PickersActionBarProps} from '@mui/x-date-pickers/PickersActionBar'
import PneButton from './PneButton'

/**
 * The action bar of a MUI X picker with the library's own buttons (UI Kit Date picker footer: a
 * tertiary button for stepping back, the primary one for the result), 32px, in the words MUI X
 * translates. Passed as `slots.actionBar`; the picker still decides which actions it has.
 */
const PneCalendarActionBar = (props: PickersActionBarProps) => {
    const {actions, className} = props
    const translations = usePickerTranslations()
    const {
        acceptValueChanges,
        cancelValueChanges,
        clearValue,
        goToNextStep,
        hasNextStep,
        setValueToToday,
    } = usePickerContext()

    if (actions == null || actions.length === 0) {
        return null
    }

    const button = (action: PickersActionBarAction): React.ReactNode => {
        switch (action) {
            case 'clear':
                return <PneButton key={action} onClick={clearValue} pneStyle='text' size='medium'>
                    {translations.clearButtonLabel}
                </PneButton>
            case 'cancel':
                return <PneButton key={action} onClick={cancelValueChanges} pneStyle='text' size='medium'>
                    {translations.cancelButtonLabel}
                </PneButton>
            case 'today':
                return <PneButton key={action} onClick={setValueToToday} pneStyle='text' size='medium'>
                    {translations.todayButtonLabel}
                </PneButton>
            case 'accept':
                return <PneButton key={action} onClick={acceptValueChanges} size='medium'>
                    {translations.okButtonLabel}
                </PneButton>
            case 'next':
                return <PneButton key={action} onClick={goToNextStep} size='medium'>
                    {translations.nextStepButtonLabel}
                </PneButton>
            case 'nextOrAccept':
                return hasNextStep
                    ? <PneButton key={action} onClick={goToNextStep} size='medium'>
                        {translations.nextStepButtonLabel}
                    </PneButton>
                    : <PneButton key={action} onClick={acceptValueChanges} size='medium'>
                        {translations.okButtonLabel}
                    </PneButton>
            default:
                return null
        }
    }

    return <Box className={className} data-pne-calendar-actions='true' sx={barSx}>
        {actions.map(button)}
    </Box>
}

export default PneCalendarActionBar

const barSx = {
    alignItems: 'center',
    display: 'flex',
    gap: '8px',
    gridColumn: '1 / 4',
    gridRow: 3,
    justifyContent: 'flex-end',
    padding: '8px 12px',
}
