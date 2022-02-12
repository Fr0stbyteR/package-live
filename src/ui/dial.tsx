import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { MathUtils, Utils } from "../sdk";
import LiveObjectUI, { LiveObjectUIState, PointerDownEvent, PointerDragEvent } from "./base";
import type LiveDial from "../objects/dial";
import type { LiveDialProps } from "../objects/dial";

export interface LiveDialUIState extends LiveDialProps, LiveObjectUIState {
    inputBuffer: string;
}
export default class LiveDialUI extends LiveObjectUI<LiveDial, LiveDialUIState> {
    static defaultSize: [number, number] = [45, 60];
    state: LiveDialUIState & BaseUIState = {
        ...this.state,
        inputBuffer: ""
    };
    className = "live-dial";
    interactionRect = [0, 0, 0, 0];
    inTouch = false;
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
            triangle,
            showName,
            showNumber,
            borderColor,
            focusBorderColor,
            panelColor,
            activeNeedleColor,
            needleColor,
            activeDialColor,
            dialColor,
            textColor,
            triBorderColor,
            triColor,
            shortName,
            inputBuffer
        } = this.state;
        const ctx = this.ctx;
        if (!ctx) return;
        const distance = this.distance;
        const displayValue = inputBuffer ? inputBuffer + "_" : this.displayValue;

        const [width, height] = this.fullSize();
        ctx.clearRect(0, 0, width, height);

        const triangleHeight = 4;
        const triangleLineWidth = 0.6;

        let start: number;
        let end: number;
        let valPos: number;
        let dialHeight: number;

        if (appearance === "tiny") {
            dialHeight = Math.min(width, height) / 3;
            start = -3 * Math.PI * 0.5;
            end = 0;
            valPos = start + MathUtils.toRad(this.distance * 270);
        } else {
            dialHeight = Math.min(width, height) / 2;
            start = Math.PI - 3 * Math.PI / 8;
            end = 2 * Math.PI + 3 * Math.PI / 8;
            valPos = start + MathUtils.toRad(this.distance * 315);
        }
        const dialRadius = dialHeight * 0.5;

        let dialCenterX = width * 0.5;
        let dialCenterY = height * 0.5 + 1;
        if (appearance === "panel") {
            dialCenterY += 10;
        } else if (appearance === "vertical") {
            if (showNumber) dialCenterY -= fontSize - 5;
            if (showName) dialCenterY += fontSize - 5;
            if (triangle) dialCenterY += triangleHeight - 1;
        } else if (appearance === "tiny") {
            if (showName) {
                dialCenterY += 6;
                dialCenterX = 10;
            }
        }
        this.interactionRect = [0, dialCenterY - dialHeight * 0.5, width, dialHeight];
        const arcStartX = dialCenterX + (dialHeight * 0.5 * Math.cos(start));
        const arcStartY = dialCenterY + (dialHeight * 0.5 * Math.sin(start));
        const arcEndX = dialCenterX + (dialHeight * 0.5 * Math.cos(end));
        const arcEndY = dialCenterY + (dialHeight * 0.5 * Math.sin(end));
        const valuePosX = dialCenterX + (dialHeight * 0.5 * Math.cos(valPos));
        const valuePosY = dialCenterY + (dialHeight * 0.5 * Math.sin(valPos));
        const endCapRadius = 1;
        const lineWidth = 2;
        let panelOffset = 0;

        if (appearance === "panel") {
            panelOffset = 5;
            ctx.strokeStyle = focus ? focusBorderColor : borderColor;
            ctx.lineWidth = 0.4;
            Utils.roundedRect(ctx, 1, 1, width - 2, height - 2, 5);
            ctx.fillStyle = panelColor;
            Utils.fillRoundedRect(ctx, 1.2, 1.2, width - 2.4, 30 - 0.4, [5, 5, 0, 0]);
        }

        ctx.strokeStyle = active ? activeNeedleColor : needleColor;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = lineWidth;
        // draw background arc endcaps
        ctx.beginPath();
        ctx.arc(arcStartX, arcStartY, endCapRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(arcEndX, arcEndY, endCapRadius, 0, 2 * Math.PI);
        ctx.fill();
        // draw background arc
        ctx.beginPath();
        ctx.arc(dialCenterX, dialCenterY, dialRadius, start, end);
        ctx.stroke();

        // draw value arc, which changes if triangle is enabled
        ctx.strokeStyle = active ? activeDialColor : dialColor;
        ctx.fillStyle = ctx.strokeStyle;
        if (triangle) {
            const midpoint = (start + end) * 0.5;
            ctx.strokeStyle = active ? activeDialColor : dialColor;
            ctx.beginPath();
            if (distance > 0.5) ctx.arc(dialCenterX, dialCenterY, dialRadius, midpoint, valPos);
            else ctx.arc(dialCenterX, dialCenterY, dialRadius, valPos, midpoint);
            ctx.stroke();
        } else {
            // draw value arc endcap
            ctx.beginPath();
            ctx.arc(arcStartX, arcStartY, endCapRadius, 0, 2 * Math.PI);
            ctx.fill();
            // draw value arc
            ctx.beginPath();
            ctx.arc(dialCenterX, dialCenterY, dialRadius, start, valPos);
            ctx.stroke();
        }
        // draw dial
        // draw dial round endcaps
        ctx.strokeStyle = active ? activeNeedleColor : needleColor;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(dialCenterX, dialCenterY, endCapRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(valuePosX, valuePosY, endCapRadius, 0, 2 * Math.PI);
        ctx.fill();
        // draw dial line
        ctx.beginPath();
        ctx.moveTo(dialCenterX, dialCenterY);
        ctx.lineTo(valuePosX, valuePosY);
        ctx.stroke();
        // add text if it is enabled
        ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;
        ctx.fillStyle = textColor;
        if (showName) {
            if (appearance === "tiny") {
                ctx.textAlign = "left";
                ctx.fillText(shortName, 0, panelOffset + fontSize, width);
            } else {
                ctx.textAlign = "center";
                ctx.fillText(shortName, width * 0.5, panelOffset + fontSize, width);
            }
        }
        if (showNumber) {
            const tinyOffset = appearance === "tiny" ? 12 : 0;
            if (appearance === "tiny") {
                ctx.textAlign = "left";
                ctx.fillText(displayValue, tinyOffset, height - 2, width);
            } else {
                ctx.textAlign = "center";
                ctx.fillText(displayValue, width * 0.5, height - 2, width);
            }
        }
        // draw triangle if it is enabled
        if (triangle) {
            if (!distance) ctx.fillStyle = triColor;
            else if (!active) ctx.fillStyle = dialColor;
            else ctx.fillStyle = activeDialColor;
            ctx.beginPath();
            if (appearance === "tiny") {
                const tipPositionX = dialCenterX + dialHeight * 0.5 * Math.cos(-3 * Math.PI / 4) - 1;
                const tipPositionY = dialCenterY + dialHeight * 0.5 * Math.sin(-3 * Math.PI / 4) - 1;
                ctx.moveTo(tipPositionX, tipPositionY);
                ctx.lineTo(tipPositionX - triangleHeight, tipPositionY);
                ctx.lineTo(tipPositionX, tipPositionY - triangleHeight);
                ctx.lineTo(tipPositionX, tipPositionY);
            } else {
                ctx.moveTo(dialCenterX, dialCenterY - dialRadius - 1);
                ctx.lineTo(dialCenterX - triangleHeight, dialCenterY - dialRadius - 1 - triangleHeight);
                ctx.lineTo(dialCenterX + triangleHeight, dialCenterY - dialRadius - 1 - triangleHeight);
                ctx.lineTo(dialCenterX, dialCenterY - dialRadius - 1);
            }
            ctx.fill();
            ctx.strokeStyle = triBorderColor || "transparent";
            ctx.lineWidth = triangleLineWidth;
            ctx.stroke();
        }
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
    handlePointerDown = (e: PointerDownEvent) => {
        if (
            e.x < this.interactionRect[0]
            || e.x > this.interactionRect[0] + this.interactionRect[2]
            || e.y < this.interactionRect[1]
            || e.y > this.interactionRect[1] + this.interactionRect[3]
        ) return;
        this.inTouch = true;
    };
    handlePointerDrag = (e: PointerDragEvent) => {
        if (!this.inTouch) return;
        const newValue = this.getValueFromDelta(e);
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
