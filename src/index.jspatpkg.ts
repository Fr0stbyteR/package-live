import LiveNumbox from "./objects/numbox";
import LiveButton from "./objects/button";
import LiveDial from "./objects/dial";
import LiveSlider from "./objects/slider";
import LiveTab from "./objects/tab";
import LiveToggle from "./objects/toggle";
import LiveText from "./objects/text";
import LiveMeter from "./objects/meter";
import LiveGain from "./objects/gain";

export default async () => ({
    numbox: LiveNumbox,
    button: LiveButton,
    dial: LiveDial,
    slider: LiveSlider,
    tab: LiveTab,
    toggle: LiveToggle,
    text: LiveText,
    "meter~": LiveMeter,
    "gain~": LiveGain
});