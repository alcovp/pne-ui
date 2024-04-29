import React from 'react';

interface IProps {
    disabled: boolean
}

const PneNextPageIcon = (props: IProps) => {
    const {
        disabled
    } = props;

    const color = disabled ? '#dae5ed' : '#809EAE';

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66669 8H13.3334" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.33331 4L13.3333 8L9.33331 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default PneNextPageIcon;