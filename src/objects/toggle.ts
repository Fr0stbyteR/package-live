import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { Bang, isBang } from "../sdk";
import LiveToggleUI, { LiveToggleUIState } from "../ui/toggle";
import LiveObject, { LiveObjectProps } from "./base";

export interface LiveToggleProps extends LiveObjectProps {
    bgColor: string;
    activeBgColor: string;
    bgOnColor: string;
    activeBgOnColor: string;
    borderColor: string;
    focusBorderColor: string;
}

export default class LiveToggle extends LiveObject<{}, {}, [number | Bang, number], [number, string], [number], LiveToggleProps, LiveToggleUIState> {
    static description = "Toggle";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "number",
        description: "Set and output the value"
    }, {
        isHot: false,
        type: "number",
        description: "Set without output the value"
    }];
    static outlets: IOutletsMeta = [{
        type: "number",
        description: "Number value"
    }, {
        type: "string",
        description: "Display value"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        default: 0,
        description: "Initial value"
    }];
    static props: IPropsMeta = {
        max: {
            type: "number",
            default: 1,
            description: "Maximum value",
            isUIState: true
        },
        bgColor: {
            type: "color",
            default: "rgba(90, 90, 90, 1)",
            description: "Background color (inactive)",
            isUIState: true
        },
        activeBgColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Background color (active)",
            isUIState: true
        },
        bgOnColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Background color (on / inactive)",
            isUIState: true
        },
        activeBgOnColor: {
            type: "color",
            default: "rgba(109, 215, 255, 1)",
            description: "Background color (on / active)",
            isUIState: true
        },
        borderColor: {
            type: "color",
            default: "rgba(80, 80, 80, 1)",
            description: "Border color (unfocus)",
            isUIState: true
        },
        focusBorderColor: {
            type: "color",
            default: "rgba(80, 80, 80, 1)",
            description: "Border color (focus)",
            isUIState: true
        }
    };
    static UI = LiveToggleUI;
    subscribe() {
        super.subscribe();
        const validateAndUpdateUI = (value = 0, id?: string) => {
            this.validateValue(value, id);
            this.updateUI({ value: this.state.value });
        }
        const handleUpdateArgs = (args: [number?]) => {
            if (typeof args[0] === "number") {
                validateAndUpdateUI(args[0]);
            }
        };
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 2;
            validateAndUpdateUI(this.args[0] || 0);
        });
        this.on("updateArgs", handleUpdateArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    validateAndUpdateUI(+data);
                }
                this.outletAll([this.state.value, this._.displayValue]);
            } else if (inlet === 1) {
                validateAndUpdateUI(+data);
            }
        });
        this.on("changeFromUI", ({ value }) => {
            this.validateValue(value);
            this.outletAll([this.state.value, this._.displayValue]);
        });
        this.on("updateState", ({ state: { value }, id }) => {
            validateAndUpdateUI(value, id);
            this.outletAll([this.state.value, this._.displayValue]);
        });
    }
}
