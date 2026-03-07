function flattenItemValues(items) {
    // The datasource can return grouped items, so flatten them into serial numbers.
    return items.flatMap(item => Array.isArray(item.children) ? flattenItemValues(item.children) : [item.value]);
}

async function waitForPropertyInspectorReady() {
    if (document.readyState === "loading") {
        await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }

    await customElements.whenDefined("sdpi-checkbox-list");
}

async function initializeDefaultSelectedLights() {
    await waitForPropertyInspectorReady();

    const streamDeckClient = window.SDPIComponents?.streamDeckClient;
    const checkboxList = document.querySelector('sdpi-checkbox-list[setting="selectedLights"]');
    if (!streamDeckClient || !checkboxList) {
        return;
    }

    const settingsResponse = await streamDeckClient.getSettings();
    const settings = settingsResponse?.settings ?? {};

    // Only inject the default selection when the setting has never been saved.
    if (Object.prototype.hasOwnProperty.call(settings, "selectedLights")) {
        return;
    }

    const applyDefaultSelection = (items) => {
        const selectedLights = flattenItemValues(items ?? []);
        if (selectedLights.length === 0) {
            return;
        }

        // Setting the component value updates the initial rendered checkbox state in the PI.
        checkboxList.value = selectedLights;
    };

    streamDeckClient.sendToPropertyInspector.subscribe((event) => {
        if (event.payload?.event !== "getLights") {
            return;
        }

        applyDefaultSelection(event.payload.items);
    });

    // Request the datasource once so the PI can render all available lights as selected.
    checkboxList.refresh();
}

void initializeDefaultSelectedLights();