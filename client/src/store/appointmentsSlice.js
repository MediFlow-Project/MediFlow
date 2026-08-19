import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";

export const fetchAppointments = createAsyncThunk(
  "appointments/list",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await http.get("/appointments");
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchAppointment = createAsyncThunk(
  "appointments/detail",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await http.get(`/appointments/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const createAppointment = createAsyncThunk(
  "appointments/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await http.post("/appointments", payload);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  "appointments/cancel",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await http.patch(`/appointments/${id}/cancel`);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState: {
    items: [],
    current: null,
    status: "idle",
    error: null,
  },
  reducers: {
    clearAppointmentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(fetchAppointment.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.current = action.payload;
        state.items = [action.payload, ...state.items.filter((item) => item.id !== action.payload.id)];
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
        if (state.current?.id === action.payload.id) {
          state.current = action.payload;
        }
      });
  },
});

export const { clearAppointmentError } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
