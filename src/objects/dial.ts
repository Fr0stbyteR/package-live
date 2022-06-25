import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { Bang, isBang } from "../sdk";
import LiveDialUI, { LiveDialUIState } from "../ui/dial";
import LiveObject, { LiveObjectProps } from "./base";

export interface LiveDialProps extends LiveObjectProps {
    borderColor: string;
    focusBorderColor: string;
    dialColor: string;
    activeDialColor: string;
    fgDialColor: string;
    activeFgDialColor: string;
    needleColor: string;
    activeNeedleColor: string;
    panelColor: string;
    triBorderColor: string;
    triColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    fontFace: "regular" | "bold" | "italic" | "bold italic";
    appearance: "vertical" | "tiny" | "panel";
    showName: boolean;
    showNumber: boolean;
    triangle: boolean;
}
export default class LiveDial extends LiveObject<{}, {}, [number | Bang, number], [number, string], [number], LiveDialProps, LiveDialUIState> {
    static description = "Dial knob";
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
    static props: IPropsMeta<Partial<LiveDialProps>> = {
        shortName: {
            type: "string",
            default: "live.dial",
            description: "Short name to display",
            isUIState: true
        },
        longName: {
            type: "string",
            default: "live.dial",
            description: "Long name to display",
            isUIState: true
        },
        borderColor: {
            type: "color",
            default: "rgba(90, 90, 90, 1)",
            description: "Border color (unfocus)",
            isUIState: true
        },
        focusBorderColor: {
            type: "color",
            default: "rgba(80, 80, 80, 1)",
            description: "Border color (focus)",
            isUIState: true
        },
        dialColor: {
            type: "color",
            default: "rgba(109, 215, 255, 1)",
            description: "Dial color (inactive)",
            isUIState: true
        },
        activeDialColor: {
            type: "color",
            default: "rgba(109, 215, 255, 1)",
            description: "Dial color (active)",
            isUIState: true
        },
        fgDialColor: {
            type: "color",
            default: "rgba(105, 105, 105, 1)",
            description: "Forground dial color (inactive)",
            isUIState: true
        },
        activeFgDialColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Forground dial color (active)",
            isUIState: true
        },
        needleColor: {
            type: "color",
            default: "rgba(105, 105, 105, 1)",
            description: "Needle color (inactive)",
            isUIState: true
        },
        activeNeedleColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Needle color (active)",
            isUIState: true
        },
        panelColor: {
            type: "color",
            default: "rgba(165, 165, 165, 1)",
            description: "Panel color",
            isUIState: true
        },
        triBorderColor: {
            type: "color",
            default: "rgba(50, 50, 50, 1)",
            description: "Triangle border color",
            isUIState: true
        },
        triColor: {
            type: "color",
            default: "rgba(40, 40, 40, 1)",
            description: "Triangle color (inactive)",
            isUIState: true
        },
        textColor: {
            type: "color",
            default: "rgba(255, 255, 255, 1)",
            description: "Text color",
            isUIState: true
        },
        fontFamily: {
            type: "enum",
            enums: ["Lato", "Georgia", "Times New Roman", "Arial", "Tahoma", "Verdana", "Courier New"],
            default: "Arial",
            description: "Font family",
            isUIState: true
        },
        fontSize: {
            type: "number",
            default: 10,
            description: "Text font size",
            isUIState: true
        },
        fontFace: {
            type: "enum",
            enums: ["regular", "bold", "italic", "bold italic"],
            default: "regular",
            description: "Text style",
            isUIState: true
        },
        appearance: {
            type: "enum",
            enums: ["vertical", "tiny", "panel"],
            default: "vertical",
            description: "Dial style",
            isUIState: true
        },
        showName: {
            type: "boolean",
            default: true,
            description: "Display name",
            isUIState: true
        },
        showNumber: {
            type: "boolean",
            default: true,
            description: "Display number as text",
            isUIState: true
        },
        triangle: {
            type: "boolean",
            default: false,
            description: "Display triangle",
            isUIState: true
        }
    };
    static UI = LiveDialUI;
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
