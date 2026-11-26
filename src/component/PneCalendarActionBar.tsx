import * as React from 'react'
import {Box, Button} from '@mui/material'
import {usePickerContext, usePickerTranslations} from '@mui/x-date-pickers/hooks'
import type {PickersActionBarAction, PickersActionBarProps} from '@mui/x-date-pickers/PickersActionBar'

/**
 * The action bar of a MUI X picker with the library's own buttons (UI Kit Date picker footer: a
 * tertiary button for stepping back, the primary one for the result), 32px, in the words MUI X
 * translates. Passed as `slots.actionBar`; the picker still decides which actions it has.
 */
const PneCalendarActionBar = (props: PickersActionBarProps) => {
    // The rest are the attributes a picker gives its bar through `slotProps.actionBar` (a click
    // handler, data attributes); the props of MUI's own bar mean nothing here.
    const {actions, className, classes: _classes, disableSpacing: _disableSpacing, sx, ...other} = props
    const attributes = other as Record<string, unknown>
    delete attributes.ownerState
    const translations = usePickerTranslations()
    const {acceptValueChanges, cancelValueChanges, clearValue, goToNextStep, hasNextStep, setValueToToday} =
        usePickerContext()

    if (actions == null || actions.length === 0) {
        return null
    }

    const button = (action: PickersActionBarAction): React.ReactNode => {
        switch (action) {
            case 'clear':
                return (
                    <Button key={action} onClick={clearValue} variant='text' size='medium'>
                        {translations.clearButtonLabel}
                    </Button>
                )
            case 'cancel':
                return (
                    <Button key={action} onClick={cancelValueChanges} variant='text' size='medium'>
                        {translations.cancelButtonLabel}
                    </Button>
                )
            case 'today':
                return (
                    <Button key={action} onClick={setValueToToday} variant='text' size='medium'>
                        {translations.todayButtonLabel}
                    </Button>
                )
            case 'accept':
                return (
                    <Button variant='contained' key={action} onClick={acceptValueChanges} size='medium'>
                        {translations.okButtonLabel}
                    </Button>
                )
            case 'next':
                return (
                    <Button variant='contained' key={action} onClick={goToNextStep} size='medium'>
                        {translations.nextStepButtonLabel}
                    </Button>
                )
            case 'nextOrAccept':
                return hasNextStep ? (
                    <Button variant='contained' key={action} onClick={goToNextStep} size='medium'>
                        {translations.nextStepButtonLabel}
                    </Button>
                ) : (
                    <Button variant='contained' key={action} onClick={acceptValueChanges} size='medium'>
                        {translations.okButtonLabel}
                    </Button>
                )
            default:
                return null
        }
    }

    return (
        <Box
            {...attributes}
            className={className}
            data-pne-calendar-actions='true'
            sx={[barSx, ...(Array.isArray(sx) ? sx : [sx])]}
        >
            {actions.map(button)}
        </Box>
    )
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
