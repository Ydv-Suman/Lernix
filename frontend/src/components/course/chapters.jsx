import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';
import { chaptersAPI, coursesAPI, chapterFilesAPI } from '../../services/api';

const Chapters = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [course, setCourse] = useState(null);
  const [chapterFiles, setChapterFiles] = useState({}); // chapterId -> files array
  const [filesLoading, setFilesLoading] = useState({}); // chapterId -> loading state
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editChapterId, setEditChapterId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [uploadingChapterId, setUploadingChapterId] = useState(null);
  const [viewingFileContent, setViewingFileContent] = useState(null); // { fileId, content, fileName }
  const [loadingFileContent, setLoadingFileContent] = useState(null); // fileId being loaded
  const [deletingFileId, setDeletingFileId] = useState(null); // fileId being deleted

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchChapters();
    } else {
      setError('Course ID is required');
      setLoading(false);
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const courses = await coursesAPI.list();
      const foundCourse = courses.find(c => c.id === parseInt(courseId));
      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        setError('Course not found');
        navigate('/courses');
      }
    } catch (err) {
      setError('Failed to load course');
      console.error('Failed to load course:', err);
    }
  };

  const fetchChapters = async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError('');
    try {
      const chaptersData = await chaptersAPI.listByCourse(parseInt(courseId));
      const chaptersList = Array.isArray(chaptersData) ? chaptersData : [];
      setChapters(chaptersList);
      
      // Fetch files for each chapter
      chaptersList.forEach(chapter => {
        fetchChapterFiles(chapter.id);
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const fetchChapterFiles = async (chapterId) => {
    if (!courseId) return;
    
    setFilesLoading(prev => ({ ...prev, [chapterId]: true }));
    try {
      const files = await chapterFilesAPI.list(parseInt(courseId), chapterId);
      setChapterFiles(prev => ({
        ...prev,
        [chapterId]: Array.isArray(files) ? files : []
      }));
    } catch (err) {
      console.error(`Failed to load files for chapter ${chapterId}:`, err);
      setChapterFiles(prev => ({
        ...prev,
        [chapterId]: []
      }));
    } finally {
      setFilesLoading(prev => ({ ...prev, [chapterId]: false }));
    }
  };

  const handleFileSelect = (chapterId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError(`File type not allowed. Allowed types: PDF, DOCX, DOC, TXT`);
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size exceeds maximum allowed size of 10MB`);
      return;
    }

    handleFileUpload(chapterId, file);
  };

  const handleFileUpload = async (chapterId, file) => {
    if (!courseId) return;

    setUploadingChapterId(chapterId);
    setError('');
    setSuccess('');

    try {
      await chapterFilesAPI.upload(parseInt(courseId), chapterId, file);
      setSuccess(`File "${file.name}" uploaded successfully`);
      // Refresh files for this chapter
      await fetchChapterFiles(chapterId);
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to upload file: ${err.message}`);
    } finally {
      setUploadingChapterId(null);
      // Reset file input
      const input = document.getElementById(`file-input-${chapterId}`);
      if (input) input.value = '';
    }
  };

  const handleViewFileContent = async (fileId, fileName) => {
    if (!courseId) return;

    setLoadingFileContent(fileId);
    setError('');
    
    try {
      // Find the chapter ID for this file
      let chapterId = null;
      for (const [chId, files] of Object.entries(chapterFiles)) {
        if (files.some(f => f.id === fileId)) {
          chapterId = parseInt(chId);
          break;
        }
      }

      if (!chapterId) {
        setError('Chapter not found for this file');
        return;
      }

      const response = await chapterFilesAPI.getContent(parseInt(courseId), chapterId, fileId);
      setViewingFileContent({
        fileId,
        fileName: response.file_name || fileName,
        content: response.content
      });
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to load file content: ${err.message}`);
    } finally {
      setLoadingFileContent(null);
    }
  };

  const closeFileContent = () => {
    setViewingFileContent(null);
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    if (!courseId) return;

    setDeletingFileId(fileId);
    setError('');
    setSuccess('');

    try {
      // Find the chapter ID for this file
      let chapterId = null;
      for (const [chId, files] of Object.entries(chapterFiles)) {
        if (files.some(f => f.id === fileId)) {
          chapterId = parseInt(chId);
          break;
        }
      }

      if (!chapterId) {
        setError('Chapter not found for this file');
        return;
      }

      await chapterFilesAPI.delete(parseInt(courseId), chapterId, fileId);
      setSuccess(`File "${fileName}" deleted successfully`);
      
      // Refresh files for this chapter
      await fetchChapterFiles(chapterId);
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to delete file: ${err.message}`);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    setSubmitting(true);
    try {
      await chaptersAPI.create(parseInt(courseId), {
        title: formData.title.trim(),
        description: formData.description.trim(),
      });

      setFormData({ title: '', description: '' });
      setSuccess('Chapter created successfully');
      setShowCreateForm(false);

      await fetchChapters();

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create chapter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuToggle = (chapterId) => {
    setMenuOpenId((prev) => (prev === chapterId ? null : chapterId));
  };

  const startEdit = (chapter) => {
    setEditChapterId(chapter.id);
    setEditForm({
      title: chapter.chapter_title || chapter.title || '',
      description: chapter.chapter_description || chapter.description || ''
    });
    setMenuOpenId(null);
    setError('');
    setSuccess('');
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editChapterId) return;

    if (!editForm.title.trim() || !editForm.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      if (!courseId) {
        setError('Course ID is required');
        return;
      }

      await chaptersAPI.update(parseInt(courseId), editChapterId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });

      setEditChapterId(null);
      setEditForm({ title: '', description: '' });
      setSuccess('Chapter updated successfully');
      await fetchChapters();

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update chapter');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (chapterId) => {
    if (!window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    setDeleting(chapterId);
    setError('');
    setSuccess('');
    setMenuOpenId(null);

    try {
      if (!courseId) {
        setError('Course ID is required');
        return;
      }

      await chaptersAPI.delete(parseInt(courseId), chapterId);
      setSuccess('Chapter deleted successfully');
      // Remove files from state for deleted chapter
      setChapterFiles(prev => {
        const updated = { ...prev };
        delete updated[chapterId];
        return updated;
      });
      await fetchChapters();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete chapter');
    } finally {
      setDeleting(null);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          {loading ? (
            <p className="text-gray-700">Loading...</p>
          ) : (
            <p className="text-red-600">{error || 'Course not found'}</p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header>
          <button
            onClick={() => navigate('/courses')}
            className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 cursor-pointer"
          >
            ← Back to Courses
          </button>
          <h2 className="text-3xl font-semibold text-gray-900">{course.title}</h2>
          <p className="text-gray-700 mt-2">{course.description}</p>
        </header>

        <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Chapters</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchChapters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md">
              {success}
            </div>
          )}

          {loading ? (
            <p className="text-gray-700">Loading chapters...</p>
          ) : chapters.length === 0 ? (
            <p className="text-gray-600">No chapters yet. Add your first one below.</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {editChapterId === chapter.id ? (
                        <form onSubmit={submitEdit} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              name="title"
                              value={editForm.title}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              name="description"
                              value={editForm.description}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              rows="3"
                              required
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              disabled={updating}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm cursor-pointer"
                            >
                              {updating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditChapterId(null)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <h5 className="text-base font-semibold text-gray-900">
                            {chapter.chapter_title || chapter.title}
                          </h5>
                          <p className="text-gray-700 mt-1 text-sm">
                            {chapter.chapter_description || chapter.description}
                          </p>
                          <div className="mt-4 space-y-3">
                            {/* Upload File Button - Always visible */}
                            <div>
                              <input
                                type="file"
                                id={`file-input-${chapter.id}`}
                                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                onChange={(e) => handleFileSelect(chapter.id, e)}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const fileInput = document.getElementById(`file-input-${chapter.id}`);
                                  if (fileInput) fileInput.click();
                                }}
                                disabled={uploadingChapterId === chapter.id}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                              >
                                {uploadingChapterId === chapter.id ? 'Uploading...' : '📤 Upload File'}
                              </button>
                            </div>

                            {/* Files List and Action Buttons - Only show if files exist */}
                            {(chapterFiles[chapter.id] && chapterFiles[chapter.id].length > 0) && (
                              <>
                                <section className="bg-gray-50 rounded-lg p-3">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">Files ({chapterFiles[chapter.id].length})</h6>
                                  <ul className="space-y-2">
                                    {chapterFiles[chapter.id].map((file) => (
                                      <li key={file.id} className="text-sm text-gray-600 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs">📄</span>
                                          <span>{file.file_name}</span>
                                          <span className="text-xs text-gray-500">
                                            ({(file.file_size / 1024).toFixed(2)} KB)
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleViewFileContent(file.id, file.file_name)}
                                            disabled={loadingFileContent === file.id}
                                            className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                                          >
                                            {loadingFileContent === file.id ? 'Loading...' : 'View Content'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteFile(file.id, file.file_name)}
                                            disabled={deletingFileId === file.id}
                                            className="px-2 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                          >
                                            {deletingFileId === file.id ? 'Deleting...' : 'Delete'}
                                          </button>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/courses/${courseId}/chapters/${chapter.id}/summarize`)}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 cursor-pointer"
                                  >
                                    Summarize
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/courses/${courseId}/chapters/${chapter.id}/ask-question`)}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 cursor-pointer"
                                  >
                                    Ask Question
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/courses/${courseId}/chapters/${chapter.id}/create-mcq`)}
                                    className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 cursor-pointer"
                                  >
                                    Create MCQ
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {editChapterId !== chapter.id && (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => handleMenuToggle(chapter.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-600 cursor-pointer"
                          >
                            ⋮
                          </button>

                          {menuOpenId === chapter.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <button
                                type="button"
                                onClick={() => startEdit(chapter)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(chapter.id)}
                                disabled={deleting === chapter.id}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 cursor-pointer disabled:opacity-50"
                              >
                                {deleting === chapter.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Chapter Button */}
          <div className="pt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
            >
              Add Chapter
            </button>
          </div>
        </section>

        {showCreateForm && (
          <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create a Chapter</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Chapter title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Brief description"
                  rows="3"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Add Chapter'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ title: '', description: '' });
                    setError('');
                    setSuccess('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* File Content Modal */}
        {viewingFileContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {viewingFileContent.fileName}
                </h3>
                <button
                  type="button"
                  onClick={closeFileContent}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {viewingFileContent.content}
                </pre>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={closeFileContent}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chapters;
