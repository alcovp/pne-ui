import * as React from 'react'

import {
    PneButton,
    type PneButtonProps,
    type PneButtonSize,
    type PneButtonStyle,
} from 'pne-ui'

const styles: PneButtonStyle[] = [
    'contained',
    'outlined',
    'error',
    'text',
    'neutral',
    'neutralText',
    'primaryLight',
    'warning',
    'white',
]
const size: PneButtonSize = 'medium'
const props: PneButtonProps = {pneStyle: styles[0], size}

const buttonRef = React.createRef<HTMLButtonElement>()
const anchorRef = React.createRef<HTMLAnchorElement>()

const RouterLink = React.forwardRef<
    HTMLAnchorElement,
    Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> & {to: string}
>(({to, ...linkProps}, ref) => <a {...linkProps} href={to} ref={ref}/>)

const validDefaultCreateElement = React.createElement(PneButton, {
    pneStyle: 'text',
    ref: buttonRef,
})

const validContracts = <>
    <PneButton
        {...props}
        ref={buttonRef}
        onClick={event => {
            const currentTarget: HTMLButtonElement = event.currentTarget
            currentTarget.focus()
        }}
    />
    <PneButton
        href='/reports'
        ref={anchorRef}
        onClick={event => {
            const currentTarget: HTMLAnchorElement = event.currentTarget
            currentTarget.focus()
        }}
    >Reports</PneButton>
    <PneButton
        component='a'
        href='/settings'
        ref={anchorRef}
        onClick={event => {
            const currentTarget: HTMLAnchorElement = event.currentTarget
            currentTarget.focus()
        }}
    >Settings</PneButton>
    <PneButton component={RouterLink} to='/orders' ref={anchorRef}>Orders</PneButton>
</>

// @ts-expect-error `to` is not a native button prop; a matching component is required.
const missingComponent = <PneButton to='/orders'/>

// @ts-expect-error Required props from a custom root component stay required.
const missingCustomRootProp = <PneButton component={RouterLink}/>

// @ts-expect-error The default root ref is an HTMLButtonElement.
const wrongDefaultRef = <PneButton ref={anchorRef}/>

// @ts-expect-error The `href` shorthand changes the root ref to an HTMLAnchorElement.
const wrongHrefRef = <PneButton href='/reports' ref={buttonRef}/>

// @ts-expect-error Native button type does not include presentation values.
const invalidNativeType = <PneButton type='text'/>

// @ts-expect-error Raw MUI appearance props are intentionally not public.
const rawVariant = <PneButton variant='contained'/>

// @ts-expect-error Raw MUI appearance props are intentionally not public.
const rawColor = <PneButton color='primary'/>

// @ts-expect-error PneButton supports only its canonical presets.
const invalidStyle = <PneButton pneStyle='secondary'/>

// @ts-expect-error PneButton supports only the design-system sizes.
const invalidSize = <PneButton size='extra-large'/>

// @ts-expect-error Unknown props must not be accepted by the polymorphic overload.
const unknownProp = <PneButton inventedProp/>

void validContracts
void validDefaultCreateElement
void missingComponent
void missingCustomRootProp
void wrongDefaultRef
void wrongHrefRef
void invalidNativeType
void rawVariant
void rawColor
void invalidStyle
void invalidSize
void unknownProp
