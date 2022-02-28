import type { IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { author, name, version, description } from "../index";
import { BaseObject } from "../sdk";
import LiveObjectUI, { getDisplayValue, LiveObjectUIState } from "../ui/base";

export interface LiveObjectState {
    value: number;
}
export interface LiveObjectInternalState {
    displayValue: string;
}
export interface LiveObjectEventMap {
    "changeFromUI": { value: number; displayValue: string };
};

export interface LiveObjectProps extends Omit<LiveObjectUIState, "value"> {}

export default class LiveObject<
    D = {},
    S extends Partial<LiveObjectState> & Record<string, any> = {},
    I extends any[] = any[],
    O extends any[] = any[],
    A extends any[] = any[],
    P extends Partial<LiveObjectProps> & Record<string, any> = {},
    U extends Partial<LiveObjectUIState> & Record<string, any> = {},
    E extends Partial<LiveObjectEventMap> & Record<string, any> = {}
> extends BaseObject<D, S & LiveObjectState, I, O, A, P & LiveObjectProps, U & LiveObjectUIState, E & LiveObjectEventMap> {
    static package = name;
    static author = author;
    static version = version;
    static description = description;
    static props: IPropsMeta<Partial<LiveObjectProps>> = {
        min: {
            type: "number",
            default: 0,
            description: "Minimum value",
            isUIState: true
        },
        max: {
            type: "number",
            default: 127,
            description: "Maximum value",
            isUIState: true
        },
        step: {
            type: "number",
            default: 1,
            description: "Value change step",
            isUIState: true
        },
        type: {
            type: "enum",
            enums: ["enum", "float", "int"],
            default: "int",
            description: "Value type",
            isUIState: true
        },
        enums: {
            type: "object",
            default: [""],
            description: "Enum values",
            isUIState: true
        },
        active: {
            type: "boolean",
            default: true,
            description: "Active state",
            isUIState: true
        },
        focus: {
            type: "boolean",
            default: false,
            description: "Focus state",
            isUIState: true
        },
        shortName: {
            type: "string",
            default: "",
            description: "Short name to display",
            isUIState: true
        },
        longName: {
            type: "string",
            default: "",
            description: "Long name to display",
            isUIState: true
        },
        unitStyle: {
            type: "enum",
            enums: ["float", "int", "time", "hertz", "decibel", "%", "pan", "semitones", "midi", "custom", "native"],
            default: "int",
            description: "Style of unit to display",
            isUIState: true
        },
        units: {
            type: "string",
            default: "",
            description: "If unitStyle set to custom, display this as unit",
            isUIState: true
        },
        exponent: {
            type: "number",
            default: 0,
            description: "UI modulation bpf, 0 for linear",
            isUIState: true
        },
        speedLim: {
            type: "number",
            default: 16,
            description: "Value output speed limit in ms",
            isUIState: true
        },
        frameRate: {
            type: "number",
            default: 60,
            description: "UI refresh rate",
            isUIState: true
        }
    };
    static UI: typeof LiveObjectUI;
    state = { value: 0 } as S & LiveObjectState;
    _: LiveObjectInternalState = { displayValue: "0" };
    /**
     * Get a nearest valid number
     */
    toValidValue(value: number): number {
        const min = this.getProp("min");
        const max = this.getProp("max");
        const step = this.getProp("step");
        const v = Math.min(max, Math.max(min, value));
        return min + Math.floor((v - min) / step) * step;
    }
    toDisplayValue(value: number): string {
        const { type, unitStyle, units, enums } = this.props;
        return getDisplayValue(value, type, unitStyle, units, enums);
    }
    validateValue(valueIn: number) {
        const value = this.toValidValue(valueIn || 0);
        if (value === this.state.value) return;
        this.setState({ value } as S & LiveObjectState);
        this._.displayValue = this.toDisplayValue(this.state.value);
    }
    onChangeFromUI(e: { value: number; displayValue: string }) {
        this.emit("changeFromUI", e);
    }
    subscribe() {
        super.subscribe();
        this.on("updateProps", (props) => {
            if (typeof props.max !== "undefined" || typeof props.min !== "undefined" || typeof props.step !== "undefined") {
                const lastValue = this.state.value;
                this.validateValue(this.state.value);
                if (lastValue !== this.state.value) this.updateUI({ value: this.state.value } as any);
            }
        });
    }
}
