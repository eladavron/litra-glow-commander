import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { ToggleAction } from "./actions/toggle";

streamDeck.logger.setLevel(LogLevel.TRACE);
streamDeck.actions.registerAction(new ToggleAction());
streamDeck.connect();