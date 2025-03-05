import axios from "axios";

export default axios.create({
    baseURL: window.location.origin+"/api",
    headers: {
        "Content-type": "application/json"
    }
});