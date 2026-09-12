import { io } from "socket.io-client";

const socket = io("http://localhost:7070");

export default socket;