import type source from '../zh-CN/client';
import type { LocalizedDictionary } from '../../types';

export default {
  "requestFailed": "Request failed",
  "requestRetry": "Request failed. Please try again later.",
  "sessionExpired": "Your session expired. Please sign in again.",
  "refreshFailed": "Could not refresh the token",
  "refreshIncomplete": "The token refresh response is incomplete",
  "streamUnavailable": "Could not open the response stream",
  "processingFailed": "Processing failed",
  "resultIncomplete": "The result response is incomplete",
  "assistantFailed": "The AI assistant encountered an error",
  "streamInterrupted": "The response stream was interrupted. Please try again.",
  "assistantTimeout": "The AI assistant timed out. Please try again.",
  "invalidStream": "Invalid response stream format",
  "assistantConnection": "Could not connect to the AI assistant",
  "emptyPage": "The page contained no records. Please try again.",
  "stalledPage": "Paging returned no new records. Please try again.",
  "appError": "[Pilot Admin] Application error",
  "pageError": "[Pilot Admin] Page error",
  "resourceError": "[Pilot Admin] Page resource failed to load",
  "reloadMarkerError": "[Pilot Admin] Could not save the automatic reload marker. Refresh manually.",
  "version": "[Pilot Admin] Frontend version: {version}"
} satisfies LocalizedDictionary<typeof source>;
