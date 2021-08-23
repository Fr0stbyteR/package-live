import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { MathUtils } from "../sdk";
import LiveObjectUI, { LiveObjectUIState, PointerDownEvent, PointerDragEvent } from "./base";
import type LiveSlider from "../objects/slider";
import type { LiveSliderProps } from "../objects/slider";

export interface LiveSliderUIState extends LiveSliderProps, LiveObjectUIState {
    inputBuffer: string;
}
export default class LiveSliderUI extends LiveObjectUI<LiveSlider, LiveSliderUIState> {
    static defaultSize: [number, number] = [120, 45];
    state: LiveSliderUIState & BaseUIState = {
        ...this.state,
        inputBuffer: ""
    };
    className = "live-slider";
    interactionRect: number[] = [0, 0, 0, 0];
    inTouch = false;
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
            sliderColor,
            textColor,
            triBorderColor,
            triOnColor,
            triColor,
            shortName,
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

        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = sliderColor;

        if (orientation === "vertical") {
            ctx.beginPath();
            ctx.moveTo(width * 0.5, fontSize + padding);
            ctx.lineTo(width * 0.5, height - (fontSize + padding));
            ctx.stroke();

            const interactionWidth = width * 0.5;
            this.interactionRect = [
                width * 0.5 - interactionWidth * 0.5,
                fontSize + padding,
                interactionWidth,
                height - 2 * (fontSize + padding)
            ];

            ctx.lineWidth = 1;
            ctx.strokeStyle = triBorderColor;
            const triOrigin: [number, number] = [
                width * 0.5 + lineWidth * 0.5 + 0.5,
                this.interactionRect[1] - 4 + this.interactionRect[3] * (1 - distance)
            ];
            ctx.beginPath();
            ctx.moveTo(triOrigin[0], triOrigin[1] + 4);
            ctx.lineTo(triOrigin[0] + 8, triOrigin[1]);
            ctx.lineTo(triOrigin[0] + 8, triOrigin[1] + 8);
            ctx.lineTo(triOrigin[0], triOrigin[1] + 4);
            ctx.stroke();

            ctx.fillStyle = this.inTouch ? triOnColor : triColor;
            ctx.fill();

            ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillStyle = textColor;
            if (showName) ctx.fillText(shortName, width * 0.5, fontSize, width);
            if (showNumber) ctx.fillText(displayValue, width * 0.5, height - 2, width);
        } else {
            ctx.beginPath();
            ctx.moveTo(padding, height * 0.5);
            ctx.lineTo(width - padding, height * 0.5);
            ctx.stroke();

            const interactionWidth = height * 0.5;
            this.interactionRect = [
                padding,
                height * 0.5 - interactionWidth * 0.5,
                width - 2 * padding,
                interactionWidth
            ];

            ctx.lineWidth = 1;
            ctx.strokeStyle = triBorderColor;
            const triOrigin: [number, number] = [
                this.interactionRect[0] + this.interactionRect[2] * distance - 4,
                height * 0.5 + lineWidth * 0.5 + 2
            ];
            ctx.beginPath();
            ctx.moveTo(triOrigin[0], triOrigin[1] + 8);
            ctx.lineTo(triOrigin[0] + 4, triOrigin[1]);
            ctx.lineTo(triOrigin[0] + 8, triOrigin[1] + 8);
            ctx.lineTo(triOrigin[0], triOrigin[1] + 8);
            ctx.stroke();

            ctx.fillStyle = this.inTouch ? triOnColor : triColor;
            ctx.fill();

            ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillStyle = textColor;
            if (showName) ctx.fillText(shortName, width * 0.5, fontSize, width);
            ctx.textAlign = "left";
            if (showNumber) ctx.fillText(displayValue, 4, height - 2, width);
        }
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
