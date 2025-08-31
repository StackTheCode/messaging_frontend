import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { CreateTaskData, Task, TaskAction, TaskContextType, TaskProviderProps, TaskState } from "../types/types";
import {taskApi} from "../services/taskApi"

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const initialState: TaskState = {
  tasks: [],
  loading: false,
  tasksPanelOpen: false
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };
    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'TOGGLE_TASKS_PANEL':
      return { ...state, tasksPanelOpen: !state.tasksPanelOpen };
    case 'SET_TASKS_PANEL':
      return { ...state, tasksPanelOpen: action.payload };
    default:
      return state;
  }
};

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const loadTasks = async (): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // Fixed: Handle the paginated response properly
      const response = await taskApi.getTasks();
      dispatch({ type: 'SET_TASKS', payload: response.content });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createTask = async (taskData: CreateTaskData): Promise<Task> => {
    try {
      const newTask = await taskApi.createTask(taskData);
      dispatch({ type: "ADD_TASK", payload: newTask });
      return newTask;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw error;
    }
  };

  const updateTaskStatus = async (taskId: number, status: Task["status"]): Promise<void> => {
    try {
      const updatedTask = await taskApi.updateTaskStatus(taskId, status);
      dispatch({ type: "UPDATE_TASK", payload: updatedTask });
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  };

  const toggleTasksPanel = (): void => {
    dispatch({ type: 'TOGGLE_TASKS_PANEL' });
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <TaskContext.Provider value={{
      ...state,
      createTask,
      updateTaskStatus,
      loadTasks,
      toggleTasksPanel
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTask must be used within TaskProvider");
  }
  return context;
};
