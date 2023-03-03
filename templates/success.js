import { go as fail } from "./fail.js";
export const go = () => {
    if (window.buffer.length !== 0) {
        fail();
    } else {
        alert("Yep!");
    }
}