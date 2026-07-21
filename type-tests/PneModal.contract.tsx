import * as React from 'react'

import {
    PneModal,
    PneModalActions,
    type PneModalCloseHandler,
    type PneModalCloseReason,
    type PneModalProps,
} from 'pne-ui'

const dialogRef = React.createRef<HTMLDivElement>()
const invalidDialogRef = React.createRef<HTMLButtonElement>()
const actionsRef = React.createRef<HTMLDivElement>()

const onClose: PneModalCloseHandler = (event, reason) => {
    const closeReason: PneModalCloseReason = reason
    const closeEvent: React.SyntheticEvent = event
    void closeEvent
    void closeReason
}

const modalProps: PneModalProps = {
    onClose,
    open: true,
    title: 'Edit account',
}

const validContracts = <>
    <PneModal {...modalProps} ref={dialogRef}/>
    <PneModal
        ariaLabel='Logo preview'
        closeLabel='Close preview'
        data-testattribute='logo-preview-modal'
        hideCloseButton
        onClose={() => undefined}
        open
        slotProps={{
            body: {'data-contract': 'body'},
            closeButton: {'data-contract': 'close'},
            container: {'aria-busy': false, 'data-contract': 'dialog', sx: {width: 600}},
            title: {component: 'h2'},
        }}
    >
        Preview
    </PneModal>
    <PneModal
        ariaLabel='Fallback name'
        blockingOverlay={<div>Loading</div>}
        modalProps={{disablePortal: true}}
        onClose={onClose}
        open
        title={null}
    />
    <PneModalActions
        aria-label='Editor actions'
        primary={<button>Save</button>}
        ref={actionsRef}
        secondary={<button>Cancel</button>}
        sx={{gap: 1}}
    />
</>

// @ts-expect-error A dialog needs either a visible title prop or ariaLabel.
const unnamedDialog = <PneModal onClose={() => undefined} open/>

const overriddenRole = <PneModal
    onClose={() => undefined}
    open
    // @ts-expect-error Managed dialog semantics cannot be overridden through the container slot.
    slotProps={{container: {role: 'alert'}}}
    title='Managed dialog'
/>

const hiddenDialog = <PneModal
    onClose={() => undefined}
    open
    // @ts-expect-error Consumer slots cannot remove the dialog from focus or the accessibility tree.
    slotProps={{container: {inert: true}}}
    title='Visible dialog'
/>

const replacedModalRoot = <PneModal
    // @ts-expect-error Structural MUI root slots are not part of the PneModal contract.
    modalProps={{slots: {root: 'section'}}}
    onClose={() => undefined}
    open
    title='Managed root'
/>

const replacedBackdrop = <PneModal
    // @ts-expect-error Backdrop replacement can break PneModal dismissal and blocking semantics.
    modalProps={{slotProps: {backdrop: {invisible: true}}}}
    onClose={() => undefined}
    open
    title='Managed backdrop'
/>

const replacedBodyContent = <PneModal
    onClose={() => undefined}
    open
    // @ts-expect-error Slot props style fixed elements; they cannot replace owned content.
    slotProps={{body: {dangerouslySetInnerHTML: {__html: 'Replaced'}}}}
    title='Managed content'
>
    Safe content
</PneModal>

const polymorphicCloseButton = <PneModal
    onClose={() => undefined}
    open
    // @ts-expect-error The close control remains a semantic button.
    slotProps={{closeButton: {component: 'a', href: '#'}}}
    title='Managed close control'
/>

// @ts-expect-error The modal ref points to its HTMLDivElement dialog container.
const wrongModalRef = <PneModal onClose={() => undefined} open ref={invalidDialogRef} title='Invalid ref'/>

// @ts-expect-error PneModalActions has a fixed div root.
const polymorphicActions = <PneModalActions component='section' primary={<button>Save</button>}/>

const replacedActions = <PneModalActions
    // @ts-expect-error PneModalActions owns its action content.
    dangerouslySetInnerHTML={{__html: 'Replaced actions'}}
    primary={<button>Save</button>}
/>

// @ts-expect-error A primary action is required.
const missingPrimaryAction = <PneModalActions secondary={<button>Cancel</button>}/>

void validContracts
void unnamedDialog
void overriddenRole
void hiddenDialog
void replacedModalRoot
void replacedBackdrop
void replacedBodyContent
void polymorphicCloseButton
void wrongModalRef
void polymorphicActions
void replacedActions
void missingPrimaryAction
