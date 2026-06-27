export interface Planner<TInput, TPlan> {
  plan(input: TInput): Promise<TPlan>;
}
