import { TrainingVideo } from '../../types';
import { apiFetch } from './client';

export interface TrainingProgressItem {
  id: string;
  status: 'ASSIGNED' | 'WATCHED' | 'COMPLETED';
  quizScore?: number | null;
  watchedAt?: string | null;
  completedAt?: string | null;
  video: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    userCode: string;
    name: string;
  };
}

export async function fetchTrainingVideos(_unitId?: string): Promise<TrainingVideo[]> {
  return apiFetch<TrainingVideo[]>('/api/training/videos');
}

export async function fetchTrainingProgress(userId?: string): Promise<TrainingProgressItem[]> {
  try {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await apiFetch<TrainingProgressItem[]>(`/api/training/progress${query}`);
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function fetchTrainingProgressForUnit(unitId: string): Promise<TrainingProgressItem[]> {
  try {
    const query = unitId ? `?unitId=${encodeURIComponent(unitId)}` : '';
    const res = await apiFetch<TrainingProgressItem[]>(`/api/training/progress${query}`);
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function ensureTrainingAssigned(userId: string, videoId: string): Promise<any> {
  try {
    return await apiFetch('/api/training/ensure-assigned', {
      method: 'POST',
      body: JSON.stringify({ userId, videoId }),
    });
  } catch {
    return { id: `prog-${videoId}-${userId}` };
  }
}

export async function updateTrainingProgress(videoId: string, status: string, quizScore?: number): Promise<any> {
  return apiFetch(`/api/training/${videoId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ status, quizScore }),
  });
}
