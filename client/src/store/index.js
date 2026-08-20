import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import appointmentsReducer from "./appointmentsSlice";
import queueReducer from "./queueSlice";
import chatReducer from "./chatSlice";
import notificationsReducer from "./notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentsReducer,
    queue: queueReducer,
    chat: chatReducer,
    notifications: notificationsReducer,
  },
});
