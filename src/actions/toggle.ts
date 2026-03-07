import streamDeck, { action, DidReceiveSettingsEvent, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { JsonValue } from "@elgato/utils";
import { flashLight, getLightBySerialNumber, sendLightsToUI } from "../global";
import { turnOn, turnOff, isOn } from "litra";
import { ActionSettings, getActionSettings } from "../settings";

@action({ UUID: "com.eladavron.litra-glow-commander.toggle" })
export class ToggleAction extends SingletonAction<ActionSettings> {
    currentSettings!: ActionSettings;

    override async onWillAppear(ev: WillAppearEvent<ActionSettings>): Promise<void> {
        streamDeck.logger.debug("Toggle action will appear", ev);
        //Determine current state of selected lights
        const settings = getActionSettings(ev.payload.settings);
        if (JSON.stringify(ev.payload.settings ?? {}) !== JSON.stringify(settings)) {
            await ev.action.setSettings(settings);
        }

        this.currentSettings = settings;
        const selectedLights = settings.selectedLights;
        const allOn = selectedLights?.every(light => {
            const lightDevice = getLightBySerialNumber(light);
            if (!lightDevice) return true; //If a light isn't connected, ignore its status
            return isOn(lightDevice);
        });
        streamDeck.logger.info(`All selected lights are ${allOn ? "on" : "off"}`);
        if (ev.action.isKey()) {
            ev.action.setState(allOn ? 1 : 0);
        }
    }

    override async onKeyDown(ev: KeyDownEvent<ActionSettings>): Promise<void> {
        streamDeck.logger.debug("Toggle action key down", ev);
        const settings = getActionSettings(ev.payload.settings);
        const selectedLights = settings.selectedLights;
        for (const selectedLight of selectedLights) {
            const light = getLightBySerialNumber(selectedLight);
            if (!light) {
                streamDeck.logger.error("Light not found", selectedLight);
                continue;
            }
            const oldState = isOn(light);
            const newState = !oldState;
            streamDeck.logger.info(`Turning ${newState ? "on" : "off"} light`, light);
            if (newState) turnOn(light); else turnOff(light);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Toggle action received message from PI", ev);
        sendLightsToUI(ev);
    }

    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<ActionSettings>): Promise<void> | void {
        //Determine which light was selected
        const prevSelected = (this.currentSettings?.selectedLights ?? []) as Array<string>;
        const settings = getActionSettings(ev.payload.settings);
        const newSelected = settings.selectedLights;
        const diff = newSelected.find(light => !prevSelected.includes(light)) ?? prevSelected.find(light => !newSelected.includes(light));
        if (diff) {
            //Flash light
            flashLight(diff, 2);
        }

        //Finally, update settings
        this.currentSettings = settings;
    }
}

