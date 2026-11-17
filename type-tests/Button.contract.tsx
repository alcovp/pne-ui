import * as React from 'react'
import {Button} from '@mui/material'

// The declarations of pne-ui add `soft` to the MUI button and take away the colours it has no look for.
import {createPneTheme} from 'pne-ui'
// @ts-expect-error PneButton was removed; the theme draws the MUI Button.
import {PneButton} from 'pne-ui'
// @ts-expect-error PneButtonGroup was removed; use MUI ButtonGroup directly.
import {PneButtonGroup} from 'pne-ui'

const validContracts = <>
    <Button variant='contained'>Save</Button>
    <Button variant='contained' color='error'>Delete</Button>
    <Button variant='contained' color='warning'>Proceed</Button>
    <Button variant='outlined'>Cancel</Button>
    <Button variant='text' color='error'>Delete</Button>
    <Button variant='text' color='success'>Activate</Button>
    <Button variant='soft' size='small'>Columns</Button>
    <Button color='inherit'>Undo</Button>
    <Button loading loadingPosition='start'>Save</Button>
</>

// @ts-expect-error The UI Kit has no secondary button.
const secondary = <Button color='secondary'/>

// @ts-expect-error The UI Kit has no info button.
const info = <Button color='info'/>

// @ts-expect-error The colours of the version 4 button are gone with it.
const legacyColor = <Button color='pneNeutral'/>

// @ts-expect-error Only the three sizes of the design system.
const invalidSize = <Button size='extra-large'/>

void validContracts
void createPneTheme
void PneButton
void PneButtonGroup
void secondary
void info
void legacyColor
void invalidSize
