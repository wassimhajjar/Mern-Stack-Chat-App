import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const AuthContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  //Check if user if authenticated and if so, set the user data and connect to the socket
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //Login function to handle user authentication and socket connection
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials); //state can be signup or login
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //logout function to handle user logout and socket disconnection
  const logout = async () => {
    localStorage.removeItem("token");
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");
    socket.disconnect();
  };

  //Update profile function to handle user profile updates
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast(error.message);
    }
  };

  //Connect socket function to handle socket connection and online users updates
  const connectSocket = (userData) => {
    //no user data or socket.connected=false
    if (!userData || socket?.connected) {
      return;
    }
    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      },
    });
    newSocket.connect();
    setSocket(newSocket);
    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
    }
    checkAuth();
  }, []);

  const value = {
    axios,
    token,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
