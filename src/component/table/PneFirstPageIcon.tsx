import React from 'react';

interface IProps {
    /** Kept for the callers; the icon takes the colour of its button, disabled or not. */
    disabled?: boolean
}

/** A 14px glyph of the pagination, drawn in the colour of the button it stands in (UI Kit Button sm). */
const PneFirstPageIcon = (_props: IProps) => (
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
        <path d="M7.33333 11.3346L4 8.0013L7.33333 4.66797"/>
        <path d="M12 11.3346L8.66666 8.0013L12 4.66797"/>
    </svg>
)

export default PneFirstPageIcon;
