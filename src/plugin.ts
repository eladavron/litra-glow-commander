import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { ToggleAction } from "./actions/toggle";
import { BrightnessUpAction } from "./actions/brightness_up";
import { BrightnessDownAction } from "./actions/brightness_down";
import { TemperatureDown } from "./actions/temp_down";
import { TemperatureUp } from "./actions/temp_up";

streamDeck.logger.setLevel(LogLevel.TRACE);
streamDeck.actions.registerAction(new ToggleAction());
streamDeck.actions.registerAction(new BrightnessUpAction());
streamDeck.actions.registerAction(new BrightnessDownAction());
streamDeck.actions.registerAction(new TemperatureDown());
streamDeck.actions.registerAction(new TemperatureUp());
streamDeck.connect();