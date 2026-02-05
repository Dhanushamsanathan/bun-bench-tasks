/**
 * Shell pipeline utilities for text processing
 * FIXED: Proper piping using Bun's pipe syntax
 */

/**
 * Filters lines from a file matching a pattern
 * FIXED: Use pipe operator in template literal
 */
export async function filterLines(filepath: string, pattern: string): Promise<string[]> {
  // FIXED: Use pipe operator directly in the shell template
  const result = await Bun.$`cat ${filepath} | grep ${pattern}`.nothrow();
  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Sorts unique lines from a file
 * FIXED: Proper piping in single command
 */
export async function sortUnique(filepath: string): Promise<string[]> {
  // FIXED: Chain commands with pipe in template
  const result = await Bun.$`cat ${filepath} | sort | uniq`.nothrow();
  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Counts lines matching a pattern
 * FIXED: Proper template with pipes
 */
export async function countMatches(filepath: string, pattern: string): Promise<number> {
  // FIXED: Use template interpolation with pipe
  const result = await Bun.$`cat ${filepath} | grep ${pattern} | wc -l`.nothrow();
  return parseInt(result.stdout.toString().trim()) || 0;
}

/**
 * Gets the first N lines matching a pattern
 * FIXED: All commands in single pipeline
 */
export async function headMatches(
  filepath: string,
  pattern: string,
  count: number
): Promise<string[]> {
  // FIXED: Single pipeline with all stages
  const result = await Bun.$`cat ${filepath} | grep ${pattern} | head -n ${count}`.nothrow();
  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Transforms text through multiple stages
 * FIXED: Pass stdin properly between stages
 */
export async function transformText(
  input: string,
  stages: string[]
): Promise<string> {
  // FIXED: Build pipeline as single command OR use stdin
  if (stages.length === 0) return input;

  // Method 1: Chain as single command
  const pipeline = stages.join(' | ');
  const result = await Bun.$`echo ${input} | ${{ raw: pipeline }}`.nothrow();

  return result.stdout.toString();
}

/**
 * Extracts and formats CSV columns
 * FIXED: Proper piping between cat and cut
 */
export async function extractColumns(
  filepath: string,
  columns: number[]
): Promise<string[]> {
  const colSpec = columns.join(',');

  // FIXED: Single pipeline
  const result = await Bun.$`cat ${filepath} | cut -d',' -f${colSpec}`.nothrow();
  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Finds files and processes them
 * FIXED: Proper piping to xargs
 */
export async function findAndProcess(
  directory: string,
  pattern: string,
  command: string
): Promise<string> {
  // FIXED: Pipe find output to xargs
  const result = await Bun.$`find ${directory} -name ${pattern} | xargs ${command}`.nothrow();
  return result.stdout.toString();
}

/**
 * Gets top N most frequent words
 * FIXED: Complete pipeline in single command
 */
export async function topWords(filepath: string, n: number): Promise<string[]> {
  // FIXED: All stages in single pipeline
  const result = await Bun.$`cat ${filepath} | tr -cs 'A-Za-z' '\n' | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn | head -n ${n}`.nothrow();
  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Searches for pattern and shows context
 * FIXED: Proper piping for grep with context
 */
export async function searchWithContext(
  filepath: string,
  pattern: string,
  contextLines: number
): Promise<string> {
  // FIXED: Single command with proper piping
  // Note: grep -C can work directly on file, but for consistency we pipe
  const result = await Bun.$`cat ${filepath} | grep -C ${contextLines} ${pattern}`.nothrow();
  return result.stdout.toString();
}

/**
 * Calculates statistics on numeric data
 * FIXED: Complete pipeline with proper data flow
 */
export async function calculateStats(filepath: string, column: number): Promise<{
  sum: number;
  count: number;
  average: number;
}> {
  // FIXED: Single pipeline with all stages
  const result = await Bun.$`cat ${filepath} | cut -d',' -f${column} | grep -E '^[0-9]+$' | awk '{sum+=$1; count++} END {print sum, count, (count>0 ? sum/count : 0)}'`.nothrow();

  const [sum, count, average] = result.stdout.toString().trim().split(' ').map(Number);
  return { sum: sum || 0, count: count || 0, average: average || 0 };
}

/**
 * Alternative: Using Bun's native APIs for better performance
 */
export async function filterLinesNative(filepath: string, pattern: string): Promise<string[]> {
  const content = await Bun.file(filepath).text();
  const regex = new RegExp(pattern);
  return content.split('\n').filter(line => regex.test(line));
}

/**
 * Alternative: Sort unique using native JS
 */
export async function sortUniqueNative(filepath: string): Promise<string[]> {
  const content = await Bun.file(filepath).text();
  const lines = content.split('\n').filter(Boolean);
  return [...new Set(lines)].sort();
}

/**
 * Alternative approach: Use .pipe() method for explicit piping
 * Note: This is conceptual - actual syntax may vary by Bun version
 */
export async function filterLinesWithPipeMethod(filepath: string, pattern: string): Promise<string[]> {
  // Using stdin option to pipe data
  const fileContent = await Bun.file(filepath).text();
  const result = await Bun.$`grep ${pattern}`.nothrow().stdin(fileContent);
  return result.stdout.toString().trim().split('\n').filter(Boolean);
}
