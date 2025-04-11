// src/components/api.js

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createTodo = async (todoText) => {
    if (!todoText) {
      throw new Error("Todo text is required");
    }
  try {
    const response = await API.post("/todos", { text: todoText });
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getTodos = async () => {
  try {
    const response = await API.get("/todos");
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateTodo = async (id, text, completed) => {
  try {
    const response = await API.put(`/todos/${id}`, { text, completed });
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteTodo = async (id) => {
  try {
    const response = await API.delete(`/todos/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};
