/**
 * Shell pipeline utilities for text processing
 * BUG: Incorrect piping causes intermediate output to be lost
 */

/**
 * Filters lines from a file matching a pattern
 * BUG: Commands run separately, grep doesn't receive cat output
 */
export async function filterLines(filepath: string, pattern: string): Promise<string[]> {
  // BUG: These commands run independently - grep receives empty stdin
  await Bun.$`cat ${filepath}`;
  const result = await Bun.$`grep ${pattern}`.nothrow();

  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Sorts unique lines from a file
 * BUG: Pipe chain broken - each command runs in isolation
 */
export async function sortUnique(filepath: string): Promise<string[]> {
  // BUG: Running commands sequentially doesn't pipe them
  const catResult = await Bun.$`cat ${filepath}`;
  const sortResult = await Bun.$`sort`;  // No input!
  const uniqResult = await Bun.$`uniq`;  // No input!

  return uniqResult.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Counts lines matching a pattern
 * BUG: Using raw string loses escaping and breaks piping
 */
export async function countMatches(filepath: string, pattern: string): Promise<number> {
  // BUG: String concatenation loses proper escaping
  const command = `cat ${filepath} | grep ${pattern} | wc -l`;
  const result = await Bun.$`${{ raw: command }}`.nothrow();

  return parseInt(result.stdout.toString().trim()) || 0;
}

/**
 * Gets the first N lines matching a pattern
 * BUG: Intermediate results lost between stages
 */
export async function headMatches(
  filepath: string,
  pattern: string,
  count: number
): Promise<string[]> {
  // BUG: Each command starts fresh without previous output
  const catOutput = await Bun.$`cat ${filepath}`.text();
  // This grep doesn't receive catOutput as stdin
  const grepOutput = await Bun.$`grep ${pattern}`.nothrow().text();
  // This head doesn't receive grepOutput as stdin
  const headOutput = await Bun.$`head -n ${count}`.text();

  return headOutput.trim().split('\n').filter(Boolean);
}

/**
 * Transforms text through multiple stages
 * BUG: Pipeline stages don't connect
 */
export async function transformText(
  input: string,
  stages: string[]
): Promise<string> {
  // BUG: Each stage runs independently
  let result = input;

  for (const stage of stages) {
    // BUG: The stage command doesn't receive 'result' as stdin
    const output = await Bun.$`${{ raw: stage }}`.nothrow();
    result = output.stdout.toString();
  }

  return result;
}

/**
 * Extracts and formats CSV columns
 * BUG: cut doesn't receive the file content
 */
export async function extractColumns(
  filepath: string,
  columns: number[]
): Promise<string[]> {
  const colSpec = columns.join(',');

  // BUG: Running cat then cut separately doesn't pipe them
  await Bun.$`cat ${filepath}`;
  const result = await Bun.$`cut -d',' -f${colSpec}`;

  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Finds files and processes them
 * BUG: xargs doesn't receive find output
 */
export async function findAndProcess(
  directory: string,
  pattern: string,
  command: string
): Promise<string> {
  // BUG: Separate commands don't pipe
  await Bun.$`find ${directory} -name ${pattern}`.nothrow();
  const result = await Bun.$`xargs ${command}`.nothrow();

  return result.stdout.toString();
}

/**
 * Gets top N most frequent words
 * BUG: Complex pipeline completely broken
 */
export async function topWords(filepath: string, n: number): Promise<string[]> {
  // BUG: Each command runs in isolation
  await Bun.$`cat ${filepath}`;
  await Bun.$`tr -cs 'A-Za-z' '\n'`;
  await Bun.$`tr 'A-Z' 'a-z'`;
  await Bun.$`sort`;
  await Bun.$`uniq -c`;
  await Bun.$`sort -rn`;
  const result = await Bun.$`head -n ${n}`;

  return result.stdout.toString().trim().split('\n').filter(Boolean);
}

/**
 * Searches for pattern and shows context
 * BUG: grep -C with file doesn't pipe properly
 */
export async function searchWithContext(
  filepath: string,
  pattern: string,
  contextLines: number
): Promise<string> {
  // BUG: Trying to pipe manually but commands run separately
  const catResult = await Bun.$`cat ${filepath}`;
  const grepResult = await Bun.$`grep -C ${contextLines} ${pattern}`.nothrow();

  return grepResult.stdout.toString();
}

/**
 * Calculates statistics on numeric data
 * BUG: awk doesn't receive the filtered data
 */
export async function calculateStats(filepath: string, column: number): Promise<{
  sum: number;
  count: number;
  average: number;
}> {
  // BUG: Commands don't chain properly
  await Bun.$`cat ${filepath}`;
  await Bun.$`cut -d',' -f${column}`;
  const result = await Bun.$`awk '{sum+=$1; count++} END {print sum, count, sum/count}'`.nothrow();

  const [sum, count, average] = result.stdout.toString().trim().split(' ').map(Number);

  return { sum: sum || 0, count: count || 0, average: average || 0 };
}
