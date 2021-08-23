import LiveObjectUI, { LiveObjectUIState } from "./base";
import type LiveToggle from "../objects/toggle";
import type { LiveToggleProps } from "../objects/toggle";

export interface LiveToggleUIState extends LiveToggleProps, LiveObjectUIState {}
export default class LiveToggleUI extends LiveObjectUI<LiveToggle, LiveToggleUIState> {
    static defaultSize: [number, number] = [30, 30];
    className = "live-toggle";
    paint() {
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
        ctx.rect(borderWidth, borderWidth, width - 2 * borderWidth, height - 2 * borderWidth);
        ctx.fill();
        ctx.strokeStyle = buttonBorderColor;
        ctx.stroke();
    }
    handlePointerDown = () => {
        this.setValueToOutput(1 - +!!this.state.value);
    };
}
