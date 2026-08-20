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
      const messages = Array.isArray(data) ? data : data?.messages || [];
      const flagged = messages.map((item) => ({
        ...item,
        read: Boolean(item.read),
      }));
      const fromFlags = flagged.reduce(
        (max, item) => (item.read ? Math.max(max, Number(item.id) || 0) : max),
        0
      );
      const fromField = Number(
        Array.isArray(data) ? 0 : data?.counterpartLastReadMessageId
      );
      const counterpartLastReadMessageId =
        (Number.isInteger(fromField) && fromField > 0 && fromField) ||
        fromFlags ||
        null;
      return {
        appointmentId: Number(appointmentId),
        messages: flagged,
        counterpartLastReadAt: Array.isArray(data)
          ? null
          : data?.counterpartLastReadAt || null,
        counterpartLastReadMessageId,
      };
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

function threadTime(thread) {
  return thread?.lastMessage?.createdAt || thread?.date || "";
}

function sortInboxByRecent(inbox) {
  return [...inbox].sort((a, b) => String(threadTime(b)).localeCompare(String(threadTime(a))));
}

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
    counterpartLastReadMessageId: null,
  },
  reducers: {
    receiveMessage(state, action) {
      const incoming = action.payload;
      if (!incoming?.id) return;
      if (Number(incoming.appointmentId) !== Number(state.appointmentId)) return;
      if (state.messages.some((item) => item.id === incoming.id)) return;
      state.messages.push(incoming);
    },
    applyInboxMessage(state, action) {
      const { appointmentId, message, senderName, myUserId } = action.payload || {};
      if (!message?.id || !appointmentId) return;
      const threadId = Number(appointmentId);
      const index = state.inbox.findIndex(
        (thread) => Number(thread.appointmentId) === threadId
      );
      if (index < 0) return;
      const thread = state.inbox[index];
      if (Number(thread.lastMessage?.id) === Number(message.id)) return;

      const isOwn = Number(message.senderId) === Number(myUserId);
      const threadOpen = Number(state.appointmentId) === threadId;
      state.inbox[index] = {
        ...thread,
        counterpartName: thread.counterpartName || senderName || "Percakapan",
        lastMessage: {
          id: message.id,
          senderId: message.senderId,
          body: message.body,
          createdAt: message.createdAt,
        },
        unreadCount:
          isOwn || threadOpen ? thread.unreadCount || 0 : (thread.unreadCount || 0) + 1,
        typing: false,
      };
      state.inbox = sortInboxByRecent(state.inbox);
    },
    setInboxTyping(state, action) {
      const { appointmentId, isTyping } = action.payload || {};
      const threadId = Number(appointmentId);
      if (!threadId) return;
      state.inbox = state.inbox.map((thread) =>
        Number(thread.appointmentId) === threadId
          ? { ...thread, typing: Boolean(isTyping) }
          : thread
      );
    },
    setCounterpartTyping(state, action) {
      const { appointmentId, isTyping } = action.payload;
      if (Number(appointmentId) !== Number(state.appointmentId)) return;
      state.counterpartTyping = Boolean(isTyping);
    },
    setCounterpartRead(state, action) {
      const { appointmentId, lastReadAt, lastReadMessageId } = action.payload;
      if (Number(appointmentId) !== Number(state.appointmentId)) return;
      if (
        lastReadAt &&
        (!state.counterpartLastReadAt ||
          new Date(lastReadAt) > new Date(state.counterpartLastReadAt))
      ) {
        state.counterpartLastReadAt = lastReadAt;
      }
      const nextId = Number(lastReadMessageId);
      if (Number.isInteger(nextId) && nextId > 0) {
        if (
          !state.counterpartLastReadMessageId ||
          nextId > state.counterpartLastReadMessageId
        ) {
          state.counterpartLastReadMessageId = nextId;
        }
        const watermark = state.counterpartLastReadMessageId;
        state.messages.forEach((item) => {
          if (Number(item.id) <= watermark) item.read = true;
        });
      }
    },
    clearChatThread(state) {
      state.appointmentId = null;
      state.messages = [];
      state.status = "idle";
      state.sending = false;
      state.error = null;
      state.counterpartTyping = false;
      state.counterpartLastReadAt = null;
      state.counterpartLastReadMessageId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInbox.pending, (state) => {
        state.inboxStatus = "loading";
      })
      .addCase(fetchInbox.fulfilled, (state, action) => {
        state.inboxStatus = "idle";
        const typingById = new Map(
          state.inbox
            .filter((thread) => thread.typing)
            .map((thread) => [Number(thread.appointmentId), true])
        );
        state.inbox = sortInboxByRecent(
          (action.payload || []).map((thread) => ({
            ...thread,
            typing: Boolean(typingById.get(Number(thread.appointmentId))),
          }))
        );
      })
      .addCase(fetchInbox.rejected, (state) => {
        state.inboxStatus = "idle";
      })
      .addCase(fetchMessages.pending, (state, action) => {
        const nextId = Number(action.meta.arg);
        if (Number(state.appointmentId) !== nextId) {
          state.counterpartLastReadAt = null;
          state.counterpartLastReadMessageId = null;
          state.messages = [];
        }
        state.status = "loading";
        state.error = null;
        state.appointmentId = nextId;
        state.counterpartTyping = false;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = "idle";
        state.appointmentId = action.payload.appointmentId;
        state.messages = action.payload.messages;
        state.counterpartLastReadAt =
          action.payload.counterpartLastReadAt || null;
        state.counterpartLastReadMessageId =
          action.payload.counterpartLastReadMessageId || null;
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
            ? { ...thread, unreadCount: 0, typing: false }
            : thread
        );
      });
  },
});

export const {
  receiveMessage,
  applyInboxMessage,
  setInboxTyping,
  setCounterpartTyping,
  setCounterpartRead,
  clearChatThread,
} = chatSlice.actions;
export default chatSlice.reducer;
