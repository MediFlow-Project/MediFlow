import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import appointmentsReducer from "./appointmentsSlice";
import queueReducer from "./queueSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentsReducer,
    queue: queueReducer,
    ui: uiReducer,
  },
});
