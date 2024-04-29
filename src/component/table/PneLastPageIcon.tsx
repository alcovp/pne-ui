import React from 'react';

interface IProps {
    disabled: boolean
}

const PneLastPageIcon = (props: IProps) => {
    const {
        disabled
    } = props;

    const color = disabled ? '#dae5ed' : '#809EAE';

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.66669 11.3346L12 8.0013L8.66669 4.66797" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 11.3346L7.33333 8.0013L4 4.66797" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    );
}

export default PneLastPageIcon;