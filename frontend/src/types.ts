export interface HealthResponse {
  api_status: string;
  status: string;
  model_status: string;
  model_type: string;
  vocabulary_size: number;
  supported_intents: string[];
  error?: string | null;
}

export interface SatelliteHealth {
  satellite_id: string;
  battery: number;
  temperature: number;
  signal_strength: number;
  storage_used: number;
  overall_status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | string;
  alerts?: string[];
  timestamp: number;
}

export interface PriorityResponse {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  score: number;
  reason: string;
}

export interface PredictResponse {
  text: string;
  intent: string;
  confidence: number;
  probabilities: Record<string, number>;
  model_type: string;
  classes: string[];
}

export interface ClauseAnalysis {
  text: string;
  top: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface AnalyzeResponse {
  text: string;
  intents: string[];
  primary_intent: string;
  confidence: number;
  whole_probabilities: Record<string, number>;
  clauses: ClauseAnalysis[];
  threshold: number;
  model_status: string;
  model_architecture: string;
}
