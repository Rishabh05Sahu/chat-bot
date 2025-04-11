/* eslint-disable no-undef */
// server.js
const express = require('express');
const mongoose = require('mongoose');
const Todo = require('./models/todo');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const process = require('process');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON
app.use(express.json());

// Middleware to allow cross-origin requests
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// CREATE: Add a new todo
app.post('/todos', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Todo text is required.' });
    }
    const todo = new Todo({ text });
    await todo.save();
    const todoFields = {
      _id: todo._id,
      text: todo.text,
      completed: todo.completed,
    };
    res.status(201).json(todoFields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ: Get all todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    const todoFields = todos.map((todo) => ({
      _id: todo._id,
      text: todo.text,
      completed: todo.completed,
    }));
    res.json(todoFields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: Modify a todo by its ID
app.put('/todos/:id', async (req, res) => {
  try {
    const { text, completed } = req.body;
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { text, completed },
      { new: true, runValidators: true }
    );
    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found.' });
    }
    const updatedFields = {
     _id: updatedTodo._id,
      text: updatedTodo.text,
      completed: updatedTodo.completed,
    };
    res.json(updatedFields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove a todo by its ID
app.delete('/todos/:id', async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
    if (!deletedTodo) {
      return res.status(404).json({ error: 'Todo not found.' });
    }
    const deletedFields = {
      _id: deletedTodo._id,
      text: deletedTodo.text,
      completed: deletedTodo.completed,
    }
    res.json({ message: 'Todo deleted successfully', todo: deletedFields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the Voice Todos API!');
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
