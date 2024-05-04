import * as React from 'react';
import {createPneTheme} from "../src/createTheme";
import {ThemeProvider} from '@mui/material';

const preview = {
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
