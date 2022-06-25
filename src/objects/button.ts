import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { Bang } from "../sdk";
import LiveButtonUI, { LiveButtonUIState } from "../ui/button";
import LiveObject, { LiveObjectProps } from "./base";

export interface LiveButtonProps extends LiveObjectProps {
    bgColor: string;
    activeBgColor: string;
    bgOnColor: string;
    activeBgOnColor: string;
    borderColor: string;
    focusBorderColor: string;
    transition: "Zero->One" | "One->Zero" | "Both";
}
export default class LiveButton extends LiveObject<{}, {}, [any], [Bang, number], [number], LiveButtonProps, LiveButtonUIState> {
    static description = "Button";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "number",
        description: "Output a bang following transition prop."
    }];
    static outlets: IOutletsMeta = [{
        type: "bang",
        description: "Bang"
    }, {
        type: "number",
        description: "Current value"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        default: 0,
        description: "Initial value"
    }];
    static props: IPropsMeta<Partial<LiveButtonProps>> = {
        shortName: {
            type: "string",
            default: "live.button",
            description: "Short name to display",
            isUIState: true
        },
        longName: {
            type: "string",
            default: "live.button",
            description: "Long name to display",
            isUIState: true
        },
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
        },
        transition: {
            type: "enum",
            enums: ["Zero->One", "One->Zero", "Both"],
            default: "Zero->One",
            description: "Specifies when a bang message will be sent to the outlet"
        }
    };
    static UI = LiveButtonUI;
    subscribe() {
        super.subscribe();
        const validateAndUpdateUI = (value = 0, id?: string) => {
            this.validateValue(value, id);
            this.updateUI({ value: this.state.value });
        }
        const handleUpdateArgs = (args: [number?]) => {
            if (typeof args[0] === "number") {
                validateAndUpdateUI(+!!args[0]);
            }
        };
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 2;
            validateAndUpdateUI(+!!this.args[0]);
        });
        this.on("updateArgs", handleUpdateArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                validateAndUpdateUI(+!!data);
                this.outlet(1, this.state.value);
                if (this.state.value && this.getProp("transition") !== "One->Zero") this.outlet(0, new Bang());
            }
        });
        this.on("changeFromUI", ({ value }) => {
            const lastValue = this.state.value;
            validateAndUpdateUI(value);
            this.outlet(1, value);
            const transition = this.getProp("transition");
            const b01 = transition !== "One->Zero";
            const b10 = transition !== "Zero->One";
            if ((b01 && lastValue < this.state.value) || (b10 && lastValue > this.state.value)) this.outlet(0, new Bang());
        });
        this.on("updateState", ({ state: { value }, id }) => {
            validateAndUpdateUI(value, id);
            this.outlet(1, this.state.value);
            if (this.state.value && this.getProp("transition") !== "One->Zero") this.outlet(0, new Bang());
        });
    }
}
