export const invalidate = (queryClient, keys) => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
