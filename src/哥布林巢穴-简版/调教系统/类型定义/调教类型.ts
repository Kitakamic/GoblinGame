export interface TrainingOption {
  text: string;
  label?: string;
}

export interface ParsedOptionsResult {
  options: TrainingOption[];
}
