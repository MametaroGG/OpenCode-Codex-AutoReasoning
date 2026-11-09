import { Plugin } from "@opencode/plugin/tui";
import { setupTui } from "./tui-setup.js";

export default Plugin.define({ id: "auto-reasoning.tui", setup: setupTui });
