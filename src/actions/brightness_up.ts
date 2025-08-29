import streamDeck, { action, DidReceiveSettingsEvent, JsonObject, JsonValue, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { flashLight, getLightBySerialNumber, sendLightsToUI } from "../global";
import { setBrightnessPercentage, getBrightnessInLumen, getMaximumBrightnessInLumenForDevice } from "litra";
import { ActionSettings } from "../settings";

@action({ UUID: "com.eladavron.litra-glow-commander.brightness-up" })
export class BrightnessUpAction extends SingletonAction {
    currentSettings!: ActionSettings;

    override onWillAppear(ev: WillAppearEvent): void | Promise<void> {
        streamDeck.logger.debug("Toggle action will appear", ev);
        //Store settings for diff logic
        const settings = ev.payload.settings;
        this.currentSettings = settings as ActionSettings;
        //TODO: Determine current brightness level of selected lights and update button UI
    }

    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        streamDeck.logger.debug("Brightness Up action key down", ev);
        const settings = ev.payload.settings;
        const selectedLights = settings.selectedLights as Array<string>;
        const increments = settings.increments as number;
        for (const selectedLight of selectedLights) {
            const light = getLightBySerialNumber(selectedLight);
            if (!light) {
                streamDeck.logger.error("Light not found", selectedLight);
                continue;
            }
            const currentBrightness = getBrightnessInLumen(light);
            const maxBrightness = getMaximumBrightnessInLumenForDevice(light);
            const currentPercentage = Math.round(((currentBrightness / maxBrightness) * 100) / 10) * 10;
            const newPercentage = Math.min(currentPercentage + increments, 100);
            const newValue = (maxBrightness / 100) * newPercentage;
            streamDeck.logger.debug(`Setting brightness of light ${selectedLight} from ${currentPercentage}% (${currentBrightness}lm) to ${newPercentage}% (${newValue}lm)`);
            setBrightnessPercentage(light, newPercentage);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Brightness Up action received message from PI", ev);
        sendLightsToUI(ev);
    }

    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<JsonObject>): Promise<void> | void {
        const prevSelected = (this.currentSettings?.selectedLights ?? []) as Array<string>;
        const newSelected = (ev.payload.settings?.selectedLights ?? []) as Array<string>;
        const diff = newSelected.find(light => !prevSelected.includes(light)) ?? prevSelected.find(light => !newSelected.includes(light));
        if (diff) {
            flashLight(diff, 2);
        }
        this.currentSettings = ev.payload.settings as ActionSettings;
    }
}

