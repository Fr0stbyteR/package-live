import type { BaseUIState } from "@jspatcher/jspatcher/src/core/objects/base/BaseUI";
import { React, BaseUI, CanvasUI, MathUtils } from "../sdk";
import type LiveObject from "../objects/base";

export interface PointerDownEvent {
    x: number;
    y: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent;
}

export interface PointerDragEvent {
    prevValue: number;
    x: number;
    y: number;
    fromX: number;
    fromY: number;
    movementX: number;
    movementY: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent;
}

export interface PointerUpEvent {
    x: number;
    y: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent;
}

export interface LiveObjectUIProps {
    value: number;
    min: number;
    max: number;
    step: number;
    type: "float" | "int" | "enum";
    enums: string[];
    active: boolean;
    focus: boolean;
    shortName: string;
    longName: string;
    unitStyle: "int" | "float" | "time" | "hertz" | "decibel" | "%" | "pan" | "semitones" | "midi" | "custom" | "native";
    units: string;
    exponent: number;
    speedLim: number;
    frameRate: number;
}
export interface LiveObjectUIState extends LiveObjectUIProps {}

export const getDisplayValue = (value: number, type: string, unitstyle: string, units: string, enums: string[]) => {
    if (type === "enum") return enums[value];
    if (unitstyle === "int") return value.toFixed(0);
    if (unitstyle === "float") return value.toFixed(2);
    if (unitstyle === "time") return value.toFixed(type === "int" ? 0 : 2) + " ms";
    if (unitstyle === "hertz") return value.toFixed(type === "int" ? 0 : 2) + " Hz";
    if (unitstyle === "decibel") return value.toFixed(type === "int" ? 0 : 2) + " dB";
    if (unitstyle === "%") return value.toFixed(type === "int" ? 0 : 2) + " %";
    if (unitstyle === "pan") return value === 0 ? "C" : (type === "int" ? Math.abs(value) : Math.abs(value).toFixed(2)) + (value < 0 ? " L" : " R");
    if (unitstyle === "semitones") return value.toFixed(type === "int" ? 0 : 2) + " st";
    if (unitstyle === "midi") return MathUtils.toMIDI(value);
    if (unitstyle === "custom") return value.toFixed(type === "int" ? 0 : 2) + " " + units;
    if (unitstyle === "native") return value.toFixed(type === "int" ? 0 : 2);
    return "N/A";
};
export default class LiveObjectUI<T extends LiveObject, S extends Partial<LiveObjectUIState> & Record<string, any> = {}> extends CanvasUI<T, {}, S & LiveObjectUIState & BaseUIState> {
    className: string;
    $changeTimer = -1;
    state: S & LiveObjectUIState & BaseUIState = {
        ...this.state,
        value: this.object.state.value
    };
    handleKeyDown = (e: React.KeyboardEvent) => {};
    handleKeyUp = (e: React.KeyboardEvent) => {};
    private handleTouchStart = (e: React.TouchEvent) => {
        this.canvas.focus();
        const rect = this.canvas.getBoundingClientRect();
        let prevX = e.touches[0].clientX;
        let prevY = e.touches[0].clientY;
        const fromX = prevX - rect.left;
        const fromY = prevY - rect.top;
        const prevValue = this.state.value;
        this.handlePointerDown({ x: fromX, y: fromY, originalEvent: e });
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const clientX = e.changedTouches[0].clientX;
            const clientY = e.changedTouches[0].clientY;
            const movementX = clientX - prevX;
            const movementY = clientY - prevY;
            prevX = clientX;
            prevY = clientY;
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            this.handlePointerDrag({ prevValue, x, y, fromX, fromY, movementX, movementY, originalEvent: e });
        };
        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            const x = e.changedTouches[0].clientX - rect.left;
            const y = e.changedTouches[0].clientY - rect.top;
            this.handlePointerUp({ x, y, originalEvent: e });
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd, { passive: false });
    };
    handleWheel = (e: React.WheelEvent) => {};
    handleClick = (e: React.MouseEvent) => {};
    private handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        this.canvas.focus();
        const rect = this.canvas.getBoundingClientRect();
        const fromX = e.clientX - rect.left;
        const fromY = e.clientY - rect.top;
        const prevValue = this.state.value;
        this.handlePointerDown({ x: fromX, y: fromY, originalEvent: e });
        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handlePointerDrag({ prevValue, x, y, fromX, fromY, movementX: e.movementX, movementY: e.movementY, originalEvent: e });
        };
        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handlePointerUp({ x, y, originalEvent: e });
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };
    handleMouseOver = (e: React.MouseEvent) => {};
    handleMouseOut = (e: React.MouseEvent) => {};
    handleContextMenu = (e: React.MouseEvent) => {};
    handlePointerDown = (e: PointerDownEvent) => {};
    handlePointerDrag = (e: PointerDragEvent) => {};
    handlePointerUp = (e: PointerUpEvent) => {};
    handleFocusIn = (e: React.FocusEvent) => this.setState({ focus: true });
    handleFocusOut = (e: React.FocusEvent) => this.setState({ focus: false });
    /**
     * Normalized value between 0 - 1.
     */
    get distance() {
        return LiveObjectUI.getDistance(this.state);
    }
    static getDistance(state: { type: "enum" | "int" | "float"; value: number; min: number; max: number; exponent: number; enums?: string[] }) {
        const { type, max, min, value, exponent, enums } = state;
        const normalized = type === "enum" ? Math.max(0, Math.min(enums.length - 1, value)) / (enums.length - 1) : (Math.max(min, Math.min(max, value)) - min) / (max - min);
        return MathUtils.iNormExp(normalized || 0, exponent);
    }
    /**
     * Count steps in range min-max with step
     */
    get stepsCount() {
        const { type, max, min, step, enums } = this.state;
        if (type === "enum") return enums.length - 1;
        if (type === "float") return Math.min(Number.MAX_SAFE_INTEGER, Math.floor((max - min) / step));
        return Math.min(Math.floor((max - min) / (Math.round(step) || 1)), max - min);
    }
    get displayValue() {
        const { value, type, unitStyle, units, enums } = this.state;
        return getDisplayValue(value, type, unitStyle, units, enums);
    }
    setValueToOutput(value: number) {
        this.setState({ value });
        this.scheduleChangeHandler();
    }
    changeCallback = () => {
        this.props.object.onChangeFromUI({ value: this.state.value, displayValue: this.displayValue });
        this.$changeTimer = -1;
    };
    scheduleChangeHandler() {
        if (this.$changeTimer === -1) this.$changeTimer = window.setTimeout(this.changeCallback, this.state.speedLim);
    }
    paint() {}
    render() {
        return (
            <BaseUI {...this.props}>
                <canvas
                    ref={this.refCanvas}
                    className={["live-component", this.className].join(" ")}
                    style={{ position: "absolute", display: "inline-block", width: "100%", height: "100%" }}
                    tabIndex={1}
                    onKeyDown={this.handleKeyDown}
                    onKeyUp={this.handleKeyUp}
                    onTouchStart={this.handleTouchStart}
                    onWheel={this.handleWheel}
                    onClick={this.handleClick}
                    onMouseDown={this.handleMouseDown}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}
                    onContextMenu={this.handleContextMenu}
                    onFocus={this.handleFocusIn}
                    onBlur={this.handleFocusOut}
                    {...this.props.canvasProps}
                />
            </BaseUI>
        );
    }
}