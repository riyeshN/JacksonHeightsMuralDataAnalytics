import axios from "axios";

const api = axios.create({
	baseURL: "http://35.222.176.221:8000/",
});

export default api;
