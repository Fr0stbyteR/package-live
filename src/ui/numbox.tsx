import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { MathUtils } from "../sdk";
import LiveObjectUI, { LiveObjectUIState, PointerDragEvent } from "./base";
import type LiveNumbox from "../objects/numbox";
import type { LiveNumboxProps } from "../objects/numbox";

export interface LiveNumboxUIState extends LiveNumboxProps, LiveObjectUIState {
    inputBuffer: string;
}
export default class LiveNumboxUI extends LiveObjectUI<LiveNumbox, LiveNumboxUIState> {
    state: LiveNumboxUIState & BaseUIState = {
        ...this.state,
        inputBuffer: ""
    };
    className = "live-numbox";
    paint() {
        const {
            // width,
            // height,
            active,
            focus,
            fontFamily,
            fontSize,
            fontFace,
            appearance,
            bgColor,
            activeBgColor,
            borderColor,
            focusBorderColor,
            textColor,
            triColor,
            activeTriColor,
            triColor2,
            activeTriColor2,
            activeSliderColor,
            inputBuffer
        } = this.state;
        const ctx = this.ctx;
        if (!ctx) return;
        const distance = this.distance;
        const displayValue = inputBuffer ? inputBuffer + "_" : this.displayValue;

        const [width, height] = this.fullSize();
        ctx.clearRect(0, 0, width, height);

        // draw background
        ctx.fillStyle = active ? activeBgColor : bgColor;
        ctx.rect(0, 0, width, height);
        ctx.fill();

        if (appearance === "slider" && active && distance) {
            ctx.fillStyle = activeSliderColor;
            ctx.fillRect(0, 0, distance * width, height);
        }

        // draw border (eventually we might need to redefine the shape)
        ctx.lineWidth = 1;
        ctx.strokeStyle = focus ? focusBorderColor : borderColor;
        ctx.stroke();

        if (appearance === "triangle") {
            const triangleHeight = 8;
            ctx.fillStyle = active ? (distance ? activeTriColor2 : activeTriColor) : (distance ? triColor2 : triColor);
            ctx.beginPath();
            ctx.moveTo(width - triangleHeight - 1, height * 0.5);
            ctx.lineTo(width - 1, 1);
            ctx.lineTo(width - 1, height - 1);
            ctx.closePath();
            ctx.fill();
        }
        // display the text
        ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(displayValue, width * 0.5, height * 0.5, width);
    }
    getValueFromDelta(e: PointerDragEvent) {
        const { type, min, max, enums, exponent } = this.state;
        const step = type === "enum" ? 1 : (this.state.step || 1);
        const totalPixels = 100;
        const stepsCount = this.stepsCount;
        const stepPixels = totalPixels / stepsCount;
        const prevPixels = LiveObjectUI.getDistance({ value: e.prevValue, type, min, max, enums, exponent }) * totalPixels;
        const pixels = prevPixels + e.fromY - e.y;
        let steps = Math.round(MathUtils.normExp(pixels / totalPixels, exponent) * totalPixels / stepPixels);
        steps = Math.min(stepsCount, Math.max(0, steps));
        if (type === "enum") return steps;
        if (type === "int") return Math.round(steps * step + min);
        return steps * step + min;
    }
    handlePointerDrag = (e: PointerDragEvent) => {
        const newValue = this.getValueFromDelta(e);
        if (newValue !== this.state.value) this.setValueToOutput(newValue);
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
