import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";
import { logout } from "./authSlice";

export const fetchNotifications = createAsyncThunk(
  "notifications/list",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get("/notifications");
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/read",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await http.post(`/notifications/${id}/read`);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/readAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.post("/notifications/read-all");
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    status: "idle",
  },
  reducers: {
    receiveNotification(state, action) {
      const incoming = action.payload;
      if (!incoming?.id) return;
      if (state.items.some((item) => Number(item.id) === Number(incoming.id))) return;
      state.items.unshift(incoming);
      if (!incoming.readAt) state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload?.items || [];
        state.unreadCount = Number(action.payload?.unreadCount) || 0;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = "idle";
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map((item) =>
          Number(item.id) === Number(updated.id) ? { ...item, ...updated } : item
        );
        state.unreadCount = state.items.filter((item) => !item.readAt).length;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        const readAt = action.payload?.readAt || new Date().toISOString();
        state.items = state.items.map((item) => ({ ...item, readAt: item.readAt || readAt }));
        state.unreadCount = 0;
      })
      .addCase(logout, (state) => {
        state.items = [];
        state.unreadCount = 0;
        state.status = "idle";
      });
  },
});

export const { receiveNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
