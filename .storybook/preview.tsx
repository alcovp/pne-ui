import * as React from 'react';
import {createPneTheme} from "../src/createTheme";
import {ThemeProvider} from '@mui/material';

const preview = {
    actions: {argTypesRegex: "^on[A-Z].*"},
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    decorators: [
        (Story) => <ThemeProvider theme={createPneTheme()}>
            <Story/>
        </ThemeProvider>,
    ],
};

export default preview;
