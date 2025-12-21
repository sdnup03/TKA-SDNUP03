
import { Exam, StudentAttempt, StudentProgress, User, QuestionBankItem, Question, QuestionAnalysis } from '../types';
import { cache, CACHE_KEYS, CACHE_TTL } from './cache';
import { logger } from './logger';

/**
 * ============================================================================
 * KONFIGURASI API
 * ============================================================================
 * Ganti URL di bawah ini dengan URL Web App dari deployment Google Apps Script Anda.
 * Format: https://script.google.com/macros/s/AKfycbx.../exec
 * 
 * Cara mendapatkan URL:
 * 1. Buka Google Apps Script
 * 2. Deploy sebagai Web App
 * 3. Copy URL yang muncul
 * 4. Paste di bawah ini
 */
export const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwoFa20-0ST4oo255yJNuv3iffYJnITu8aeDVyt93XIReNQuTkem1J18Hdp4ePEep3q/exec';

// Helper untuk menghandle response
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    logger.error('API request failed', { status: response.status, statusText: response.statusText });
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  if (!result.success) {
    logger.error('API returned error', { message: result.message });
    throw new Error(result.message || 'API Error');
  }
  return result.data;
};

// Helper untuk POST Request (menggunakan no-cors/text-plain trick untuk GAS)
const postData = async (action: string, data: any = {}) => {
  // Kita menggunakan 'text/plain' agar tidak memicu CORS Preflight (OPTIONS)
  // Google Apps Script akan memparsing isinya lewat e.postData.contents
  const response = await fetch(GAS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action, data }),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  });
  return handleResponse(response);
};

/**
 * Helper with RETRY logic
 * Essential for concurrent submits where GAS LockService might trigger timeouts
 * Also handles 429 (Too Many Requests) errors with exponential backoff
 */
const postDataWithRetry = async (action: string, data: any = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await postData(action, data);
    } catch (err: any) {
      const isLastAttempt = i === retries - 1;
      
      // Check for specific error types
      const isServerBusy = err.message && err.message.includes('server');
      const isRateLimited = err.message && (
        err.message.includes('429') || 
        err.message.includes('Too Many Requests') ||
        err.message.includes('rate limit')
      );
      
      if (isLastAttempt) {
        // On last attempt, provide helpful error message
        if (isRateLimited) {
          throw new Error('Terlalu banyak request. Tunggu sebentar dan coba lagi.');
        }
        throw err;
      }
      
      // Exponential backoff delay
      // Rate limiting needs longer delays
      let delay = (i + 1) * 1000; // Base: 1s, 2s, 3s...
      
      if (isServerBusy) {
        delay += 2000; // Add 2s for server busy
      }
      
      if (isRateLimited) {
        // For rate limiting, use exponential backoff: 2s, 4s, 8s, 16s...
        delay = Math.min(2000 * Math.pow(2, i), 30000); // Max 30s
      }
      
      logger.warn(`Retry attempt ${i + 1}/${retries} for ${action} in ${delay}ms`, { 
        error: err.message,
        isRateLimited,
        isServerBusy 
      });
      
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

// ============================================================================
// PUBLIC API METHODS
// ============================================================================

export const api = {
  /**
   * Login User
   */
  login: async (username: string, password: string): Promise<User> => {
     if (GAS_API_URL.includes('PASTE_YOUR')) {
         // Mock Login for setup phase
         if (username === 'admin' && password === 'admin123') return { username: 'admin', name: 'Pak Guru (Mock)', role: 'GURU'};
         if (username === 'siswa1' && password === 'siswa123') return { username: 'siswa1', name: 'Budi Santoso (Mock)', role: 'SISWA'};
         throw new Error("Invalid Mock Credentials (admin/admin123 or siswa1/siswa123)");
     }
     return postData('LOGIN', { username, password });
  },

  /**
   * Mengambil daftar semua ujian (with caching)
   */
  fetchExams: async (forceRefresh: boolean = false): Promise<Exam[]> => {
    // Jika URL belum diset, kembalikan array kosong (mencegah crash saat dev awal)
    if (GAS_API_URL.includes('PASTE_YOUR')) return [];
    
    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<Exam[]>(CACHE_KEYS.EXAMS);
      if (cached) return cached;
    }
    
    const response = await fetch(`${GAS_API_URL}?action=GET_EXAMS`);
    const data = await handleResponse(response);
    
    // Cache the result
    cache.set(CACHE_KEYS.EXAMS, data, CACHE_TTL.EXAMS);
    
    return data;
  },

  /**
   * Mengambil daftar semua hasil/attempt siswa (with caching)
   */
  fetchAttempts: async (forceRefresh: boolean = false): Promise<StudentAttempt[]> => {
    if (GAS_API_URL.includes('PASTE_YOUR')) return [];

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<StudentAttempt[]>(CACHE_KEYS.ATTEMPTS);
      if (cached) return cached;
    }

    const response = await fetch(`${GAS_API_URL}?action=GET_ATTEMPTS`);
    const data = await handleResponse(response);
    
    // Cache the result
    cache.set(CACHE_KEYS.ATTEMPTS, data, CACHE_TTL.ATTEMPTS);
    
    return data;
  },

  /**
   * Mengambil data live progress (untuk monitoring guru)
   */
  fetchLiveProgress: async (): Promise<StudentProgress[]> => {
    if (GAS_API_URL.includes('PASTE_YOUR')) return [];

    const response = await fetch(`${GAS_API_URL}?action=GET_LIVE_PROGRESS`);
    return handleResponse(response);
  },

  /**
   * Mengambil daftar unique classId yang tersedia di database (with caching)
   */
  fetchClassIds: async (forceRefresh: boolean = false): Promise<string[]> => {
    if (GAS_API_URL.includes('PASTE_YOUR')) return ['VIII A', 'VIII B', 'IX A', 'IX B']; // Mock data

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<string[]>(CACHE_KEYS.CLASS_IDS);
      if (cached) return cached;
    }

    const response = await fetch(`${GAS_API_URL}?action=GET_CLASS_IDS`);
    const data = await handleResponse(response);
    
    // Cache the result
    cache.set(CACHE_KEYS.CLASS_IDS, data, CACHE_TTL.CLASS_IDS);
    
    return data;
  },

  /**
   * Menyimpan ujian baru atau update ujian yang ada
   */
  saveExam: async (exam: Exam) => {
    return postData('SAVE_EXAM', exam);
  },

  /**
   * Menghapus ujian berdasarkan ID
   */
  deleteExam: async (id: string) => {
    return postData('DELETE_EXAM', { id });
  },

  /**
   * Mengirim jawaban siswa (Submit Ujian)
   * USES RETRY to prevent failure during mass submissions
   */
  submitAttempt: async (attempt: StudentAttempt) => {
    return postDataWithRetry('SUBMIT_ATTEMPT', attempt);
  },

  /**
   * Update progress real-time siswa
   */
  updateProgress: async (progress: StudentProgress) => {
    // Fire and forget (tidak perlu await strict di UI untuk performa)
    // Tapi kita return promise agar bisa ditunggu jika perlu
    return fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'UPDATE_PROGRESS', data: progress }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    }).catch(err => console.error("Sync error:", err));
  },

  /**
   * Update Nilai Siswa (Manual Grading)
   */
  updateStudentScore: async (examId: string, studentName: string, newScore: number) => {
    return postData('UPDATE_SCORE', { examId, studentName, newScore });
  },

  /**
   * Reset Sesi Ujian Siswa (Hapus Attempt & Live Progress)
   */
  resetStudentAttempt: async (examId: string, studentName: string) => {
    return postData('RESET_STUDENT_ATTEMPT', { examId, studentName });
  },

  /**
   * Upload Image ke Google Drive via GAS
   * WITH THROTTLING to prevent rate limiting (429 errors)
   */
  uploadImage: async (base64Data: string, fileName: string): Promise<{ url: string }> => {
    // Add delay before upload to prevent rate limiting
    // Back to simpler timing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use retry logic for upload (reduced retries)
    return postDataWithRetry('UPLOAD_IMAGE', { base64Data, fileName }, 3);
  },

  /**
   * Reset seluruh database (Bahaya)
   */
  resetSystem: async () => {
    return postData('RESET_SYSTEM');
  },

  /**
   * Mengambil konfigurasi aplikasi (appName, schoolName)
   * Config tidak di-cache agar selalu mendapatkan nilai terbaru dari spreadsheet
   */
  fetchConfig: async (): Promise<{ appName: string; schoolName: string }> => {
    if (GAS_API_URL.includes('PASTE_YOUR')) {
      return { appName: 'TKA SDNUP03', schoolName: 'SDN Utan Panjang 03' };
    }
    
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`${GAS_API_URL}?action=GET_CONFIG&_t=${timestamp}`);
      const result = await handleResponse(response);
      
      // Ensure we have valid data
      if (result && typeof result === 'object' && result.appName && result.schoolName) {
        return result;
      }
      
      // Fallback to defaults if data is invalid
      console.warn('Invalid config data, using defaults');
      return { appName: 'TKA SDNUP03', schoolName: 'SDN Utan Panjang 03' };
    } catch (error) {
      console.error('Error fetching config:', error);
      return { appName: 'TKA SDNUP03', schoolName: 'SDN Utan Panjang 03' };
    }
  },

  /**
   * Mengambil semua soal dari bank soal (with caching)
   */
  fetchBankQuestions: async (forceRefresh: boolean = false): Promise<QuestionBankItem[]> => {
    if (GAS_API_URL.includes('PASTE_YOUR')) return [];

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<QuestionBankItem[]>(CACHE_KEYS.BANK_QUESTIONS);
      if (cached) return cached;
    }

    const response = await fetch(`${GAS_API_URL}?action=GET_BANK_QUESTIONS`);
    const data = await handleResponse(response);
    
    // Cache the result
    cache.set(CACHE_KEYS.BANK_QUESTIONS, data, CACHE_TTL.BANK_QUESTIONS);
    
    return data;
  },

  /**
   * Menyimpan soal ke bank soal
   */
  saveToBank: async (question: Question, subject: string, difficulty: 'Mudah' | 'Sedang' | 'Sulit' = 'Sedang', tags: string = '', createdBy: string): Promise<{ id: string }> => {
    return postData('SAVE_TO_BANK', {
      question,
      subject,
      difficulty,
      tags,
      createdBy
    });
  },

  /**
   * Update soal di bank soal
   */
  updateBankQuestion: async (questionId: string, question: Question, subject: string, difficulty: 'Mudah' | 'Sedang' | 'Sulit' = 'Sedang', tags: string = ''): Promise<void> => {
    return postData('UPDATE_BANK_QUESTION', {
      questionId,
      question,
      subject,
      difficulty,
      tags
    });
  },

  /**
   * Hapus soal dari bank soal
   */
  deleteBankQuestion: async (questionId: string): Promise<void> => {
    return postData('DELETE_BANK_QUESTION', {
      questionId
    });
  },

  /**
   * Bulk delete questions from bank
   */
  bulkDeleteBankQuestions: async (questionIds: string[]): Promise<{ deletedCount: number; failedCount: number; message: string }> => {
    logger.info('Bulk deleting bank questions', { count: questionIds.length });
    
    const result = await postDataWithRetry('BULK_DELETE_BANK_QUESTIONS', { questionIds }, 2);
    
    logger.info('Bulk delete completed', { 
      deletedCount: result.deletedCount,
      failedCount: result.failedCount 
    });
    
    return result;
  },

  /**
   * ============================================================================
   * ITEM ANALYSIS FUNCTIONS
   * ============================================================================
   */

  /**
   * Analisis soal untuk ujian tertentu
   * Menghitung difficulty index, discrimination index, dan quality metrics
   */
  analyzeExam: async (examId: string): Promise<{
    success: boolean;
    examId?: string;
    examTitle?: string;
    totalQuestions?: number;
    totalStudents?: number;
    goodQuestions?: number;
    reviewNeeded?: number;
    shouldDelete?: number;
    analysisResults?: QuestionAnalysis[];
    analyzedAt?: string;
    message?: string;
  }> => {
    logger.info('Analyzing exam', { examId });
    
    try {
      // postDataWithRetry returns result.data (already unwrapped by handleResponse)
      const data = await postDataWithRetry('ANALYZE_EXAM', { examId }, 3);
      
      // Invalidate bank questions cache (metrics updated)
      cache.delete(CACHE_KEYS.BANK_QUESTIONS);
      
      logger.info('Exam analysis completed', { 
        examId, 
        goodQuestionns: data.goodQuestions,
        reviewNeeded: data.reviewNeeded 
      });
      
      // Return with success flag
      return { 
        success: true, 
        ...data 
      };
    } catch (error: any) {
      logger.error('Exam analysis failed', { examId, error: error.message });
      return { 
        success: false, 
        message: error.message || 'Analisis gagal' 
      };
    }
  },

  /**
   * Ambil hasil analisis soal untuk ujian tertentu
   */
  getQuestionAnalysis: async (examId?: string): Promise<QuestionAnalysis[]> => {
    const url = examId 
      ? `${GAS_API_URL}?action=GET_QUESTION_ANALYSIS&examId=${examId}`
      : `${GAS_API_URL}?action=GET_QUESTION_ANALYSIS`;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  /**
   * Ambil history analisis untuk soal tertentu (across all exams)
   */
  getQuestionHistory: async (questionId: string): Promise<QuestionAnalysis[]> => {
    logger.info('Fetching question history', { questionId });
    
    const url = `${GAS_API_URL}?action=GET_QUESTION_ANALYSIS&questionId=${questionId}`;
    const response = await fetch(url);
    const history = await handleResponse(response);
    
    logger.info('Question history fetched', { questionId, count: history.length });
    
    return history;
  }
}