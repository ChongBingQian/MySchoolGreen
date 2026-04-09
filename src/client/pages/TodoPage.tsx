import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  modelenceQuery,
  modelenceMutation,
  createQueryKey,
} from '@/client/lib/cloudflare/modelenceReactQuery';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Input } from '@/client/components/ui/Input';
import { Textarea } from '@/client/components/ui/Textarea';
import { FormField } from '@/client/components/ui/FormField';
import Page from '@/client/components/Page';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Check, Trash2, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/client/lib/utils';

// Types
type Todo = {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
};

type School = {
  _id: string;
  name: string;
  city: string;
  totalCredits: number;
  createdAt: string;
};

type Device = {
  _id: string;
  name: string;
  deviceType: string;
  location: string;
  sensorTypes: string[];
  status: string;
  schoolId: string;
  registeredAt: string;
  lastReadingAt?: string;
};

type DashboardStats = {
  totalDevices: number;
  activeDevices: number;
  totalSchools: number;
  totalCredits: number;
  co2OffsetKg: number;
  recentReadings?: SensorReading[];
};

type SensorReading = {
  _id: string;
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  recordedAt: string;
};

type TodoSuggestion = {
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
};

// Form validation schema
const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

type CreateTodoFormData = z.infer<typeof createTodoSchema>;

export default function TodoPage() {
  return (
    <Page>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1
          className="text-2xl font-bold text-gray-900 mb-6 rise-in"
          style={{ animationDelay: '40ms' }}
        >
          Todo List
        </h1>
        <TodoForm />
        <TodoSuggestions />
        <TodoList />
      </div>
    </Page>
  );
}

function TodoSuggestions() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<TodoSuggestion[]>([]);

  const { data: todos = [] } = useQuery({
    ...modelenceQuery<Todo[]>('todo.getTodos'),
  });

  const { data: schools = [] } = useQuery({
    ...modelenceQuery<School[]>('regenerate.getSchools'),
  });

  const { data: devices = [] } = useQuery({
    ...modelenceQuery<Device[]>('regenerate.getDevices'),
  });

  const { data: dashboard } = useQuery({
    ...modelenceQuery<DashboardStats>('regenerate.getDashboardStats'),
  });

  const { mutateAsync: createTodo, isPending: isAddingSuggestion } = useMutation({
    ...modelenceMutation('todo.createTodo'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('todo.getTodos') });
    },
  });

  const generateSuggestions = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/todo-suggestions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          todos,
          schools,
          devices,
          dashboard,
          activeDevices: devices.filter((device) => device.status === 'active'),
          environmentReadings: dashboard?.recentReadings ?? [],
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        suggestions?: TodoSuggestion[];
      };

      if (!response.ok || !payload.ok || !Array.isArray(payload.suggestions)) {
        throw new Error(payload.message || 'Failed to generate suggestions');
      }

      setSuggestions(payload.suggestions);
      toast.success(`Generated ${payload.suggestions.length} suggestions`);
    } catch (error) {
      toast.error((error as Error).message || 'Could not generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const addSuggestion = async (suggestion: TodoSuggestion) => {
    await createTodo({
      title: suggestion.title,
      description: suggestion.description,
    });
    toast.success('Suggestion added to your todo list');
  };

  return (
    <Card className="mb-6 rise-in" style={{ animationDelay: '140ms' }}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">AI Todo Suggestions</CardTitle>
          <Button type="button" onClick={generateSuggestions} disabled={isGenerating} size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Suggest From App Data'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-600">
            Generate suggestions based on active devices and detected environment readings.
          </p>
        ) : (
          <ul className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.title}-${index}`}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{suggestion.title}</p>
                    {suggestion.description ? (
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    ) : null}
                    {suggestion.reason ? (
                      <p className="text-xs text-gray-500 mt-2">Why: {suggestion.reason}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-1 rounded-full capitalize',
                      suggestion.priority === 'high' && 'bg-red-100 text-red-700',
                      suggestion.priority === 'medium' && 'bg-amber-100 text-amber-700',
                      suggestion.priority === 'low' && 'bg-green-100 text-green-700'
                    )}
                  >
                    {suggestion.priority}
                  </span>
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isAddingSuggestion}
                    onClick={() => {
                      addSuggestion(suggestion).catch((error: unknown) => {
                        toast.error((error as Error).message || 'Failed to add suggestion');
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Todos
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TodoForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoFormData>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const { mutateAsync: createTodo, isPending } = useMutation({
    ...modelenceMutation('todo.createTodo'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('todo.getTodos') });
      reset();
      toast.success('Todo created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create todo');
    },
  });

  const onSubmit = async (data: CreateTodoFormData) => {
    await createTodo({
      title: data.title,
      description: data.description || '',
    });
  };

  return (
    <Card className="mb-6 rise-in" style={{ animationDelay: '100ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Add New Todo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Title" htmlFor="title" error={errors.title?.message} required>
            <Input id="title" placeholder="What needs to be done?" {...register('title')} />
          </FormField>

          <FormField
            label="Description"
            htmlFor="description"
            error={errors.description?.message}
            description="Optional: Add more details"
          >
            <Textarea
              id="description"
              placeholder="Add a description..."
              rows={2}
              {...register('description')}
            />
          </FormField>

          <Button type="submit" disabled={isSubmitting || isPending} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            {isPending ? 'Adding...' : 'Add Todo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TodoList() {
  const queryClient = useQueryClient();

  const {
    data: todos,
    isLoading,
    error,
  } = useQuery({
    ...modelenceQuery<Todo[]>('todo.getTodos'),
  });

  const { mutate: toggleTodo } = useMutation({
    ...modelenceMutation<{ todoId: string }>('todo.toggleTodo'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('todo.getTodos') });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update todo');
    },
  });

  const { mutate: deleteTodo } = useMutation({
    ...modelenceMutation('todo.deleteTodo'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('todo.getTodos') });
      toast.success('Todo deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete todo');
    },
  });

  const handleToggle = useCallback(
    (todoId: string) => {
      toggleTodo({ todoId });
    },
    [toggleTodo]
  );

  const handleDelete = useCallback(
    (todoId: string) => {
      deleteTodo({ todoId });
    },
    [deleteTodo]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error loading todos: {(error as Error).message}
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <Card className="rise-in" style={{ animationDelay: '160ms' }}>
        <CardContent className="py-12 text-center text-gray-500">
          No todos yet. Add one above to get started!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rise-in" style={{ animationDelay: '160ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Your Todos ({todos.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-100">
          {todos.map((todo, index) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={handleToggle}
              onDelete={handleDelete}
              index={index}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

function TodoItem({ todo, onToggle, onDelete, index }: TodoItemProps) {
  return (
    <li
      className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors rise-in"
      style={{ animationDelay: `${220 + index * 40}ms` }}
    >
      <button
        type="button"
        onClick={() => onToggle(todo._id)}
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors',
          todo.completed
            ? 'bg-black border-black text-white'
            : 'border-gray-300 hover:border-gray-400'
        )}
        aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {todo.completed && <Check className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium text-gray-900',
            todo.completed && 'line-through text-gray-500'
          )}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className={cn('text-sm text-gray-500 mt-1', todo.completed && 'line-through')}>
            {todo.description}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(todo.createdAt).toLocaleDateString()}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDelete(todo._id)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Delete todo"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
