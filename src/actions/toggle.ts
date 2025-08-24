import streamDeck, {
    action,
    JsonValue,
    KeyDownEvent,
    SendToPluginEvent,
    SingletonAction,
    WillAppearEvent
} from "@elgato/streamdeck";
import type { DataSourcePayload, DataSourceResult, DataSourceResultItem } from "../sdpi";
import { ActionSettings } from "../settings";
import { getLights } from "../global";

type ToggleActionSettings = {
    isOn: boolean;
} & ActionSettings;

@action({ UUID: "com.elad-avron.litra-glow-commander.toggle" })
export class ToggleAction extends SingletonAction<ToggleActionSettings> {
    override onWillAppear(ev: WillAppearEvent): void | Promise<void> {
        streamDeck.logger.debug("Toggle action will appear", ev);
    }

    override async onKeyDown(ev: KeyDownEvent): Promise<void> {
        streamDeck.logger.debug("Toggle action key down", ev);
    }

    override onSendToPlugin(ev: SendToPluginEvent<JsonValue, ToggleActionSettings>): Promise<void> | void {
        streamDeck.logger.debug("Toggle action received message from PI", ev);
        if (ev.payload instanceof Object && "event" in ev.payload && ev.payload.event === "getLights") {
            streamDeck.ui.current?.sendToPropertyInspector({
                event: "getLights",
                items: getLights().map(light => ({
                    label: light.name,
                    value: light.sn
                }) satisfies DataSourceResultItem) satisfies DataSourceResult
            } satisfies DataSourcePayload);
        }
    }


}

