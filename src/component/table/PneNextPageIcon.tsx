import React from 'react';

interface IProps {
    /** Kept for the callers; the icon takes the colour of its button, disabled or not. */
    disabled?: boolean
}

/** A 14px glyph of the pagination, drawn in the colour of the button it stands in (UI Kit Button sm). */
const PneNextPageIcon = (_props: IProps) => (
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
        <path d="M2.66669 8H13.3334"/>
        <path d="M9.33331 4L13.3333 8L9.33331 12"/>
    </svg>
)

export default PneNextPageIcon;
