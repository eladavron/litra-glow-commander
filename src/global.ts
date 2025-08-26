import streamDeck, { JsonValue, SendToPluginEvent } from "@elgato/streamdeck";
import { findDevices, getNameForDevice, Device } from 'litra';
import { DataSourcePayload, DataSourceResultItem } from "./sdpi";
import { ActionSettings } from "./settings";

export function sendLightsToUI(ev: SendToPluginEvent<JsonValue, ActionSettings>) {
    if (ev.payload instanceof Object && "event" in ev.payload && ev.payload.event === "getLights") {
        streamDeck.ui.current?.sendToPropertyInspector({
            event: "getLights",
            items: devicesToItems(getLights())
        } satisfies DataSourcePayload);
    }
}

function getLights(): Device[] {
    const devices = findDevices();
    streamDeck.logger.debug("Found devices:", devices);
    return devices;
}

function devicesToItems(devices: Device[]): DataSourceResultItem[] {
    return devices.map(device => ({
        label: `${getNameForDevice(device)} (${device.serialNumber})`,
        value: device.serialNumber
    }));
}

export function getLightBySerialNumber(serialNumber: string): Device | undefined {
    const devices = getLights();
    return devices.find(device => device.serialNumber === serialNumber);
}