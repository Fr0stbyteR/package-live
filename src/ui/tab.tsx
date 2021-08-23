import type { TRect } from "@jspatcher/jspatcher/src/core/types";
import LiveObjectUI, { LiveObjectUIState, PointerDownEvent, PointerDragEvent } from "./base";
import type LiveTab from "../objects/tab";
import type { LiveTabProps } from "../objects/tab";

export interface LiveTabUIState extends LiveTabProps, LiveObjectUIState {}
export default class LiveTabUI extends LiveObjectUI<LiveTab, LiveTabUIState> {
    static defaultSize: [number, number] = [120, 15];
    className = "live-tab";
    tabRects: TRect[] = [];
    inTouch = false;
    getTabRects(width: number, height: number) {
        const {
            // width,
            // height,
            multiline,
            mode,
            enums,
            spacingX: spacingXIn,
            spacingY: spacingYIn
        } = this.state;
        const margin = 4;
        const minHeight = 10;
        const count = enums.length;
        let countPerLine = count;
        let lines = 1;
        let step = height / lines;
        let interval = 0;
        let rectWidth = 0;
        const spacingX = spacingXIn * 0.5;
        const spacingY = spacingYIn * 0.5;

        if (multiline && height >= 2 * minHeight) {
            lines = Math.max(1, Math.min(count, Math.floor(height / minHeight)));
            countPerLine = Math.ceil(count / lines);
            // if there's not enough height, increase the number of tabs per row
            while (lines * countPerLine < count) {
                countPerLine++;
                if (lines > 1) lines--;
            }
            // if there's extra height, reduce the number of rows
            while (lines * countPerLine > count && (lines - 1) * countPerLine >= count) {
                lines--;
            }
            step = height / lines;
        }
        if (mode === "equal") {
            interval = width / countPerLine;
            rectWidth = interval - spacingX;
            for (let i = 0; i < count; i++) {
                this.tabRects[i] = [
                    (i % countPerLine) * interval + spacingX * 0.5,
                    Math.floor(i / countPerLine) * step + spacingY * 0.5,
                    rectWidth,
                    (height / lines) - spacingY
                ];
            }
        } else {
            const textWidths = [];
            for (let i = 0; i < lines; i++) {
                let total = 0;
                let space = width;
                for (let j = i * countPerLine; j < Math.min((i + 1) * countPerLine, count); j++) {
                    const textDimensions = this.ctx.measureText(enums[j]);
                    textWidths[j] = textDimensions.width;
                    total += textWidths[j];
                    space -= 2 * margin + spacingX;
                }
                let used = 0;
                for (let j = i * countPerLine; j < Math.min((i + 1) * countPerLine, count); j++) {
                    const rectSpace = textWidths[j] / total;
                    this.tabRects[j] = [
                        used + spacingX * 0.5,
                        i * step + spacingY * 0.5,
                        space * rectSpace + 2 * margin,
                        height / lines - spacingY
                    ];
                    used += this.tabRects[j][2] + spacingX;
                }
            }
        }
        return this.tabRects;
    }
    paint() {
        const {
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
            enums,
            value
        } = this.state;
        const ctx = this.ctx;
        if (!ctx) return;
        const [width, height] = this.fullSize();
        const tabRects = this.getTabRects(width, height);

        const borderWidth = 0.5;

        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = borderWidth;

        const buttonBorderColor = focus ? focusBorderColor : borderColor;
        for (let i = 0; i < enums.length; i++) {
            const buttonBgColor = active ? (value === i ? activeBgOnColor : activeBgColor) : (value === i ? bgOnColor : bgColor);
            ctx.fillStyle = buttonBgColor;
            ctx.beginPath();
            ctx.rect(...tabRects[i]);
            ctx.fill();
            ctx.strokeStyle = buttonBorderColor;
            ctx.stroke();

            ctx.font = `${fontFace === "regular" ? "" : fontFace} ${fontSize}px ${fontFamily}, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = active ? (value === i ? activeTextOnColor : activeTextColor) : (value === i ? textOnColor : textColor);
            ctx.fillText(enums[i], tabRects[i][0] + tabRects[i][2] * 0.5, tabRects[i][1] + tabRects[i][3] * 0.5);
        }
    }
    handlePointerDown = (e: PointerDownEvent) => {
        this.inTouch = true;
        for (let i = 0; i < this.tabRects.length; i++) {
            const rect = this.tabRects[i];
            if (e.x >= rect[0] && e.x <= rect[2] + rect[0] && e.y >= rect[1] && e.y <= rect[3] + rect[1]) {
                this.setValueToOutput(i);
                return;
            }
        }
    };
    handlePointerDrag = (e: PointerDragEvent) => {
        this.handlePointerDown(e);
    };
    handleKeyDown = (e: React.KeyboardEvent) => {
        let addStep = 0;
        if (e.key === "ArrowUp" || e.key === "ArrowRight") addStep = 1;
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") addStep = -1;
        if (addStep !== 0) {
            const newValue = this.object.toValidValue(this.state.value + this.state.step * addStep);
            if (newValue !== this.state.value) this.setValueToOutput(newValue);
        }
    };
}
