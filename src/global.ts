import streamDeck from "@elgato/streamdeck";
import { findDevices, getNameForDevice, Device } from 'litra';
import { DataSourceResultItem } from "./sdpi";


export function getLights(): Device[] {
    const devices = findDevices();
    streamDeck.logger.debug("Found devices:", devices);
    return devices;
}

export function devicesToItems(devices: Device[]): DataSourceResultItem[] {
    return devices.map(device => ({
        label: `${getNameForDevice(device)} (${device.serialNumber})`,
        value: device.serialNumber
    }));
}


export function getLightBySerialNumber(serialNumber: string): Device | undefined {
    const devices = getLights();
    return devices.find(device => device.serialNumber === serialNumber);
}