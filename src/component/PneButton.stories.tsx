// import React from 'react';
// import PneButton from './PneButton';
// import {ComponentMeta, StoryObj} from '@storybook/react';
// import {VTGenerateLinkIcon, VTHeaderCopyIcon} from '../../components/tools/virtual-terminal/vt-2_1/graphics';
//
// export default {
//     title: 'pne-ui/PneButton',
//     component: PneButton,
// } as ComponentMeta<typeof PneButton>;
//
// type Story = StoryObj<typeof PneButton>;
//
// const BUTTON_TEXT = 'Click me!';
// const BUTTON_ALERT_TEXT = 'Click!';
//
// export const Default: Story = {
//     args: {
//         onClick: () => alert(BUTTON_ALERT_TEXT),
//         children: BUTTON_TEXT
//     },
// };
//
// export const Primary: Story = {
//     args: {
//         ...Default.args,
//         color: 'pnePrimary'
//     },
// };
//
// export const Neutral: Story = {
//     args: {
//         ...Default.args,
//         color: 'pneNeutral'
//     },
// };
//
// export const White: Story = {
//     args: {
//         ...Default.args,
//         color: 'pneWhite'
//     },
// };
//
// export const PrimaryLight: Story = {
//     args: {
//         ...Default.args,
//         color: 'pnePrimaryLight'
//     },
// };
//
// export const WarningLight: Story = {
//     args: {
//         ...Default.args,
//         color: 'pneWarningLight'
//     },
// };
//
// export const StartIcon: Story = {
//     args: {
//         ...Primary.args,
//         startIcon: <VTGenerateLinkIcon/>
//     },
// };
//
// export const EndIcon: Story = {
//     args: {
//         ...Primary.args,
//         endIcon: <VTHeaderCopyIcon/>
//     },
// };
