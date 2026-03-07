import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import { flashLight, getLightBySerialNumber, sendLightsToUI } from "../global";
import { getTemperatureInKelvin, getMaximumTemperatureInKelvinForDevice, setTemperatureInKelvin, getMinimumTemperatureInKelvinForDevice } from "litra";
import { ValueActionSettings, getValueActionSettings } from "../settings";

@action({ UUID: "com.eladavron.litra-glow-commander.set-temperature" })
export class SetTemperature extends SingletonAction<ValueActionSettings> {
    currentSettings!: ValueActionSettings;

    override async onWillAppear(ev: WillAppearEvent<ValueActionSettings>): Promise<void> {
        streamDeck.logger.debug("Set Temperature action will appear", ev);
        const settings = getValueActionSettings(ev.payload.settings);
        if (JSON.stringify(ev.payload.settings ?? {}) !== JSON.stringify(settings)) {
            await ev.action.setSettings(settings);
        }

        this.currentSettings = settings;
        ev.action.setTitle(settings.showOnIcon ? `${settings.value}%` : "");
    }

    override async onKeyDown(ev: KeyDownEvent<ValueActionSettings>): Promise<void> {
        streamDeck.logger.debug("Set Temperature action key down", ev);
        const settings = getValueActionSettings(ev.payload.settings);
        const selectedLights = settings.selectedLights;
        const value = settings.value;
        for (const selectedLight of selectedLights) {
            const light = getLightBySerialNumber(selectedLight);
            if (!light) {
                streamDeck.logger.error("Light not found", selectedLight);
                continue;
            }
            const currentTemp = getTemperatureInKelvin(light);
            const maxTemp = getMaximumTemperatureInKelvinForDevice(light);
            const minTemp = getMinimumTemperatureInKelvinForDevice(light);
            const currentPercentage = ((currentTemp - minTemp) / (maxTemp - minTemp)) * 100;
            let newTemp = minTemp + ((maxTemp - minTemp) * (value / 100));
            newTemp = Math.round(newTemp / 100) * 100; //Round to nearest 100
            streamDeck.logger.debug(`Setting temperature of light ${selectedLight} from ${currentPercentage}% (${currentTemp}K) to ${value}% (${newTemp}K)`);
            setTemperatureInKelvin(light, newTemp);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ValueActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Temperature Up action received message from PI", ev);
        sendLightsToUI(ev);
    }

    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<ValueActionSettings>): Promise<void> | void {
        const prevSelected = (this.currentSettings?.selectedLights ?? []) as Array<string>;
        const settings = getValueActionSettings(ev.payload.settings);
        const newSelected = settings.selectedLights;
        const diff = newSelected.find(light => !prevSelected.includes(light)) ?? prevSelected.find(light => !newSelected.includes(light));
        if (diff) {
            flashLight(diff, 2);
        }
        ev.action.setTitle(settings.showOnIcon ? `${settings.value}%` : "");
        this.currentSettings = settings;
    }
}

