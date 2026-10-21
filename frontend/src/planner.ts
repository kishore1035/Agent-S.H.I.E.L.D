import type { PlanStep } from './types';
export function plan(task: string): PlanStep[] {
  const t = task.toLowerCase(),
    p: PlanStep[] = [];
  if (/data|csv|sql|analyze|metrics|clean/.test(t))
    p.push(['data-agent', 'Process and analyze data']);
  if (/code|python|script|program|function|write/.test(t))
    p.push(['coding-agent', 'Generate and verify code']);
  if (/deploy|ops|bash|docker|server/.test(t))
    p.push(['ops-agent', 'Configure deployment and operations']);
  if (!p.length || /research|report|summary|explain/.test(t))
    p.push(['research-agent', 'Research context and synthesize findings']);
  return p;
}
