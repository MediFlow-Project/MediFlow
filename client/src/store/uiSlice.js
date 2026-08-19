import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    toast: null,
  },
  reducers: {
    showToast(state, action) {
      state.toast = {
        type: action.payload.type || "info",
        message: action.payload.message,
      };
    },
    hideToast(state) {
      state.toast = null;
    },
  },
});

export const { showToast, hideToast } = uiSlice.actions;
export default uiSlice.reducer;
