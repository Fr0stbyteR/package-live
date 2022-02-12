
import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import { BaseObject, MathUtils, TemporalAnalyserNode } from "../sdk";
import LiveMeterUI, { LiveMeterUIState } from "../ui/meter";
import LiveObject from "./base";

export interface LiveMeterProps {
    active: boolean;
    orientation: "vertical" | "horizontal";
    mode: "deciBel" | "linear";
    min: number;
    max: number;
    thresholdLinear: number;
    thresholdDB: number;
    speedLim: number;
    frameRate: number;
    windowSize: number;
    bgColor: string;
    inactiveColdColor: string;
    inactiveWarmColor: string;
    coldColor: string;
    warmColor: string;
    hotColor: string;
    overloadColor: string;
}
export interface LiveMeterInternalState {
    node: TemporalAnalyserNode;
    $requestTimer: number;
    levels: number[];
}

export default class LiveMeter extends BaseObject<{}, {}, [], [number[]], [], LiveMeterProps, LiveMeterUIState> {
    static package = LiveObject.package;
    static author = LiveObject.author;
    static version = LiveObject.version;
    static description = "Meter";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Signal to measure"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "Amplitude value: number[]"
    }];
    static props: IPropsMeta<LiveMeterProps> = {
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
        active: {
            type: "boolean",
            default: true,
            description: "Active _",
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
        orientation: {
            type: "enum",
            enums: ["vertical", "horizontal"],
            default: "horizontal",
            description: "Meter orientation",
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
        }
    };
    static UI = LiveMeterUI;
    _: LiveMeterInternalState = { node: undefined, $requestTimer: -1, levels: [] };
    subscribe() {
        super.subscribe();
        const startRequest = () => {
            let lastResult: number[] = [];
            const request = async () => {
                if (this._.node && !this._.node.destroyed) {
                    const absMax = await this._.node.getAbsMax();
                    const mode = this.getProp("mode");
                    const thresh = this.getProp(mode === "deciBel" ? "thresholdDB" : "thresholdLinear");
                    const result = mode === "deciBel" ? absMax.map(v => MathUtils.atodb(v)) : absMax;
                    if (!lastResult.every((v, i) => v === result[i] || Math.abs(v - result[i]) < thresh) || lastResult.length !== result.length) {
                        this.outlet(0, result);
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
            this.outlets = 1;
        });
        this.on("updateProps", (props) => {
            if (props.windowSize && this._.node) this.applyBPF(this._.node.parameters.get("windowSize"), [[props.windowSize]]);
        });
        this.on("postInit", async () => {
            await TemporalAnalyserNode.register(this.audioCtx.audioWorklet);
            this._.node = new TemporalAnalyserNode(this.audioCtx);
            this.applyBPF(this._.node.parameters.get("windowSize"), [[this.getProp("windowSize")]]);
            this.disconnectAudioInlet();
            this.inletAudioConnections[0] = { node: this._.node, index: 0 };
            this.connectAudioInlet();
            startRequest();
        });
        this.on("destroy", () => {
            window.clearTimeout(this._.$requestTimer);
            if (this._.node) this._.node.destroy();
        });
    }
}
