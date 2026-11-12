import React from 'react';

interface IProps {
    /** Kept for the callers; the icon takes the colour of its button, disabled or not. */
    disabled?: boolean
}

/** A 14px glyph of the pagination, drawn in the colour of the button it stands in (UI Kit Button sm). */
const PnePreviousPageIcon = (_props: IProps) => (
    <svg
        aria-hidden="true"
        fill="none"
        height="14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 16 16"
        width="14"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M13.3334 8H2.66669"/>
        <path d="M6.66669 12L2.66669 8L6.66669 4"/>
    </svg>
)

export default PnePreviousPageIcon;
