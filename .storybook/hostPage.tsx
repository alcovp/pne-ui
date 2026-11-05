import * as React from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import type {PneColorMode} from '../src';

/**
 * The base a Paynet page gives pne-ui components. There the legacy CSS of the skin sets it (a YUI reset
 * and the page style: Arial 12px, the page colours), and the host Storybook loads that CSS as is. Here
 * only its rules for plain elements are repeated, the ones that reach pne-ui markup, so components look
 * as they do in the host.
 */
const HOST_PAGE_BASE = `
body, div, dl, dt, dd, ul, ol, li, h1, h2, h3, h4, h5, h6, pre, code, form, fieldset, legend, input, textarea, p, blockquote, th, td {
    margin: 0;
    padding: 0;
}
fieldset, img { border: 0; }
address, caption, cite, code, dfn, em, strong, th, var { font-style: normal; font-weight: normal; }
em { font-style: italic; }
strong { font-weight: bold; }
li { list-style: none; }
caption, th { text-align: left; }
h1, h2, h3, h4, h5, h6 { font-size: 92%; font-weight: bold; }
h1 { font-size: 2em; margin: 0 0 23px; }
h2 { font-size: 1.7em; padding-top: 1.3em; margin-bottom: 1.5em; }
q:before, q:after { content: ''; }
abbr, acronym { border: 0; font-variant: normal; }
sup { vertical-align: text-top; }
sub { vertical-align: text-bottom; }
body { font: 12px Arial, Helvetica, sans-serif; }
table { font-size: inherit; }
pre, code, kbd, samp, tt { font-family: monospace; line-height: 100%; }
input, textarea, select { font-family: inherit; font-size: 100%; font-weight: inherit; vertical-align: middle; hyphens: auto; }
a { text-decoration: none; }
a:hover { text-decoration: underline; }
`;

// The host has no dark page: in the dark theme the text and the background come from the theme.
const HOST_PAGE_LIGHT_COLOURS = `
html { color: #000; background: #fff; }
body { color: #274152; background: #fff; }
h1, h2, h3, h4, h5, h6 { color: #063f53; }
a { color: #0a91bc; }
input, textarea, select, legend { color: #000; }
`;

export const HostPageStyles = ({mode}: {mode: PneColorMode}) => (
    <>
        <GlobalStyles styles={HOST_PAGE_BASE}/>
        {mode === 'light' && <GlobalStyles styles={HOST_PAGE_LIGHT_COLOURS}/>}
    </>
);
