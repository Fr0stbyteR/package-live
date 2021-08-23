import LiveObjectUI, { LiveObjectUIState } from "./base";
import type LiveButton from "../objects/button";
import type { LiveButtonProps } from "../objects/button";

export interface LiveButtonUIState extends Omit<Required<LiveButtonProps>, "transition">, LiveObjectUIState {}

export default class LiveButtonUI extends LiveObjectUI<LiveButton, LiveButtonUIState> {
    static defaultSize: [number, number] = [30, 30];
    className = "live-button";
    inTouch = false;
    $resetTimer = -1;
    resetCallback = () => {
        this.setValueToOutput(0);
        this.$resetTimer = -1;
    };
    paint() {
        if (this.$resetTimer !== -1) {
            window.clearTimeout(this.$resetTimer);
            this.resetCallback();
        }
        const {
            // width,
            // height,
            active,
            focus,
            bgColor,
            activeBgColor,
            bgOnColor,
            activeBgOnColor,
            borderColor,
            focusBorderColor,
            value
        } = this.state;
        const ctx = this.ctx;
        if (!ctx) return;
        const borderWidth = 1;

        const [width, height] = this.fullSize();
        ctx.clearRect(0, 0, width, height);

        ctx.lineWidth = borderWidth;
        const buttonBgColor = active ? (value ? activeBgOnColor : activeBgColor) : (value ? bgOnColor : bgColor);
        const buttonBorderColor = focus ? focusBorderColor : borderColor;

        ctx.fillStyle = buttonBgColor;
        ctx.beginPath();
        ctx.ellipse(width * 0.5, height * 0.5, width * 0.5 - 2 * borderWidth, height * 0.5 - 2 * borderWidth, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = buttonBorderColor;
        ctx.stroke();

        if (value && !this.inTouch) this.$resetTimer = window.setTimeout(this.resetCallback, 100);
    }
    handlePointerDown = () => {
        this.inTouch = true;
        this.setValueToOutput(1);
    };
    handlePointerUp = () => {
        this.inTouch = false;
        this.setValueToOutput(0);
    };
}
