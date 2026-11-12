/**
 * Skin colours for the stories. A Paynet skin gives pne-ui one colour (`experimentalColor`),
 * so a story skin is that colour and a name after it. The set covers the classes real skins
 * fall into: the UI Kit blue, dark tones a white label reads on, mid tones that are made darker
 * for it, light tones that take a dark label, greys and black.
 */
export type StorybookSkin = {
    id: string
    title: string
    experimentalColor: string
}

export const STORYBOOK_SKINS: StorybookSkin[] = [
    {id: 'blue', title: 'Blue (UI Kit)', experimentalColor: '#026fd7'},
    {id: 'azure', title: 'Azure', experimentalColor: '#007dff'},
    {id: 'teal', title: 'Teal', experimentalColor: '#0a91bc'},
    {id: 'navy', title: 'Navy', experimentalColor: '#174f98'},
    {id: 'emerald', title: 'Emerald', experimentalColor: '#087962'},
    {id: 'green', title: 'Light green', experimentalColor: '#58bd5f'},
    {id: 'yellow', title: 'Yellow', experimentalColor: '#f0b90a'},
    {id: 'orange', title: 'Orange', experimentalColor: '#ff6600'},
    {id: 'red', title: 'Red', experimentalColor: '#ca3827'},
    {id: 'magenta', title: 'Magenta', experimentalColor: '#af176a'},
    {id: 'purple', title: 'Purple', experimentalColor: '#4c176e'},
    {id: 'sky', title: 'Sky blue', experimentalColor: '#79ceef'},
    {id: 'grey', title: 'Grey', experimentalColor: '#7a7a7a'},
    {id: 'black', title: 'Black', experimentalColor: '#000000'},
]

export const STORYBOOK_DEFAULT_SKIN = STORYBOOK_SKINS[0].id

export const skinColorOf = (id: string | undefined): string =>
    (STORYBOOK_SKINS.find(skin => skin.id === id) ?? STORYBOOK_SKINS[0]).experimentalColor
