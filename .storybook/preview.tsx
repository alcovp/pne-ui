import * as React from 'react';
import {createPneTheme} from "../src/createTheme";
import {ThemeProvider} from '@mui/material';
import {Skin} from "../src";
import { MINIMAL_VIEWPORTS } from '@storybook/addon-viewport'
import { withContext } from './decorators/withContext';

const defaultSkin: Skin = {
    'headerBackgroundColor': '#18547b',
    'headerTextColor': '#fff',
    'headerBorder': '1px solid #3899d5',
    'menuBackgroundColor': '#fff',
    'menuBorder': '1px solid transparent',
    'menuItemBackgroundColor': '#1686ca',
    'menuItemTextColor': '#fff',
    'menuItemBorderLeft': '1px solid #2aa4f2',
    'menuItemBorderTop': '1px solid #2aa4f2',
    'menuItemBorderRight': '1px solid #106ba3',
    'menuItemBorderBottom': 'none',
    'menuItemActiveBackgroundColor': '#f0f8fc',
    'menuItemActiveTextColor': '#116fa9',
    'menuItemActiveBorderLeft': '1px solid #fff',
    'menuItemActiveBorderTop': '1px solid #fff',
    'menuItemActiveBorderRight': '1px solid #0d68a2',
    'menuItemActiveBorderBottom': 'none',
    'menuItemHoverBackgroundColor': '#f0f8fc',
    'menuItemHoverTextColor': '#116fa9',
    'menuItemHoverBorderLeft': '1px solid #fff',
    'menuItemHoverBorderTop': '1px solid #fff',
    'menuItemHoverBorderRight': '1px solid #0d68a2',
    'menuItemHoverBorderBottom': 'none',
    'subMenuBackgroundColor': '#1686ca',
    'subMenuItemTextColor': '#fff',
    'subMenuItemHoverTextColor': '#fff',
    'subMenuItemHoverBackgroundColor': '#116fa9',
    'footerBackgroundColor': '#18547b',
    'footerTextColor': '#fff',
    'experimentalColor': '#0a91bc'
}

const customViewports = {
    mobile360: {
        name: 'Mobile 360px',
        styles: {
            width: '360px',
            height: '780px',
        },
    },
    tablet600: {
        name: 'Tablet 600px',
        styles: {
            width: '600px',
            height: '960px',
        },
    },
}

const preview = {
    decorators: [
        withContext,
    ],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        viewport: {
            viewports: {
                ...MINIMAL_VIEWPORTS,
                ...customViewports,
            },
        },
    },
    decorators: [
        (Story) => <ThemeProvider theme={createPneTheme(defaultSkin)}>
            <Story/>
        </ThemeProvider>,
    ],
};

export default preview;
