import * as React from "react";
import {MenuItem, Stack, Typography} from "@mui/material";
import {Meta, StoryObj} from "@storybook/react-webpack5";
import {expect, waitFor, within} from "storybook/test";
import {PneField, PneTextField} from "../index";

export default {
    title: "pne-ui/PneTextField",
    component: PneTextField,
    parameters: {
        docs: {
            description: {
                component: "Тонкая обёртка MUI TextField: ref относится к root, в text/multiline-режимах inputRef — к нативному полю, а native props передаются через slotProps.htmlInput. Select/custom-slot ref semantics остаются контрактом MUI.",
            },
        },
    },
} as Meta<typeof PneTextField>;

type Story = StoryObj<typeof PneTextField>;

export const Default: Story = {
    args: {},
};

const RefContractExample = () => {
    const [rootTag, setRootTag] = React.useState("");
    const [inputTag, setInputTag] = React.useState("");
    const rootRef = React.useCallback((node: HTMLDivElement | null) => {
        setRootTag(node?.tagName ?? "");
    }, []);
    const inputRef = React.useCallback((node: HTMLInputElement | HTMLTextAreaElement | null) => {
        setInputTag(node?.tagName ?? "");
    }, []);

    return <Stack spacing={1} sx={{width: 360}}>
        <PneTextField
            inputRef={inputRef}
            label="Reference"
            ref={rootRef}
        />
        <Typography component="output" data-story-contract="root-ref">
            root ref: {rootTag}
        </Typography>
        <Typography component="output" data-story-contract="input-ref">
            input ref: {inputTag}
        </Typography>
    </Stack>;
};

export const RefContract: Story = {
    parameters: {
        docs: {
            description: {
                story: "ref получает root HTMLDivElement MUI TextField. В text/multiline-режимах для focus, selection и form-библиотек используйте inputRef, который получает нативный input или textarea.",
            },
        },
    },
    play: async ({canvasElement}) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('[data-story-contract="root-ref"]')?.textContent)
                .toContain("DIV");
            expect(canvasElement.querySelector('[data-story-contract="input-ref"]')?.textContent)
                .toContain("INPUT");
        });
    },
    render: () => <RefContractExample/>,
};

export const HtmlInputSlotContract: Story = {
    parameters: {
        docs: {
            description: {
                story: "Native input props принадлежат slotProps.htmlInput. Object и functional slot props сохраняются, а их aria-describedby объединяется с helper text без потери consumer IDs.",
            },
        },
    },
    play: async ({canvasElement}) => {
        const input = within(canvasElement).getByRole("textbox", {name: "Account code"});
        const describedBy = input.getAttribute("aria-describedby")?.split(/\s+/) ?? [];

        expect(input.getAttribute("data-story-slot")).toBe("html-input");
        expect(input.getAttribute("maxlength")).toBe("12");
        expect(describedBy).toContain("account-code-format");
        expect(describedBy).toContain("account-code-helper-text");
    },
    render: () => <Stack spacing={1} sx={{width: 360}}>
        <PneTextField
            helperText="Up to 12 characters"
            id="account-code"
            label="Account code"
            slotProps={{
                htmlInput: () => ({
                    "aria-describedby": "account-code-format",
                    "data-story-slot": "html-input",
                    maxLength: 12,
                }),
            }}
        />
        <Typography id="account-code-format" variant="caption">
            Latin letters and digits
        </Typography>
    </Stack>,
};

export const PneFieldCompositionContract: Story = {
    parameters: {
        docs: {
            description: {
                story: "PneField передаёт control id, error/disabled/fullWidth, helper связь и aria-required. Его required не включает native required; задайте required самому PneTextField только если нужна browser constraint validation.",
            },
        },
    },
    play: async ({canvasElement}) => {
        const input = within(canvasElement).getByRole("textbox", {name: /Customer reference/});
        const describedBy = input.getAttribute("aria-describedby")?.split(/\s+/) ?? [];

        expect(input.id).toBe("customer-reference-field-control");
        expect(input.getAttribute("aria-required")).toBe("true");
        expect(input.hasAttribute("required")).toBe(false);
        expect(describedBy).toContain("customer-reference-field-helper-text");
    },
    render: () => <Stack sx={{width: 360}}>
        <PneField
            error
            helperText="Reference is required"
            id="customer-reference-field"
            label="Customer reference"
            required
        >
            <PneTextField/>
        </PneField>
    </Stack>,
};

export const PneFieldSelectCompositionContract: Story = {
    parameters: {
        docs: {
            description: {
                story: "Select получает accessible name и aria-required от внешнего PneField; object и functional slotProps.select сохраняются и композируются с helper-связью.",
            },
        },
    },
    play: async ({canvasElement}) => {
        const select = within(canvasElement).getByRole("combobox", {name: "Delivery method"});
        const describedBy = select.getAttribute("aria-describedby")?.split(/\s+/) ?? [];

        expect(select.getAttribute("aria-required")).toBe("true");
        expect(select.title).toBe("Preserved select display props");
        expect(describedBy).toContain("delivery-method-field-helper-text");
        expect(canvasElement.querySelector(".MuiSelect-nativeInput")?.hasAttribute("required"))
            .toBe(false);
    },
    render: () => <Stack sx={{width: 360}}>
        <PneField
            helperText="Choose one delivery method"
            id="delivery-method-field"
            label="Delivery method"
            required
        >
            <PneTextField
                defaultValue="email"
                select
                slotProps={{
                    select: () => ({
                        SelectDisplayProps: {
                            title: "Preserved select display props",
                        },
                    }),
                }}
            >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sftp">SFTP</MenuItem>
            </PneTextField>
        </PneField>
    </Stack>,
};
