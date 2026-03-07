import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import { flashLight, getLightBySerialNumber, sendLightsToUI } from "../global";
import { getBrightnessInLumen, getMaximumBrightnessInLumenForDevice, getMinimumBrightnessInLumenForDevice, setBrightnessInLumen } from "litra";
import { IncrementActionSettings, getIncrementActionSettings } from "../settings";

@action({ UUID: "com.eladavron.litra-glow-commander.brightness-down" })
export class BrightnessDownAction extends SingletonAction<IncrementActionSettings> {
    currentSettings!: IncrementActionSettings;

    override async onWillAppear(ev: WillAppearEvent<IncrementActionSettings>): Promise<void> {
        streamDeck.logger.debug("Brightness Down action will appear", ev);
        const settings = getIncrementActionSettings(ev.payload.settings);
        if (JSON.stringify(ev.payload.settings ?? {}) !== JSON.stringify(settings)) {
            await ev.action.setSettings(settings);
        }

        this.currentSettings = settings;
        ev.action.setTitle(settings.showOnIcon ? `-${settings.increments}%` : "");
    }

    override async onKeyDown(ev: KeyDownEvent<IncrementActionSettings>): Promise<void> {
        streamDeck.logger.debug("Brightness Down action key down", ev);
        const settings = getIncrementActionSettings(ev.payload.settings);
        const selectedLights = settings.selectedLights;
        const increments = settings.increments;
        for (const selectedLight of selectedLights) {
            const light = getLightBySerialNumber(selectedLight);
            if (!light) {
                streamDeck.logger.error("Light not found", selectedLight);
                continue;
            }
            const currentBrightness = getBrightnessInLumen(light); 
            const maxBrightness = getMaximumBrightnessInLumenForDevice(light);
            const minBrightness = getMinimumBrightnessInLumenForDevice(light);
            const currentPercentage = Math.round((currentBrightness - minBrightness) / (maxBrightness - minBrightness) * 100);
            const newPercentage = Math.max(currentPercentage - increments, 0); // Used for logging only
            const newValue = Math.round(minBrightness + ((maxBrightness - minBrightness) * (newPercentage / 100)));
            streamDeck.logger.debug(`Setting brightness of light ${selectedLight} from ${currentPercentage}% (${currentBrightness}lm) to ${newPercentage}% (${newValue}lm)`);
            setBrightnessInLumen(light, newValue);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, IncrementActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Brightness Down action received message from PI", ev);
        sendLightsToUI(ev);
    }

    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<IncrementActionSettings>): Promise<void> | void {
        const prevSelected = (this.currentSettings?.selectedLights ?? []) as Array<string>;
        const settings = getIncrementActionSettings(ev.payload.settings);
        const newSelected = settings.selectedLights;
        const diff = newSelected.find(light => !prevSelected.includes(light)) ?? prevSelected.find(light => !newSelected.includes(light));
        if (diff) {
            flashLight(diff, 2);
        }
        ev.action.setTitle(settings.showOnIcon ? `-${settings.increments}%` : "");
        this.currentSettings = settings;
    }
}

