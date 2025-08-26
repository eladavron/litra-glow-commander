import streamDeck, { action, JsonValue, KeyDownEvent, SingletonAction, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { getLightBySerialNumber, sendLightsToUI } from "../global";
import { getTemperatureInKelvin, getMaximumTemperatureInKelvinForDevice, setTemperatureInKelvin } from "litra";
import { ActionSettings } from "../settings";

@action({ UUID: "com.elad-avron.litra-glow-commander.temperature-up" })
export class TemperatureUp extends SingletonAction {

    override onWillAppear(ev: WillAppearEvent): void | Promise<void> {
        streamDeck.logger.debug("Toggle action will appear", ev);
        //TODO: Determine current brightness level of selected lights and update button UI
    }

    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        streamDeck.logger.debug("Temperature Up action key down", ev);
        const settings = ev.payload.settings;
        const selectedLights = settings.selectedLights as Array<string>;
        for (const selectedLight of selectedLights) {
            const light = getLightBySerialNumber(selectedLight);
            if (!light) {
                streamDeck.logger.error("Light not found", selectedLight);
                continue;
            }
            const currentTemp = getTemperatureInKelvin(light);
            const maxTemp = getMaximumTemperatureInKelvinForDevice(light);
            const currentPercentage = Math.round(((currentTemp / maxTemp) * 100) / 10) * 10;
            const newPercentage = Math.min(currentPercentage + 10, 100);
            const newTemp = Math.round(((maxTemp / 100) * newPercentage) / 100) * 100;
            streamDeck.logger.debug(`Setting temperature of light ${selectedLight} from ${currentPercentage}% (${currentTemp}K) to ${newPercentage}% (${newTemp}K)`);
            setTemperatureInKelvin(light, newTemp);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Temperature Up action received message from PI", ev);
        sendLightsToUI(ev);
    }
}

