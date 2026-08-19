import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  http,
  persistAuth,
} from "../api/http";
import { disconnectSocket } from "../socket";
import { getErrorMessage } from "../utils/format";

export const bootstrapMe = createAsyncThunk("auth/bootstrap", async () => {
  const token = getStoredToken();
  if (!token) return { token: null, user: null };
  const { data } = await http.get("/me");
  persistAuth(token, data);
  return { token, user: data };
});

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await http.post("/auth/login", payload);
      persistAuth(data.accessToken, data.user);
      const me = await http.get("/me");
      persistAuth(data.accessToken, me.data);
      return { accessToken: data.accessToken, user: me.data };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      await http.post("/auth/register", payload);
      const { data } = await http.post("/auth/login", {
        email: payload.email,
        password: payload.password,
      });
      persistAuth(data.accessToken, data.user);
      const me = await http.get("/me");
      persistAuth(data.accessToken, me.data);
      return { accessToken: data.accessToken, user: me.data };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: getStoredToken(),
    user: getStoredUser(),
    status: getStoredToken() ? "loading" : "idle",
    error: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = null;
      clearAuthStorage();
      disconnectSocket();
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapMe.pending, (state) => {
        state.status = "loading";
      })
      .addCase(bootstrapMe.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(bootstrapMe.rejected, (state) => {
        state.status = "idle";
        state.token = null;
        state.user = null;
        clearAuthStorage();
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "idle";
        state.token = action.payload.accessToken;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
