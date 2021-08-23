import { Utils } from "../sdk";
import LiveObjectUI, { LiveObjectUIState, PointerDownEvent } from "./base";
import type LiveText from "../objects/text";
import type { LiveTextProps } from "../objects/text";

export interface LiveTextUIState extends LiveTextProps, LiveObjectUIState {}
export default class LiveTextUI extends LiveObjectUI<LiveText, LiveTextUIState> {
    className = "live-text";
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
            activeBgColor,
            activeBgOnColor,
            bgColor,
            bgOnColor,
            borderColor,
            focusBorderColor,
            textColor,
            textOnColor,
            activeTextColor,
            activeTextOnColor,
            mode,
            text,
            textOn,
            value
        } = this.state;
        const ctx = this.ctx;
        if (!ctx) return;

        const borderWidth = 0.5;

        const [width, height] = this.fullSize();
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = borderWidth;

        const buttonBgColor = active ? (value ? activeBgOnColor : activeBgColor) : (value ? bgOnColor : bgColor);
        const buttonBorderColor = focus ? focusBorderColor : borderColor;

        ctx.fillStyle = buttonBgColor;
        if (mode === "button") {
            Utils.fillRoundedRect(ctx, 0.5, 0.5, width - 1, height - 1, height * 0.5 - 1);
        } else {
            ctx.beginPath();
            ctx.rect(0.5, 0.5, width - 1, height - 1);
            ctx.fill();
        }
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = buttonBorderColor;
        ctx.stroke();

        ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = active ? (value ? activeTextOnColor : activeTextColor) : (value ? textOnColor : textColor);
        ctx.fillText(value && mode === "toggle" ? textOn : text, width * 0.5, height * 0.5);
    }
    handlePointerDown = (e: PointerDownEvent) => {
        const { value, mode } = this.state;
        this.inTouch = true;
        this.setValueToOutput(mode === "button" ? 1 : 1 - +!!value);
    };
    handlePointerUp = () => {
        const { mode } = this.state;
        this.inTouch = false;
        if (mode === "button") this.setValueToOutput(0);
    };
}
