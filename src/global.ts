import streamDeck from "@elgato/streamdeck";
import { Light } from "./settings";
import { findDevices, getBrightnessInLumen, getTemperatureInKelvin, DeviceType } from 'litra';

export function getLights(): Light[] {
    const devices = findDevices();
    streamDeck.logger.debug("Found devices:", devices);
    return devices.map(device => ({
        sn: device.serialNumber,
        name: Object.keys(DeviceType).find(key => DeviceType[key as keyof typeof DeviceType] === device.type)
    }) as Light);
}
