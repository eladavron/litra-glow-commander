import { findDevices } from "litra";

export type ActionSettings = {
    selectedLights: string[];
};

export type IncrementActionSettings = ActionSettings & {
    increments: number;
    showOnIcon: boolean;
};

export type ValueActionSettings = ActionSettings & {
    value: number;
    showOnIcon: boolean;
};

const DEFAULT_INCREMENT = 20;
const DEFAULT_VALUE = 50;
const DEFAULT_SHOW_ON_ICON = true;

function readSelectedLights(settings: unknown): string[] {
    const candidate = (settings as { selectedLights?: unknown } | undefined)?.selectedLights;
    if (!Array.isArray(candidate)) {  // If lights were never initialized, default to all lights.
        return findDevices()
            .map(device => device.serialNumber)
            .filter((serialNumber): serialNumber is string => typeof serialNumber === "string" && serialNumber.length > 0);
    }

    return candidate.filter((value): value is string => typeof value === "string");
}

function readNumber(settings: unknown, key: "increments" | "value", fallback: number): number {
    const candidate = (settings as Record<string, unknown> | undefined)?.[key];
    return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallback;
}

function readBoolean(settings: unknown, key: "showOnIcon", fallback: boolean): boolean {
    const candidate = (settings as Record<string, unknown> | undefined)?.[key];
    return typeof candidate === "boolean" ? candidate : fallback;
}

export function getActionSettings(settings: unknown): ActionSettings {
    return {
        selectedLights: readSelectedLights(settings)
    };
}

export function getIncrementActionSettings(settings: unknown): IncrementActionSettings {
    return {
        ...getActionSettings(settings),
        increments: readNumber(settings, "increments", DEFAULT_INCREMENT),
        showOnIcon: readBoolean(settings, "showOnIcon", DEFAULT_SHOW_ON_ICON)
    };
}

export function getValueActionSettings(settings: unknown): ValueActionSettings {
    return {
        ...getActionSettings(settings),
        value: readNumber(settings, "value", DEFAULT_VALUE),
        showOnIcon: readBoolean(settings, "showOnIcon", DEFAULT_SHOW_ON_ICON)
    };
}