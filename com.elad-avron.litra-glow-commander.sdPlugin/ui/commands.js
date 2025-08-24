export function getLights() {
    return streamDeck.settings.getGlobalSettings<GlobalSettings>().availableLights || [];
}
