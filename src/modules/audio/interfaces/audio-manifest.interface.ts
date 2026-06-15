export interface AudioManifest {
  lessonId: string;
  segments: Array<{
    segmentId: string;
    title: string;
    type: string;
    audioUrl: string;
    durationSeconds?: number;
    checkQuestion?: string;
  }>;
}
