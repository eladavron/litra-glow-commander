import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { ToggleAction } from "./actions/toggle";
import { BrightnessUpAction } from "./actions/brightness_up";
import { BrightnessDownAction } from "./actions/brightness_down";
import { TemperatureDown } from "./actions/temp_down";
import { TemperatureUp } from "./actions/temp_up";
import { SetTemperature } from "./actions/set_temp";
import { SetBrightness } from "./actions/set_brightness";

streamDeck.logger.setLevel(LogLevel.TRACE);
streamDeck.actions.registerAction(new ToggleAction());
streamDeck.actions.registerAction(new BrightnessUpAction());
streamDeck.actions.registerAction(new BrightnessDownAction());
streamDeck.actions.registerAction(new TemperatureDown());
streamDeck.actions.registerAction(new TemperatureUp());
streamDeck.actions.registerAction(new SetTemperature());
streamDeck.actions.registerAction(new SetBrightness());
streamDeck.connect();