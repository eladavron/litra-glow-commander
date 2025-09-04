import streamDeck, { action, DidReceiveSettingsEvent, JsonObject, JsonValue, KeyDownEvent, SingletonAction, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { flashLight, getLightBySerialNumber, sendLightsToUI } from "../global";
import { getTemperatureInKelvin, getMaximumTemperatureInKelvinForDevice, setTemperatureInKelvin, getMinimumTemperatureInKelvinForDevice } from "litra";
import { ActionSettings } from "../settings";

@action({ UUID: "com.eladavron.litra-glow-commander.temperature-down" })
export class TemperatureDown extends SingletonAction {
    currentSettings!: ActionSettings;

    override onWillAppear(ev: WillAppearEvent): void | Promise<void> {
        streamDeck.logger.debug("Temperature Down action will appear", ev);
        const settings = ev.payload.settings;
        this.currentSettings = settings as ActionSettings; //Store settings for diff logic
        ev.action.setTitle(settings.showOnIcon ? `-${settings.increments ?? 10}%` : "");
    }

    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        streamDeck.logger.debug("Brightness Down action key down", ev);
        const settings = ev.payload.settings;
        const selectedLights = settings.selectedLights as Array<string>;
        const increments = settings.increments as number;
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
            const newPercentage = Math.max(currentPercentage - increments, 0);
            let newTemp = minTemp + ((maxTemp - minTemp) * (newPercentage / 100));
            newTemp = Math.max(Math.round(newTemp / 100) * 100, minTemp);  //Round to nearest 100 without going under
            streamDeck.logger.debug(`Setting temperature of light ${selectedLight} from ${currentPercentage}% (${currentTemp}K) to ${newPercentage}% (${newTemp}K)`);
            setTemperatureInKelvin(light, newTemp);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Brightness Down action received message from PI", ev);
        sendLightsToUI(ev);
    }

    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<JsonObject>): Promise<void> | void {
        const prevSelected = (this.currentSettings?.selectedLights ?? []) as Array<string>;
        const newSelected = (ev.payload.settings?.selectedLights ?? []) as Array<string>;
        const diff = newSelected.find(light => !prevSelected.includes(light)) ?? prevSelected.find(light => !newSelected.includes(light));
        if (diff) {
            flashLight(diff, 2);
        }
        const increment = (ev.payload.settings?.increments ?? 10) as number;
        ev.action.setTitle(ev.payload.settings?.showOnIcon ? `-${increment}%` : "");
        this.currentSettings = ev.payload.settings as ActionSettings;
    }
}

