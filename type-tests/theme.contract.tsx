import * as React from 'react'

import {createPneTheme, PneThemeProvider, type PneCreateThemeOptions, type Skin} from 'pne-ui'

declare const skin: Skin

// An application chooses the skin and the colour mode; the rest of the theme is the library's.
createPneTheme(skin)
createPneTheme(skin, {colorMode: 'dark'})
const options: PneCreateThemeOptions = {colorMode: 'light'}
void options

// @ts-expect-error The theme takes no palette of an application: a missing colour is added to pne-ui.
createPneTheme(skin, {palette: {warning: {main: '#B86A11'}}})
// @ts-expect-error The theme takes no component overrides of an application.
createPneTheme(skin, {components: {MuiPaper: {defaultProps: {square: true}}}})
// @ts-expect-error Nor a third argument that MUI would merge into the theme.
createPneTheme(skin, {colorMode: 'dark'}, {shape: {borderRadius: 2}})

const validProvider = <PneThemeProvider mode='dark' skin={skin}>page</PneThemeProvider>
// @ts-expect-error PneThemeProvider takes no theme options.
const invalidProvider = <PneThemeProvider skin={skin} themeOptions={{}}>page</PneThemeProvider>

void validProvider
void invalidProvider
