export const functionDeclarations = [
    {
      "name": "create_todo",
      "description": "Creates a new todo item by accepting a text input and storing it in the database.",
      "parameters": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "The text content of the todo item."
          }
        },
        "required": ["text"]
      }
    },
    {
      "name": "read_todos",
      "description": "Retrieves all todo items from the database, sorted by creation date in descending order.",
      "parameters": {
        "type": "object",
        "properties": {
          "any_random_string": {
            "type": "string",
            "description": "Any random string."
          }
        },
        "required": ["any_random_string"]
      }
    },
    {
      "name": "update_todo",
      "description": "Updates an existing todo item identified by its ID, modifying its text and/or completion status.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The unique identifier of the todo item to update."
          },
          "text": {
            "type": "string",
            "description": "The updated text content of the todo item."
          },
          "completed": {
            "type": "boolean",
            "description": "The completion status of the todo item."
          }
        },
        "required": ["id"]
      }
    },
    {
      "name": "delete_todo",
      "description": "Deletes a todo item from the database using its unique ID.",
      "parameters": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The unique identifier of the todo item to delete."
          }
        },
        "required": ["id"]
      }
    }
  ]
  