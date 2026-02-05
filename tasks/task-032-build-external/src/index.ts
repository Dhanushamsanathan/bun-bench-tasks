// Library that uses external dependencies
// These should be marked as external to avoid bundling

// Simulating lodash-like utility functions
const mockLodash = {
  chunk: <T>(arr: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  },
  uniq: <T>(arr: T[]): T[] => [...new Set(arr)],
  flatten: <T>(arr: T[][]): T[] => arr.flat(),
};

// Simulating axios-like HTTP client
const mockAxios = {
  get: async (url: string) => ({ data: { url, status: "ok" } }),
  post: async (url: string, data: any) => ({ data: { url, received: data } }),
};

// Export utilities that use "external" dependencies
export function processData(items: number[]) {
  const chunks = mockLodash.chunk(items, 3);
  const unique = mockLodash.uniq(items);
  return { chunks, unique };
}

export async function fetchData(endpoint: string) {
  const response = await mockAxios.get(endpoint);
  return response.data;
}

export async function sendData(endpoint: string, payload: object) {
  const response = await mockAxios.post(endpoint, payload);
  return response.data;
}

// These constants simulate what would be imported from external packages
export const LODASH_MARKER = "__LODASH_EXTERNAL__";
export const AXIOS_MARKER = "__AXIOS_EXTERNAL__";
