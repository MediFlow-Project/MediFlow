import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";

export const fetchInbox = createAsyncThunk("chat/inbox", async (_, { rejectWithValue }) => {
  try {
    const { data } = await http.get("/chats");
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchMessages = createAsyncThunk(
  "chat/messages",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const { data } = await http.get(`/appointments/${appointmentId}/messages`);
      return { appointmentId: Number(appointmentId), messages: data };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/send",
  async ({ appointmentId, body }, { rejectWithValue }) => {
    try {
      const { data } = await http.post(`/appointments/${appointmentId}/messages`, { body });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const markChatRead = createAsyncThunk(
  "chat/read",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const { data } = await http.post(`/appointments/${appointmentId}/messages/read`);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    inbox: [],
    inboxStatus: "idle",
    appointmentId: null,
    messages: [],
    status: "idle",
    sending: false,
    error: null,
    counterpartTyping: false,
    counterpartLastReadAt: null,
  },
  reducers: {
    receiveMessage(state, action) {
      const incoming = action.payload;
      if (!incoming?.id) return;
      if (Number(incoming.appointmentId) !== Number(state.appointmentId)) return;
      if (state.messages.some((item) => item.id === incoming.id)) return;
      state.messages.push(incoming);
    },
    setCounterpartTyping(state, action) {
      const { appointmentId, isTyping } = action.payload;
      if (Number(appointmentId) !== Number(state.appointmentId)) return;
      state.counterpartTyping = Boolean(isTyping);
    },
    setCounterpartRead(state, action) {
      const { appointmentId, lastReadAt } = action.payload;
      if (Number(appointmentId) !== Number(state.appointmentId)) return;
      state.counterpartLastReadAt = lastReadAt || null;
    },
    clearChatThread(state) {
      state.appointmentId = null;
      state.messages = [];
      state.status = "idle";
      state.sending = false;
      state.error = null;
      state.counterpartTyping = false;
      state.counterpartLastReadAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInbox.pending, (state) => {
        state.inboxStatus = "loading";
      })
      .addCase(fetchInbox.fulfilled, (state, action) => {
        state.inboxStatus = "idle";
        state.inbox = action.payload;
      })
      .addCase(fetchInbox.rejected, (state) => {
        state.inboxStatus = "idle";
      })
      .addCase(fetchMessages.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.appointmentId = Number(action.meta.arg);
        state.counterpartTyping = false;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = "idle";
        state.appointmentId = action.payload.appointmentId;
        state.messages = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        if (!state.messages.some((item) => item.id === action.payload.id)) {
          state.messages.push(action.payload);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload;
      })
      .addCase(markChatRead.fulfilled, (state, action) => {
        state.inbox = state.inbox.map((thread) =>
          Number(thread.appointmentId) === Number(action.payload.appointmentId)
            ? { ...thread, unreadCount: 0 }
            : thread
        );
      });
  },
});

export const { receiveMessage, setCounterpartTyping, setCounterpartRead, clearChatThread } =
  chatSlice.actions;
export default chatSlice.reducer;
