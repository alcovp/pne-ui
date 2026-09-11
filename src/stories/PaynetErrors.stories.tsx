import React from 'react'
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import type { Meta, StoryObj } from '@storybook/react-webpack5'
import { expect, userEvent, within } from 'storybook/test'
import { normalizePaynetError, PaynetErrorContent } from '../index'
import type { NormalizedPaynetError } from '../index'

type ErrorFixture = {
    createError: () => unknown
    description: string
    id: string
    label: string
    source: 'Backend' | 'Browser' | 'Transport'
}

const longStackDetails = [
    'java.lang.IllegalStateException: Unable to complete sale',
    '    at com.payneteasy.processing.SaleService.process(SaleService.java:184)',
    '    at com.payneteasy.processing.SaleService.createTransaction(SaleService.java:121)',
    '    at com.payneteasy.processing.TransactionFacade.sale(TransactionFacade.java:78)',
    '    at jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)',
    '    at jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)',
    '    at jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)',
    '    at java.lang.reflect.Method.invoke(Method.java:569)',
    'Caused by: java.net.SocketTimeoutException: Read timed out',
    '    at sun.nio.ch.NioSocketImpl.timedRead(NioSocketImpl.java:288)',
    '    at sun.nio.ch.NioSocketImpl.implRead(NioSocketImpl.java:314)',
    '    at sun.nio.ch.NioSocketImpl.read(NioSocketImpl.java:355)',
    '    at sun.nio.ch.NioSocketImpl$1.read(NioSocketImpl.java:808)',
    '    at java.net.Socket$SocketInputStream.read(Socket.java:966)',
    '    at okhttp3.internal.http1.Http1ExchangeCodec$AbstractSource.read(Http1ExchangeCodec.kt:331)',
].join('\n')

const fixtures = {
    shortWithDetails: {
        id: 'short-backend-details',
        label: 'Short backend error with details',
        description: 'The common backend envelope: localized message, support ID and a short diagnostic.',
        source: 'Backend',
        createError: () => ({
            errorId: '37f4b02d-19c6-4df4-9b38-441730e88ab1',
            messageId: 'react.unexpected.exception.message',
            details: 'Processor response: Do not honor.',
        }),
    },
    validationI18n: {
        id: 'validation-i18n',
        label: 'Validation / errorI18N',
        description: 'A backend validation key is translated by the host and used as the primary message.',
        source: 'Backend',
        createError: () => ({
            errorId: 'story-validation-017',
            messageId: 'react.unexpected.exception.message',
            errorI18N: 'react.searchUI.template.name.confirmRewrite',
            details: 'Template name: Daily settlement',
        }),
    },
    missingDetails: {
        id: 'missing-details',
        label: 'Missing details',
        description: 'The server may omit details for permissions or because no diagnostic is available.',
        source: 'Backend',
        createError: () => ({
            errorId: 'story-no-details-204',
            messageId: 'react.unexpected.exception.message',
        }),
    },
    structuredDetails: {
        id: 'structured-details',
        label: 'Structured details',
        description: 'Object details are serialized safely and retain their hierarchy for support.',
        source: 'Backend',
        createError: () => ({
            errorId: 'story-structured-422',
            messageId: 'react.unexpected.exception.message',
            details: {
                fieldErrors: [
                    { field: 'amount', reason: 'Must be greater than zero' },
                    { field: 'currency', reason: 'Unsupported currency code' },
                ],
                processor: {
                    code: 'VALIDATION_FAILED',
                    retryable: false,
                },
            },
        }),
    },
    longStack: {
        id: 'long-stack-details',
        label: 'Long stack-like details',
        description: 'A deliberately long diagnostic with an inline preview and full-details dialog.',
        source: 'Backend',
        createError: () => ({
            errorId: 'story-stack-500',
            messageId: 'react.unexpected.exception.message',
            details: longStackDetails,
        }),
    },
    nativeNetwork: {
        id: 'native-network-error',
        label: 'Native / network error',
        description: 'A browser exception without a backend response envelope.',
        source: 'Browser',
        createError: () => new TypeError('Network request failed. Check your connection and try again.'),
    },
    axiosBlob: {
        id: 'axios-json-blob',
        label: 'Axios response with JSON Blob',
        description: 'Download-style endpoints can return a JSON error payload wrapped in a Blob.',
        source: 'Transport',
        createError: () => ({
            response: {
                status: 502,
                data: new Blob([
                    JSON.stringify({
                        errorId: 'story-blob-502',
                        messageId: 'react.unexpected.exception.message',
                        details: 'Upstream report service returned an invalid response.',
                    }),
                ], { type: 'application/json' }),
            },
        }),
    },
    technicalMetadata: {
        id: 'technical-metadata',
        label: 'Technical metadata',
        description: 'Status/type are normalized for diagnostics but omitted from the visible notification.',
        source: 'Transport',
        createError: () => ({
            errorId: 'story-metadata-504',
            messageId: 'react.unexpected.exception.message',
            details: 'No response was received from the acquirer within 30 seconds.',
            errorType: 'GATEWAY_TIMEOUT',
            status: 504,
        }),
    },
} as const satisfies Record<string, ErrorFixture>

const allFixtures: ErrorFixture[] = [
    fixtures.shortWithDetails,
    fixtures.validationI18n,
    fixtures.missingDetails,
    fixtures.structuredDetails,
    fixtures.longStack,
    fixtures.nativeNetwork,
    fixtures.axiosBlob,
    fixtures.technicalMetadata,
]

const ErrorFixturePreview = ({ fixture }: { fixture: ErrorFixture }) => {
    const [error, setError] = React.useState<NormalizedPaynetError | null>(null)

    React.useEffect(() => {
        let active = true
        setError(null)

        void normalizePaynetError(fixture.createError()).then(normalized => {
            if (active) setError(normalized)
        })

        return () => {
            active = false
        }
    }, [fixture])

    return (
        <Box
            data-story-error-fixture={fixture.id}
            data-story-error-state={error ? 'ready' : 'loading'}
            sx={{
                alignContent: 'start',
                display: 'grid',
                gap: 1,
                maxWidth: 440,
                minWidth: 0,
                width: '100%',
            }}
        >
            <Stack
                direction='row'
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
                <Typography component='h2' sx={{ fontSize: 14, fontWeight: 700, lineHeight: '20px' }}>
                    {fixture.label}
                </Typography>
                <Chip label={fixture.source} size='small' variant='outlined' />
            </Stack>
            <Typography color='text.secondary' sx={{ fontSize: 12, lineHeight: '18px', minHeight: 36 }}>
                {fixture.description}
            </Typography>
            <Alert
                data-story-error-surface
                elevation={1}
                onClose={() => undefined}
                severity='error'
                sx={{
                    alignItems: 'flex-start',
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    width: 'fit-content',
                    '& .MuiAlert-message': {
                        minWidth: 0,
                    },
                    '& .MuiAlert-action': {
                        alignItems: 'stretch',
                        alignSelf: 'stretch',
                        mb: '-6px',
                        mr: '-16px',
                        mt: '-6px',
                        pb: 0,
                        pl: '8px',
                        pt: 0,
                    },
                    '& .MuiAlert-action .MuiIconButton-root': {
                        alignItems: 'flex-start',
                        alignSelf: 'stretch',
                        borderRadius: 0,
                        pb: 0,
                        pl: '13px',
                        pr: '13px',
                        pt: '15px',
                    },
                }}
            >
                {error ? (
                    <PaynetErrorContent error={error} />
                ) : (
                    <Stack
                        direction='row'
                        spacing={1}
                        sx={{ alignItems: 'center', minHeight: 64 }}
                    >
                        <CircularProgress size={16} />
                        <Typography variant='body2'>Normalizing fixture…</Typography>
                    </Stack>
                )}
            </Alert>
        </Box>
    )
}

type FixtureGalleryProps = {
    fixtures: ErrorFixture[]
    heading: string
    intro: string
}

const FixtureGallery = ({ fixtures: galleryFixtures, heading, intro }: FixtureGalleryProps) => (
    <Box
        data-story-errors
        sx={{
            bgcolor: 'grey.50',
            boxSizing: 'border-box',
            minHeight: '100vh',
            p: { xs: 2, md: 3 },
        }}
    >
        <Stack spacing={0.5} sx={{ mb: 3, maxWidth: 760 }}>
            <Typography component='h1' sx={{ fontSize: 20, fontWeight: 700, lineHeight: '28px' }}>
                {heading}
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: 14, lineHeight: '20px' }}>
                {intro}
            </Typography>
        </Stack>
        <Box
            data-story-error-matrix
            sx={{
                alignItems: 'start',
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' },
            }}
        >
            {galleryFixtures.map(fixture => <ErrorFixturePreview fixture={fixture} key={fixture.id} />)}
        </Box>
    </Box>
)

const meta = {
    title: 'pne-ui/OverlayHost/Errors',
    component: FixtureGallery,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Visual fixtures for the shared backend error presenter. Each card uses the same '
                    + 'error content rendered inside an error Alert; raw fixtures are normalized by the public API.',
            },
        },
    },
} satisfies Meta<typeof FixtureGallery>

export default meta

type Story = StoryObj<typeof meta>

export const FixtureMatrix: Story = {
    args: {
        fixtures: allFixtures,
        heading: 'Error fixture matrix',
        intro: 'Compare message density, details, transport shapes and technical metadata in one visual baseline.',
    },
}

export const BackendEnvelopes: Story = {
    args: {
        fixtures: [
            fixtures.shortWithDetails,
            fixtures.validationI18n,
            fixtures.missingDetails,
            fixtures.structuredDetails,
        ],
        heading: 'Backend error envelopes',
        intro: 'Common server responses, including gated/missing details and structured diagnostics.',
    },
}

export const RawTransportErrors: Story = {
    args: {
        fixtures: [fixtures.nativeNetwork, fixtures.axiosBlob],
        heading: 'Raw transport errors',
        intro: 'The presenter accepts browser exceptions and Axios-like JSON Blob responses without caller-side parsing.',
    },
}

export const LongDetails: Story = {
    args: {
        fixtures: [fixtures.longStack],
        heading: 'Long diagnostic details',
        intro: 'The first lines stay visible in the notification; the full stack trace opens in a compact dialog.',
    },
}

export const LongDetailsDialog: Story = {
    args: {
        fixtures: [fixtures.longStack],
        heading: 'Full diagnostic dialog',
        intro: 'The complete stack trace is available on demand without making the notification permanently tall.',
    },
    play: async ({ canvasElement }) => {
        await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Show full details' }))
    },
}

export const CopiedErrorId: Story = {
    args: {
        fixtures: [fixtures.shortWithDetails],
        heading: 'Copied error ID feedback',
        intro: 'Clicking the inline support ID copies it and replaces the copy icon with a success check for two seconds.',
    },
    play: async ({ canvasElement }) => {
        const storyNavigator = canvasElement.ownerDocument.defaultView!.navigator
        Object.defineProperty(storyNavigator, 'clipboard', {
            configurable: true,
            value: { writeText: async () => undefined },
        })
        const copyButton = await within(canvasElement).findByRole('button', { name: /Copy error ID/ })
        await userEvent.click(copyButton)
        await expect(copyButton).toHaveAttribute('data-copy-state', 'copied')
    },
}

export const TechnicalMetadata: Story = {
    args: {
        fixtures: [fixtures.technicalMetadata],
        heading: 'Technical metadata',
        intro: 'Status and error type remain in normalized data but do not compete with the user-facing message.',
    },
}

export const MobileWidth: Story = {
    args: {
        fixtures: [fixtures.shortWithDetails, fixtures.structuredDetails, fixtures.longStack],
        heading: 'Errors on a narrow viewport',
        intro: 'Checks text wrapping, close-button space and details overflow at 360 px.',
    },
    globals: { viewport: { value: 'mobile360', isRotated: false } },
}
