
import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { Bang, isBang } from "../sdk";
import LiveSliderUI, { LiveSliderUIState } from "../ui/slider";
import LiveObject, { LiveObjectProps } from "./base";

export interface LiveSliderProps extends LiveObjectProps {
    relative: boolean;
    sliderColor: string;
    triBorderColor: string;
    triColor: string;
    triOnColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    fontFace: "regular" | "bold" | "italic" | "bold italic";
    orientation: "vertical" | "horizontal";
    showName: boolean;
    showNumber: boolean;
}
export default class LiveSlider extends LiveObject<{}, {}, [number | Bang, number], [number, string], [number], LiveSliderProps, LiveSliderUIState> {
    static description = "Slider";
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
    static props: IPropsMeta<Partial<LiveSliderProps>> = {
        shortName: {
            type: "string",
            default: "live.slider",
            description: "Short name to display",
            isUIState: true
        },
        longName: {
            type: "string",
            default: "live.slider",
            description: "Long name to display",
            isUIState: true
        },
        relative: {
            type: "boolean",
            default: false,
            description: "Modify value use relative mouse move",
            isUIState: true
        },
        sliderColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Slider color",
            isUIState: true
        },
        triBorderColor: {
            type: "color",
            default: "rgba(80, 80, 80, 1)",
            description: "Triangle border color",
            isUIState: true
        },
        triColor: {
            type: "color",
            default: "rgba(165, 165, 165, 1)",
            description: "Triangle color",
            isUIState: true
        },
        triOnColor: {
            type: "color",
            default: "rgba(195, 195, 195, 1)",
            description: "Triangle color while on",
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
        orientation: {
            type: "enum",
            enums: ["vertical", "horizontal"],
            default: "horizontal",
            description: "Slider orientation",
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
        }
    };
    static UI = LiveSliderUI;
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
