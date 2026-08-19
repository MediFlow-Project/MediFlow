import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";

export const fetchPatientBoard = createAsyncThunk(
  "queue/patientBoard",
  async ({ doctorId, date, session }, { rejectWithValue }) => {
    try {
      const { data } = await http.get(`/queues/${doctorId}`, {
        params: { date, session },
      });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchDoctorBoard = createAsyncThunk(
  "queue/doctorBoard",
  async ({ date, session }, { rejectWithValue }) => {
    try {
      const { data } = await http.get("/doctor/queues", {
        params: { date, session },
      });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchDoctorSessions = createAsyncThunk(
  "queue/sessionsToday",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get("/doctor/sessions/today");
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const openDoctorSession = createAsyncThunk(
  "queue/open",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await http.post("/doctor/sessions/open", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const callNextPatient = createAsyncThunk(
  "queue/call",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await http.post("/doctor/queues/call", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const skipPatient = createAsyncThunk(
  "queue/skip",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await http.post("/doctor/queues/skip", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const startConsult = createAsyncThunk(
  "queue/start",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await http.post("/doctor/consultations/start", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const completeConsult = createAsyncThunk(
  "queue/complete",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await http.post("/doctor/consultations/complete", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const queueSlice = createSlice({
  name: "queue",
  initialState: {
    board: null,
    sessions: [],
    status: "idle",
    actionStatus: "idle",
    error: null,
  },
  reducers: {
    applyBoardUpdate(state, action) {
      const next = action.payload;
      if (!next) return;
      if (
        state.board &&
        (state.board.doctorId !== next.doctorId ||
          state.board.date !== next.date ||
          state.board.session !== next.session)
      ) {
        return;
      }
      const prevItems = state.board?.items || [];
      state.board = {
        ...next,
        items: (next.items || []).map((item, index) => ({
          ...item,
          appointmentId:
            item.appointmentId ?? prevItems[index]?.appointmentId,
        })),
      };
    },
    clearQueueError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatientBoard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPatientBoard.fulfilled, (state, action) => {
        state.status = "idle";
        state.board = action.payload;
      })
      .addCase(fetchPatientBoard.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(fetchDoctorBoard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDoctorBoard.fulfilled, (state, action) => {
        state.status = "idle";
        state.board = action.payload;
      })
      .addCase(fetchDoctorBoard.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(fetchDoctorSessions.fulfilled, (state, action) => {
        state.sessions = action.payload;
      })
      .addCase(openDoctorSession.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(openDoctorSession.fulfilled, (state, action) => {
        state.actionStatus = "idle";
        state.board = action.payload;
      })
      .addCase(openDoctorSession.rejected, (state, action) => {
        state.actionStatus = "idle";
        state.error = action.payload;
      })
      .addCase(callNextPatient.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(callNextPatient.fulfilled, (state) => {
        state.actionStatus = "idle";
      })
      .addCase(callNextPatient.rejected, (state, action) => {
        state.actionStatus = "idle";
        state.error = action.payload;
      })
      .addCase(skipPatient.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(skipPatient.fulfilled, (state) => {
        state.actionStatus = "idle";
      })
      .addCase(skipPatient.rejected, (state, action) => {
        state.actionStatus = "idle";
        state.error = action.payload;
      })
      .addCase(startConsult.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(startConsult.fulfilled, (state) => {
        state.actionStatus = "idle";
      })
      .addCase(startConsult.rejected, (state, action) => {
        state.actionStatus = "idle";
        state.error = action.payload;
      })
      .addCase(completeConsult.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })
      .addCase(completeConsult.fulfilled, (state) => {
        state.actionStatus = "idle";
      })
      .addCase(completeConsult.rejected, (state, action) => {
        state.actionStatus = "idle";
        state.error = action.payload;
      });
  },
});

export const { applyBoardUpdate, clearQueueError } = queueSlice.actions;
export default queueSlice.reducer;
