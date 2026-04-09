import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  modelenceQuery,
  modelenceMutation,
  createQueryKey,
} from '@/client/lib/cloudflare/modelenceReactQuery';
import { RefreshCw, Plus, Calendar } from 'lucide-react';
import Page from '@/client/components/Page';

type ExampleItem = {
  title: string;
  createdAt: Date;
};

export default function ExamplePage() {
  const { itemId } = useParams<{ itemId: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    ...modelenceQuery<ExampleItem>('example.getItem', { itemId }),
    enabled: !!itemId,
  });

  const { mutate: createItem, isPending: isCreatingItem } = useMutation({
    ...modelenceMutation('example.createItem'),
  });

  const invalidateItem = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: createQueryKey('example.getItem', { itemId }) });
  }, [queryClient, itemId]);

  if (isLoading) {
    return (
      <Page>
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="rise-in" style={{ animationDelay: '40ms' }}>
            Loading...
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
        {error && (
          <div className="rise-in" style={{ animationDelay: '40ms' }}>
            Error: {(error as Error).message}
          </div>
        )}
        {data && (
          <div className="space-y-2 rise-in" style={{ animationDelay: '80ms' }}>
            <h1>{data.title}</h1>
            <p className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Created: {new Date(data.createdAt).toLocaleString()}
            </p>
          </div>
        )}
        <button
          onClick={invalidateItem}
          className="flex items-center gap-1.5 rise-in"
          style={{ animationDelay: '140ms' }}
        >
          <RefreshCw className="w-4 h-4" />
          Invalidate Item
        </button>
        <button
          onClick={() => createItem({ title: 'New Item' })}
          disabled={isCreatingItem}
          className="flex items-center gap-1.5 rise-in"
          style={{ animationDelay: '200ms' }}
        >
          <Plus className="w-4 h-4" />
          Create Item
        </button>
      </div>
    </Page>
  );
}
