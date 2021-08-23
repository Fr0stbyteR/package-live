import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { MathUtils } from "../sdk";
import LiveObjectUI, { LiveObjectUIState, PointerDownEvent, PointerDragEvent } from "./base";
import type LiveGain from "../objects/gain";
import type { LiveGainProps } from "../objects/gain";

export interface LiveGainUIState extends Omit<LiveGainProps, "thresholdLinear" | "thresholdDB" | "windowSize" | "speedLim">, LiveObjectUIState {
    levels: number[];
    inputBuffer: string;
}
export default class LiveGainUI extends LiveObjectUI<LiveGain, LiveGainUIState> {
    static defaultSize: [number, number] = [120, 45];
    state: LiveGainUIState & BaseUIState = {
        ...this.state,
        levels: this.object._.levels,
        inputBuffer: ""
    };
    className = "live-gain";
    interactionRect: number[] = [0, 0, 0, 0];
    inTouch = false;
    levels: number[] = [];
    maxValues: number[] = [];
    maxTimer: number;
    paint() {
        const {
            // width,
            // height,
            fontFamily,
            fontSize,
            fontFace,
            orientation,
            showName,
            showNumber,
            textColor,
            triBorderColor,
            triOnColor,
            triColor,
            shortName,
            levels,
            min,
            max,
            exponent,
            active,
            mode,
            bgColor,
            coldColor,
            warmColor,
            hotColor,
            overloadColor,
            inactiveColdColor,
            inactiveWarmColor,
            inputBuffer
        } = this.state;
        const ctx = this.ctx;
        if (!ctx) return;
        const lineWidth = 0.5;
        const padding = 8;
        const distance = this.distance;
        const displayValue = inputBuffer ? inputBuffer + "_" : this.displayValue;

        const [width, height] = this.fullSize();
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
        const meterThick = 8;
        const metersThick = (meterThick + 1) * channels - 1;

        ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = textColor;
        if (showName) ctx.fillText(shortName, width * 0.5, fontSize, width);
        if (showNumber) {
            if (orientation === "horizontal") {
                ctx.textAlign = "left";
                ctx.fillText(displayValue, 4, height - 2, width);
            } else {
                ctx.fillText(displayValue, width * 0.5, height - 2, width);
            }
        }
        this.interactionRect = [
            0,
            fontSize + padding,
            width,
            height - 2 * (fontSize + padding)
        ];

        ctx.save();
        let $width: number;
        const $height = meterThick;
        if (orientation === "horizontal") {
            $width = width;
            ctx.translate(0, (height - metersThick) * 0.5);
        } else {
            $width = this.interactionRect[3];
            ctx.translate((width - metersThick) * 0.5, height - fontSize - padding);
            ctx.rotate(-Math.PI * 0.5);
        }
        ctx.fillStyle = bgColor;
        if (min >= clipValue || clipValue >= max) {
            const fgColor = min >= clipValue ? active ? overloadColor : inactiveWarmColor : active ? coldColor : inactiveColdColor;
            let $top = 0;
            this.levels.forEach((v) => {
                if (v < max) ctx.fillRect(0, $top, $width, $height);
                $top += $height + 1;
            });
            $top = 0;
            ctx.fillStyle = fgColor;
            this.levels.forEach((v, i) => {
                const distance = LiveObjectUI.getDistance({ type: "float", value: v, min, max, exponent });
                if (distance > 0) ctx.fillRect(0, $top, distance * $width, $height);
                const histMax = this.maxValues[i];
                if (typeof histMax === "number" && histMax > v) {
                    const histDistance = LiveObjectUI.getDistance({ type: "float", value: histMax, min, max, exponent });
                    ctx.fillRect(Math.min($width - 1, histDistance * $width), $top, 1, $height);
                }
                $top += $height + 1;
            });
        } else {
            const clipDistance = LiveObjectUI.getDistance({ type: "float", value: clipValue, min, max, exponent });
            const clip = $width - clipDistance * $width;
            const hotStop = $width - clip;
            const warmStop = hotStop - 1;
            const gradient = ctx.createLinearGradient(0, 0, $width, 0);
            gradient.addColorStop(0, active ? coldColor : inactiveColdColor);
            gradient.addColorStop(warmStop / $width, active ? warmColor : inactiveWarmColor);
            gradient.addColorStop(hotStop / $width, active ? hotColor : inactiveWarmColor);
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
                const distance = LiveObjectUI.getDistance({ type: "float", value: v, min, max, exponent });
                if (distance > 0) ctx.fillRect(0, $top, Math.min(warmStop, distance * $width), $height);
                if (distance > clipDistance) ctx.fillRect(hotStop, $top, Math.min(clip, (distance - clipDistance) * $width), $height);
                const histMax = this.maxValues[i];
                if (typeof histMax === "number" && histMax > v) {
                    const histDistance = LiveObjectUI.getDistance({ type: "float", value: histMax, min, max, exponent });
                    if (histDistance <= clipDistance) ctx.fillRect(histDistance * $width, $top, 1, $height);
                    else ctx.fillRect(Math.min($width - 1, histDistance * $width), $top, 1, $height);
                }
                $top += $height + 1;
            });
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = triBorderColor;
        const triOrigin: [number, number] = [
            $width * distance,
            metersThick + lineWidth
        ];
        ctx.beginPath();
        ctx.moveTo(triOrigin[0], triOrigin[1]);
        ctx.lineTo(triOrigin[0] - 4, triOrigin[1] + 8);
        ctx.lineTo(triOrigin[0] + 4, triOrigin[1] + 8);
        ctx.lineTo(triOrigin[0], triOrigin[1]);
        ctx.stroke();

        ctx.fillStyle = this.inTouch ? triOnColor : triColor;
        ctx.fill();
        ctx.restore();
    }
    getValueFromPos(e: PointerDownEvent) {
        const { orientation, type, min, exponent } = this.state;
        const step = type === "enum" ? 1 : (this.state.step || 1);
        const totalPixels = orientation === "vertical" ? this.interactionRect[3] : this.interactionRect[2];
        const stepsCount = this.stepsCount;
        const stepPixels = totalPixels / stepsCount;
        const pixels = orientation === "vertical" ? this.interactionRect[3] - (e.y - this.interactionRect[1]) : e.x - this.interactionRect[0];
        let steps = Math.round(MathUtils.normExp(pixels / totalPixels, exponent) * totalPixels / stepPixels);
        steps = Math.min(stepsCount, Math.max(0, steps));
        if (type === "enum") return steps;
        if (type === "int") return Math.round(steps * step + min);
        return steps * step + min;
    }
    getValueFromDelta(e: PointerDragEvent) {
        const { type, min, max, enums, exponent, orientation } = this.state;
        const step = type === "enum" ? 1 : (this.state.step || 1);
        const totalPixels = orientation === "horizontal" ? this.interactionRect[2] : this.interactionRect[3];
        const stepsCount = this.stepsCount;
        const stepPixels = totalPixels / stepsCount;
        const prevPixels = LiveObjectUI.getDistance({ value: e.prevValue, type, min, max, enums, exponent }) * totalPixels;
        const pixels = prevPixels + (orientation === "horizontal" ? e.x - e.fromX : e.fromY - e.y);
        let steps = Math.round(MathUtils.normExp(pixels / totalPixels, exponent) * totalPixels / stepPixels);
        steps = Math.min(stepsCount, Math.max(0, steps));
        if (type === "enum") return steps;
        if (type === "int") return Math.round(steps * step + min);
        return steps * step + min;
    }
    handlePointerDown = (e: PointerDownEvent) => {
        if (
            e.x < this.interactionRect[0]
            || e.x > this.interactionRect[0] + this.interactionRect[2]
            || e.y < this.interactionRect[1]
            || e.y > this.interactionRect[1] + this.interactionRect[3]
        ) return;
        if (!this.state.relative) {
            const newValue = this.getValueFromPos(e);
            if (newValue !== this.state.value) this.setValueToOutput(newValue);
        }
        this.inTouch = true;
    };
    handlePointerDrag = (e: PointerDragEvent) => {
        if (!this.inTouch) return;
        let newValue;
        if (this.state.relative) newValue = this.getValueFromDelta(e);
        else newValue = this.getValueFromPos(e);
        if (newValue !== this.state.value) this.setValueToOutput(newValue);
    };
    handlePointerUp = () => {
        this.inTouch = false;
    };
    handleKeyDown = (e: React.KeyboardEvent) => {
        if (!this.state.inputBuffer) {
            let addStep = 0;
            if (e.key === "ArrowUp" || e.key === "ArrowRight") addStep = 1;
            if (e.key === "ArrowDown" || e.key === "ArrowLeft") addStep = -1;
            if (addStep !== 0) {
                const newValue = this.object.toValidValue(this.state.value + this.state.step * addStep);
                if (newValue !== this.state.value) this.setValueToOutput(newValue);
            }
        }
        if (e.key.match(/[0-9.-]/)) {
            this.setState({ inputBuffer: this.state.inputBuffer + e.key });
            return;
        }
        if (e.key === "Backspace") {
            this.setState({ inputBuffer: this.state.inputBuffer.slice(0, -1) });
            return;
        }
        if (e.key === "Enter") {
            const newValue = this.object.toValidValue(+this.state.inputBuffer);
            this.setState({ inputBuffer: "" });
            if (newValue !== this.state.value) this.setValueToOutput(newValue);
        }
    };
    handleFocusOut = () => {
        if (this.state.inputBuffer) {
            const newValue = this.object.toValidValue(+this.state.inputBuffer);
            this.setState({ inputBuffer: "" });
            if (newValue !== this.state.value) this.setValueToOutput(newValue);
        }
        this.setState({ focus: false });
    };
}
