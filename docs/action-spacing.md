# Action spacing

Page headers and modal action areas use two independent spacing tokens, owned by `pne-ui`:

| Meaning | CSS custom property | Default |
| --- | --- | --- |
| Adjacent buttons in one group | `--pne-action-buttons-gap` | 8 px |
| Separate groups without a divider | `--pne-action-groups-gap` | 8 px |

The defaults are defined together in `PNE_ACTION_SPACING` (`src/actionSpacing.tsx`). Change `groups` independently when group separation needs to grow. Applications must not duplicate these definitions or couple them to their general layout spacing.

`PneThemeProvider` installs the custom properties. Applications and standalone microfrontends using their own theme provider mount `<PneActionSpacingStyles/>` once at their root. The definitions also reach portal-based modal actions. For CSS-in-JS, `pneActionSpacing.buttons` and `.groups` expose CSS values with the library defaults as fallbacks, so isolated components also have valid spacing.

```tsx
import {PneActionSpacingStyles, pneActionSpacing} from 'pne-ui'

<ThemeProvider theme={theme}>
    <PneActionSpacingStyles/>
    <Box sx={{display: 'flex', gap: pneActionSpacing.groups}}>
        <Box sx={{display: 'flex', gap: pneActionSpacing.buttons}}>
            <ImportButton/>
            <ExportButton/>
        </Box>
        <Box sx={{display: 'flex', gap: pneActionSpacing.buttons}}>
            <CancelButton/>
            <SaveButton/>
        </Box>
    </Box>
</ThemeProvider>
```

Apply `gap` to the layout container; remove spacing margins on individual buttons. Keep intentional left/right anchoring, field spacing, and segmented controls separate from this convention. `PneModalActions` uses these tokens automatically, including stacked actions on narrow screens. Its `groupLeading` option puts the leading action into the same button group, while the default treats leading and trailing actions as separate groups.

Storybook: `pne-ui/PneButton/UsageGuidelines` documents the convention; `pne-ui/PneButton/ActionGroups` lets you change the group gap without affecting spacing inside either group.
