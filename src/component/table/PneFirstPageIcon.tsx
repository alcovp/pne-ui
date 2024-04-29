import React from 'react';

interface IProps {
    disabled: boolean
}

const PneFirstPageIcon = (props: IProps) => {
    const {
        disabled
    } = props;

    const color = disabled ? '#dae5ed' : '#809EAE';

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.33333 11.3346L4 8.0013L7.33333 4.66797" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11.3346L8.66666 8.0013L12 4.66797" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default PneFirstPageIcon;