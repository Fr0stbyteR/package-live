import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { Bang, isBang } from "../sdk";
import LiveNumboxUI, { LiveNumboxUIState } from "../ui/numbox";
import LiveObject, { LiveObjectProps } from "./base";

export interface LiveNumboxProps extends LiveObjectProps {
    bgColor: string;
    activeBgColor: string;
    borderColor: string;
    focusBorderColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    fontFace: "regular" | "bold" | "italic" | "bold italic";
    appearance: "slider" | "triangle" | "default";
    triColor: string;
    activeTriColor: string;
    triColor2: string;
    activeTriColor2: string;
    activeSliderColor: string;
}
export default class LiveNumbox extends LiveObject<{}, {}, [number | Bang, number], [number, string], [number], LiveNumboxProps, LiveNumboxUIState> {
    static description = "Number box";
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
    static props: IPropsMeta<Partial<LiveNumboxProps>> = {
        bgColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Background color (inactive)",
            isUIState: true
        },
        activeBgColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Background color (active)",
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
        textColor: {
            type: "color",
            default: "rgba(0, 0, 0, 1)",
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
            enums: ["default", "slider", "triangle"],
            default: "default",
            description: "Text style",
            isUIState: true
        },
        triColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Triangle color (inactive)",
            isUIState: true
        },
        activeTriColor: {
            type: "color",
            default: "rgba(165, 165, 165, 1)",
            description: "Triangle color (active)",
            isUIState: true
        },
        triColor2: {
            type: "color",
            default: "rgba(165, 165, 165, 1)",
            description: "Triangle color on positive value (inactive)",
            isUIState: true
        },
        activeTriColor2: {
            type: "color",
            default: "rgba(109, 215, 255, 1)",
            description: "Triangle color on positive value (active)",
            isUIState: true
        },
        activeSliderColor: {
            type: "color",
            default: "rgba(109, 215, 255, 1)",
            description: "Slider color",
            isUIState: true
        }
    };
    static UI = LiveNumboxUI;
    subscribe() {
        super.subscribe();
        const validateAndUpdateUI = (value = 0) => {
            this.validateValue(value);
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
        this.on("updateState", ({ value }) => {
            validateAndUpdateUI(value);
            this.outletAll([this.state.value, this._.displayValue]);
        });
    }
}
