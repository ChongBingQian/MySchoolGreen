import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelenceQuery, modelenceMutation, createQueryKey } from '@/client/lib/cloudflare/modelenceReactQuery';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Input } from '@/client/components/ui/Input';
import { Textarea } from '@/client/components/ui/Textarea';
import { FormField } from '@/client/components/ui/FormField';
import Page from '@/client/components/Page';
import LoadingSpinner from '@/client/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Check, Trash2, Plus } from 'lucide-react';
import { cn } from '@/client/lib/utils';

// Types
type Todo = {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Todo List</h1>
        <TodoForm />
        <TodoList />
      </div>
    </Page>
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
    <Card className="mb-6">
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
    ...modelenceMutation<{ completed: boolean }>('todo.toggleTodo'),
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
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No todos yet. Add one above to get started!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Todos ({todos.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-100">
          {todos.map((todo) => (
            <TodoItem key={todo._id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
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
}

function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
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
