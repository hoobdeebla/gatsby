import convertHrtime from "convert-hrtime"

export function calcElapsedTime(startTime: bigint): string {
  const elapsed = process.hrtime.bigint() - startTime

  return convertHrtime(elapsed)[`seconds`].toFixed(3)
}
