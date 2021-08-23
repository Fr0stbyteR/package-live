import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import type { CanvasUIState } from "@jspatcher/jspatcher/src/core/objects/base/CanvasUI";
import LiveMeter, { LiveMeterProps } from "../objects/meter";
import { CanvasUI } from "../sdk";
import LiveObjectUI from "./base";


export interface LiveMeterUIState extends Omit<LiveMeterProps, "thresholdLinear" | "thresholdDB" | "windowSize" | "speedLim">, CanvasUIState {
    levels: number[];
}
export default class LiveMeterUI extends CanvasUI<LiveMeter, {}, LiveMeterUIState> {
    state: LiveMeterUIState & BaseUIState = {
        ...this.state,
        levels: this.object.state.levels
    };
    levels: number[] = [];
    maxValues: number[] = [];
    maxTimer: number;
    paint() {
        const {
            // width,
            // height,
            active,
            mode,
            levels,
            min,
            max,
            orientation,
            bgColor,
            coldColor,
            warmColor,
            hotColor,
            overloadColor,
            inactiveColdColor,
            inactiveWarmColor
        } = this.state;
        const ctx = this.ctx;
        if (!ctx) return;

        let [width, height] = this.fullSize();
        ctx.clearRect(0, 0, width, height);

        this.levels = levels.slice();
        if (this.levels.length === 0) this.levels = [min];
        if (this.levels.find((v, i) => typeof this.maxValues[i] === "undefined" || v > this.maxValues[i])) {
            this.maxValues = [...this.levels];
            if (this.maxTimer) window.clearTimeout(this.maxTimer);
            this.maxTimer = window.setTimeout(() => {
                this.maxValues = [...this.levels];
                this.maxTimer = undefined;
                this.schedulePaint();
            }, 1000);
        } else if (this.levels.find((v, i) => v < this.maxValues[i]) && typeof this.maxTimer === "undefined") {
            this.maxTimer = window.setTimeout(() => {
                this.maxValues = [...this.levels];
                this.maxTimer = undefined;
                this.schedulePaint();
            }, 1000);
        }
        const channels = this.levels.length;
        const clipValue = +(mode === "linear");
        if (orientation === "vertical") {
            ctx.save();
            ctx.translate(0, height);
            ctx.rotate(-Math.PI * 0.5);
            [height, width] = [width, height];
        }
        const $height = (height - channels - 1) / this.levels.length;
        ctx.fillStyle = bgColor;
        if (min >= clipValue || clipValue >= max) {
            const fgColor = min >= clipValue ? active ? overloadColor : inactiveWarmColor : active ? coldColor : inactiveColdColor;
            let $top = 0;
            this.levels.forEach((v) => {
                if (v < max) ctx.fillRect(0, $top, width, $height);
                $top += $height + 1;
            });
            $top = 0;
            ctx.fillStyle = fgColor;
            this.levels.forEach((v, i) => {
                const distance = LiveObjectUI.getDistance({ type: "float", value: v, min, max, exponent: 0 });
                if (distance > 0) ctx.fillRect(0, $top, distance * width, $height);
                const histMax = this.maxValues[i];
                if (typeof histMax === "number" && histMax > v) {
                    const histDistance = LiveObjectUI.getDistance({ type: "float", value: histMax, min, max, exponent: 0 });
                    ctx.fillRect(Math.min(width - 1, histDistance * width), $top, 1, $height);
                }
                $top += $height + 1;
            });
        } else {
            const clipDistance = LiveObjectUI.getDistance({ type: "float", value: clipValue, min, max, exponent: 0 });
            const clip = width - clipDistance * width;
            const hotStop = width - clip;
            const warmStop = hotStop - 1;
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, active ? coldColor : inactiveColdColor);
            gradient.addColorStop(warmStop / width, active ? warmColor : inactiveWarmColor);
            gradient.addColorStop(hotStop / width, active ? hotColor : inactiveWarmColor);
            gradient.addColorStop(1, active ? overloadColor : inactiveWarmColor);
            let $top = 0;
            this.levels.forEach((v) => {
                if (v < clipValue) ctx.fillRect(0, $top, warmStop, $height);
                if (v < max) ctx.fillRect(hotStop, $top, clip, $height);
                $top += $height + 1;
            });
            $top = 0;
            ctx.fillStyle = gradient;
            this.levels.forEach((v, i) => {
                const distance = LiveObjectUI.getDistance({ type: "float", value: v, min, max, exponent: 0 });
                if (distance > 0) ctx.fillRect(0, $top, Math.min(warmStop, distance * width), $height);
                if (distance > clipDistance) ctx.fillRect(hotStop, $top, Math.min(clip, (distance - clipDistance) * width), $height);
                const histMax = this.maxValues[i];
                if (typeof histMax === "number" && histMax > v) {
                    const histDistance = LiveObjectUI.getDistance({ type: "float", value: histMax, min, max, exponent: 0 });
                    if (histDistance <= clipDistance) ctx.fillRect(histDistance * width, $top, 1, $height);
                    else ctx.fillRect(Math.min(width - 1, histDistance * width), $top, 1, $height);
                }
                $top += $height + 1;
            });
        }
        if (orientation === "vertical") ctx.restore();
    }
}
