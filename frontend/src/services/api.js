import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/create', userData);
    return response.data;
  },
};

export const coursesAPI = {
  list: async () => {
    const response = await api.get('/courses/');
    return response.data;
  },
  create: async (course) => {
    const response = await api.post('/courses/createCourse', course);
    return response.data;
  },
  update: async (courseId, course) => {
    const response = await api.put(`/courses/updateCourse/${courseId}`, course);
    return response.data;
  },
  delete: async (courseId) => {
    const response = await api.delete(`/courses/deleteCourse/${courseId}`);
    return response.data;
  }
};

export const chaptersAPI = {
  listByCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/chapter`);
    return response.data;
  },
  getById: async (courseId, chapterId) => {
    const response = await api.get(`/courses/${courseId}/chapter/${chapterId}`);
    return response.data;
  },
  create: async (courseId, chapter) => {
    const response = await api.post(`/courses/${courseId}/chapter/createChapter/`, chapter);
    return response.data;
  },
  update: async (courseId, chapterId, chapter) => {
    const response = await api.put(`/courses/${courseId}/chapter/updateChapter/${chapterId}`, chapter);
    return response.data;
  },
  delete: async (courseId, chapterId) => {
    const response = await api.delete(`/courses/${courseId}/chapter/deleteChapter/${chapterId}`);
    return response.data;
  }
};

export const chapterFilesAPI = {
  list: async (courseId, chapterId) => {
    const response = await api.get(`/courses/${courseId}/chapter/${chapterId}/files/`);
    return response.data;
  },
  upload: async (courseId, chapterId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
      `/courses/${courseId}/chapter/${chapterId}/files/uploadFile`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
  getContent: async (courseId, chapterId, fileId) => {
    const response = await api.get(`/courses/${courseId}/chapter/${chapterId}/files/${fileId}/content`);
    return response.data;
  },
  recordViewingDuration: async (courseId, chapterId, fileId, durationSeconds) => {
    const response = await api.post(
      `/courses/${courseId}/chapter/${chapterId}/files/${fileId}/record-viewing`,
      { duration_seconds: durationSeconds }
    );
    return response.data;
  },
  delete: async (courseId, chapterId, fileId) => {
    const response = await api.delete(`/courses/${courseId}/chapter/${chapterId}/files/delete/${fileId}`);
    return response.data;
  },
  askQuestion: async (courseId, chapterId, fileId, question, durationSeconds = 0) => {
    const response = await api.post(
      `/courses/${courseId}/chapter/${chapterId}/files/${fileId}/ask_question/`,
      { question: question.trim(), duration_seconds: durationSeconds }
    );
    return response.data;
  },
  summarize: async (courseId, chapterId, fileId, durationSeconds = 0) => {
    const response = await api.post(
      `/courses/${courseId}/chapter/${chapterId}/files/${fileId}/summarize/`,
      { duration_seconds: durationSeconds }
    );
    return response.data;
  },
  createMCQ: async (courseId, chapterId, fileId) => {
    const response = await api.post(
      `/courses/${courseId}/chapter/${chapterId}/files/${fileId}/createMCQ/`
    );
    return response.data;
  },
  submitMCQ: async (courseId, chapterId, fileId, answers, timeSpent, fullQuestions = null) => {
    const response = await api.post(
      `/courses/${courseId}/chapter/${chapterId}/files/${fileId}/createMCQ/submit`,
      {
        answers: answers,
        time_spent_seconds: timeSpent,
        full_questions: fullQuestions
      }
    );
    return response.data;
  }
};

export const insightsAPI = {
  getTotalTimeByCourse: async () => {
    const response = await api.get('/insights/total-time');
    return response.data;
  },
  getActivityTimeByChapter: async (courseId, activityType = 'summary') => {
    const response = await api.get('/insights/activity-time', {
      params: { course_id: courseId, activity_type: activityType }
    });
    return response.data;
  },
  // Placeholder for MCQ attempts - to be implemented
  getMCQAttempts: async (courseId) => {
    // This endpoint needs to be created in the backend
    try {
      const response = await api.get(`/insights/mcq-attempts?course_id=${courseId}`);
      return response.data;
    } catch (error) {
      // Return empty array if endpoint doesn't exist yet
      return [];
    }
  },
  getRecommendations: async (courseId) => {
    const response = await api.get('/insights/recommendation', {
      params: { course_id: courseId }
    });
    return response.data;
  }
};

export default api;
