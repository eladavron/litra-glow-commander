import streamDeck, { action, DidReceiveSettingsEvent, JsonObject, JsonValue, KeyDownEvent, SingletonAction, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { flashLight, getLightBySerialNumber, sendLightsToUI } from "../global";
import { getTemperatureInKelvin, getMaximumTemperatureInKelvinForDevice, setTemperatureInKelvin, getMinimumTemperatureInKelvinForDevice, Device }from "litra";
import { ActionSettings } from "../settings";

@action({ UUID: "com.eladavron.litra-glow-commander.set-temperature" })
export class SetTemperature extends SingletonAction {
    currentSettings!: ActionSettings;

    override onWillAppear(ev: WillAppearEvent): void | Promise<void> {
        streamDeck.logger.debug("Set Temperature action will appear", ev);
        const settings = ev.payload.settings;
        this.currentSettings = settings as ActionSettings; //Store settings for diff logic
        ev.action.setTitle(settings.showOnIcon ? `${settings.value ?? 50}%` : "");
    }

    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        streamDeck.logger.debug("Set Temperature action key down", ev);
        const settings = ev.payload.settings;
        const selectedLights = settings.selectedLights as Array<string>;
        const value = settings.value as number;
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
            newTemp = Math.round(newTemp / 100) * 100;
            streamDeck.logger.debug(`Setting temperature of light ${selectedLight} from ${currentPercentage}% (${currentTemp}K) to ${value}% (${newTemp}K)`);
            setTemperatureInKelvin(light, newTemp);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Temperature Up action received message from PI", ev);
        sendLightsToUI(ev);
    }

    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<JsonObject>): Promise<void> | void {
        const prevSelected = (this.currentSettings?.selectedLights ?? []) as Array<string>;
        const newSelected = (ev.payload.settings?.selectedLights ?? []) as Array<string>;
        const diff = newSelected.find(light => !prevSelected.includes(light)) ?? prevSelected.find(light => !newSelected.includes(light));
        if (diff) {
            flashLight(diff, 2);
        }
        const value = (ev.payload.settings?.value ?? 50) as number;
        ev.action.setTitle(ev.payload.settings?.showOnIcon ? `${value}%` : "");
        this.currentSettings = ev.payload.settings as ActionSettings;
    }
}

