import streamDeck, { action, DidReceiveSettingsEvent, JsonObject, JsonValue, KeyDownEvent, SendToPluginEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { flashLight, getLightBySerialNumber, sendLightsToUI } from "../global";
import { turnOn, turnOff, isOn } from "litra";
import { ActionSettings } from "../settings";

@action({ UUID: "com.eladavron.litra-glow-commander.toggle" })
export class ToggleAction extends SingletonAction {
    currentSettings!: ActionSettings;

    override onWillAppear(ev: WillAppearEvent): void | Promise<void> {
        streamDeck.logger.debug("Toggle action will appear", ev);
        //Determine current state of selected lights
        const settings = ev.payload.settings;
        this.currentSettings = settings as ActionSettings;
        const selectedLights = settings.selectedLights as Array<string>;
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

    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        streamDeck.logger.debug("Toggle action key down", ev);
        const settings = ev.payload.settings;
        const selectedLights = settings.selectedLights as Array<string>;
        for (const selectedLight of selectedLights) {
            const light = getLightBySerialNumber(selectedLight);
            if (!light) {
                streamDeck.logger.error("Light not found", selectedLight);
                continue;
            }
            const newState = !ev.payload.state;
            streamDeck.logger.info(`Turning ${newState ? "on" : "off"} light`, light);
            if (newState) turnOn(light); else turnOff(light);
        }
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Toggle action received message from PI", ev);
        sendLightsToUI(ev);
    }

    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<JsonObject>): Promise<void> | void {
        //Determine which light was selected
        const prevSelected = (this.currentSettings?.selectedLights ?? []) as Array<string>;
        const newSelected = (ev.payload.settings?.selectedLights ?? []) as Array<string>;
        const diff = newSelected.find(light => !prevSelected.includes(light)) ?? prevSelected.find(light => !newSelected.includes(light));
        if (diff) {
            //Flash light
            flashLight(diff, 2);
        }

        //Finally, update settings
        this.currentSettings = ev.payload.settings as ActionSettings;
    }
}

