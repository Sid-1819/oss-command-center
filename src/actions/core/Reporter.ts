export interface Reporter<TOutput, TReport> {
  report(output: TOutput): TReport;
}
