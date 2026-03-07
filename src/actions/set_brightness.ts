import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SingletonAction, SendToPluginEvent, WillAppearEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import { flashLight, getLightBySerialNumber, sendLightsToUI } from "../global";
import { getBrightnessInLumen, getMaximumBrightnessInLumenForDevice, setBrightnessPercentage }from "litra";
import { ValueActionSettings, getValueActionSettings } from "../settings";

@action({ UUID: "com.eladavron.litra-glow-commander.set-brightness" })
export class SetBrightness extends SingletonAction<ValueActionSettings> {
    currentSettings!: ValueActionSettings;

    override async onWillAppear(ev: WillAppearEvent<ValueActionSettings>): Promise<void> {
        streamDeck.logger.debug("Set Brightness action will appear", ev);
        const settings = getValueActionSettings(ev.payload.settings);
        if (JSON.stringify(ev.payload.settings ?? {}) !== JSON.stringify(settings)) {
            await ev.action.setSettings(settings);
        }

        this.currentSettings = settings;
        ev.action.setTitle(settings.showOnIcon ? `${settings.value}%` : "");
    }

    override async onKeyDown(ev: KeyDownEvent<ValueActionSettings>): Promise<void> {
        streamDeck.logger.debug("Set Brightness action key down", ev);
        const settings = getValueActionSettings(ev.payload.settings);
        const selectedLights = settings.selectedLights;
        const percentage = settings.value;
        for (const selectedLight of selectedLights) {
            const light = getLightBySerialNumber(selectedLight);
            if (!light) {
                streamDeck.logger.error("Light not found", selectedLight);
                continue;
            }
            const currentBrightness = getBrightnessInLumen(light);
            const maxBrightness = getMaximumBrightnessInLumenForDevice(light);
            const currentPercentage = Math.round(((currentBrightness / maxBrightness) * 100) / 10) * 10;
            const valueInLumen = (maxBrightness / 100) * percentage;
            streamDeck.logger.debug(`Setting brightness of light ${selectedLight} from ${currentPercentage}% (${currentBrightness}lm) to ${percentage}% (${valueInLumen}lm)`);
            setBrightnessPercentage(light, percentage);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ValueActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Brightness Up action received message from PI", ev);
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

