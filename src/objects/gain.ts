import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import LiveObject, { LiveObjectInternalState } from "./base";
import LiveGainUI, { LiveGainUIState } from "../ui/gain";
import { Bang, isBang, MathUtils, TemporalAnalyserNode } from "../sdk";
import type { LiveSliderProps } from "./slider";
import type { LiveMeterProps } from "./meter";

export interface LiveGainProps extends Omit<LiveSliderProps, "sliderColor">, LiveMeterProps {
    metering: "postFader" | "preFader";
    interp: number;
}
export interface LiveGainInternalState extends LiveObjectInternalState {
    analyserNode: TemporalAnalyserNode;
    bypassNode: GainNode;
    gainNode: GainNode;
    $requestTimer: number;
    levels: number[];
}

export default class LiveGain extends LiveObject<{}, {}, [number | Bang, number], [undefined, number, string, number[]], [number], LiveGainProps, LiveGainUIState> {
    static description = "Gain slider and monitor";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Signal in, number to set gain"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Audio out"
    }, {
        type: "number",
        description: "Number value"
    }, {
        type: "string",
        description: "Display value"
    }, {
        type: "object",
        description: "Amplitude value: number[]"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        default: 0,
        description: "Initial value"
    }];
    static props: IPropsMeta<Partial<LiveGainProps>> = {
        shortName: {
            type: "string",
            default: "live.gain",
            description: "Short name to display",
            isUIState: true
        },
        longName: {
            type: "string",
            default: "live.gain",
            description: "Long name to display",
            isUIState: true
        },
        min: {
            type: "number",
            default: -70,
            description: "Minimum value (dB)",
            isUIState: true
        },
        max: {
            type: "number",
            default: 6,
            description: "Maximum value (dB)",
            isUIState: true
        },
        step: {
            type: "number",
            default: 0.01,
            description: "Value change step",
            isUIState: true
        },
        type: {
            type: "enum",
            enums: ["enum", "float", "int"],
            default: "float",
            description: "Value type",
            isUIState: true
        },
        unitStyle: {
            type: "enum",
            enums: ["float", "int", "time", "hertz", "decibel", "%", "pan", "semitones", "midi", "custom", "native"],
            default: "decibel",
            description: "Style of unit to display",
            isUIState: true
        },
        relative: {
            type: "boolean",
            default: false,
            description: "Modify value use relative mouse move",
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
        },
        bgColor: {
            type: "color",
            default: "rgb(40, 40, 40)",
            description: "Background color",
            isUIState: true
        },
        inactiveColdColor: {
            type: "color",
            default: "rgb(130, 130, 130)",
            description: "Cold color (inactive)",
            isUIState: true
        },
        inactiveWarmColor: {
            type: "color",
            default: "rgb(149, 149, 149)",
            description: "Warm color (inactive)",
            isUIState: true
        },
        coldColor: {
            type: "color",
            default: "rgb(12, 248, 100)",
            description: "Cold color (active)",
            isUIState: true
        },
        warmColor: {
            type: "color",
            default: "rgb(195, 248, 100)",
            description: "Warm color (active)",
            isUIState: true
        },
        hotColor: {
            type: "color",
            default: "rgb(255, 193, 10)",
            description: "Hot color (active)",
            isUIState: true
        },
        overloadColor: {
            type: "color",
            default: "rgb(255, 10, 10)",
            description: "Overload color (active)",
            isUIState: true
        },
        mode: {
            type: "enum",
            enums: ["deciBel", "linear"],
            default: "deciBel",
            description: "Display mode",
            isUIState: true
        },
        speedLim: {
            type: "number",
            default: 16,
            description: "Value output speed limit in ms"
        },
        frameRate: {
            type: "number",
            default: 60,
            description: "UI refresh rate",
            isUIState: true
        },
        windowSize: {
            type: "number",
            default: 1024,
            description: "RMS window size"
        },
        thresholdDB: {
            type: "number",
            default: 0.1,
            description: "Redraw Threshold in dB"
        },
        thresholdLinear: {
            type: "number",
            default: 0.01,
            description: "Redraw Threshold in Linear"
        },
        metering: {
            type: "enum",
            enums: ["postFader", "preFader"],
            default: "postFader",
            description: "Display meter pre/post fader"
        },
        interp: {
            type: "number",
            default: 0.01,
            description: "Ramp time"
        }
    };
    static UI = LiveGainUI;
    _: LiveGainInternalState = {
        ...this._,
        analyserNode: undefined,
        gainNode: this.audioCtx.createGain(),
        bypassNode: this.audioCtx.createGain(),
        $requestTimer: -1,
        levels: []
    };
    inletAudioConnections = [{ node: this._.bypassNode, index: 0 }];
    outletAudioConnections = [{ node: this._.gainNode, index: 0 }];
    subscribe() {
        super.subscribe();
        const validateAndUpdateUI = (value = 0, id?: string) => {
            this.validateValue(value, id);
            const paramValue = this.state.value === this.getProp("min") ? 0 : this.getProp("mode") === "deciBel" ? MathUtils.dbtoa(this.state.value) : this.state.value;
            this.applyBPF(this._.gainNode.gain, [[paramValue, this.getProp("interp")]]);
            this.updateUI({ value: this.state.value });
        }
        const handleUpdateArgs = (args: number[]) => {
            if (typeof args[0] === "number") {
                validateAndUpdateUI(args[0]);
            }
        };
        const startRequest = () => {
            let lastResult: number[] = [];
            const request = async () => {
                if (this._.analyserNode && !this._.analyserNode.destroyed) {
                    const absMax = await this._.analyserNode.getAbsMax();
                    const mode = this.getProp("mode");
                    const thresh = this.getProp(mode === "deciBel" ? "thresholdDB" : "thresholdLinear");
                    const result = mode === "deciBel" ? absMax.map(v => MathUtils.atodb(v)) : absMax;
                    if (!lastResult.every((v, i) => v === result[i] || Math.abs(v - result[i]) < thresh) || lastResult.length !== result.length) {
                        this.outlet(3, result);
                        this._.levels = result;
                        this.updateUI({ levels: result });
                        lastResult = result;
                    }
                }
                scheduleRequest();
            };
            const scheduleRequest = () => {
                this._.$requestTimer = window.setTimeout(request, this.getProp("speedLim"));
            };
            request();
        };
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 4;
        });
        this.on("updateArgs", handleUpdateArgs);
        let lastMetering: "preFader" | "postFader";
        let lastMode: "deciBel" | "linear";
        this.on("updateProps", async (props) => {
            if (props.windowSize && this._.analyserNode) this.applyBPF(this._.analyserNode.parameters.get("windowSize"), [[props.windowSize]]);
            if (props.metering && lastMetering !== props.metering && this._.analyserNode) {
                if (lastMetering) {
                    if (lastMetering === "postFader") this._.gainNode.disconnect(this._.analyserNode);
                    else this._.bypassNode.disconnect(this._.analyserNode);
                }
                lastMetering = props.metering;
                if (props.metering === "preFader") this._.bypassNode.connect(this._.analyserNode, 0, 0);
                else this._.gainNode.connect(this._.analyserNode, 0, 0);
            }
            if (props.mode && lastMode && lastMode !== props.mode) {
                lastMode = props.mode;
                let value: number;
                if (props.mode === "linear") {
                    value = MathUtils.dbtoa(this.state.value);
                    await this.updateProps({ min: 0, max: 1.5, unitStyle: "float" });
                } else {
                    value = MathUtils.atodb(this.state.value);
                    await this.updateProps({ min: -70, max: 6, unitStyle: "decibel" });
                }
                validateAndUpdateUI(value);
            }
        });
        this.on("postInit", async () => {
            lastMode = this.getProp("mode");
            validateAndUpdateUI(this.args[0] || 0);
            this._.bypassNode.connect(this._.gainNode);
            await TemporalAnalyserNode.register(this.audioCtx.audioWorklet);
            this._.analyserNode = new TemporalAnalyserNode(this.audioCtx);
            this.applyBPF(this._.analyserNode.parameters.get("windowSize"), [[this.getProp("windowSize")]]);
            if (this.getProp("metering") === "preFader") this._.bypassNode.connect(this._.analyserNode, 0, 0);
            else this._.gainNode.connect(this._.analyserNode, 0, 0);
            startRequest();
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    validateAndUpdateUI(+data);
                }
                this.outletAll([, this.state.value, this._.displayValue]);
            }
        });
        this.on("changeFromUI", ({ value }) => {
            this.validateValue(value);
            const paramValue = this.state.value === this.getProp("min") ? 0 : this.getProp("mode") === "deciBel" ? MathUtils.dbtoa(this.state.value) : this.state.value;
            this.applyBPF(this._.gainNode.gain, [[paramValue, this.getProp("interp")]]);
            this.outletAll([, this.state.value, this._.displayValue]);
        });
        this.on("destroy", async () => {
            this._.bypassNode.disconnect();
            this._.gainNode.disconnect();
            window.clearTimeout(this._.$requestTimer);
            if (this._.analyserNode) await this._.analyserNode.destroy();
        });
        this.on("updateState", ({ state: { value }, id }) => {
            validateAndUpdateUI(value, id);
            this.outletAll([, this.state.value, this._.displayValue]);
        });
    }
}
