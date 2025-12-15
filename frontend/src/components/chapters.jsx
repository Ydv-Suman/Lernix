import { useEffect, useState } from 'react';
import NavBar from './NavBar';
import { chaptersAPI, coursesAPI } from '../services/api';

const Chapters = () => {
  const [chapters, setChapters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', courseId: '' });
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
  const [expandedCourses, setExpandedCourses] = useState(new Set()); // Track expanded courses

  useEffect(() => {
    fetchCourses();
    fetchChapters();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await coursesAPI.list();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const fetchChapters = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await chaptersAPI.list();
      setChapters(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load chapters');
    } finally {
      setLoading(false);
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

    if (!formData.title.trim() || !formData.description.trim() || !formData.courseId) {
      setError('Title, description, and course are required');
      return;
    }

    setSubmitting(true);
    try {
      await chaptersAPI.create(parseInt(formData.courseId), {
        title: formData.title.trim(),
        description: formData.description.trim(),
      });

      setFormData({ title: '', description: '', courseId: '' });
      setSuccess('Chapter created successfully');
      setShowCreateForm(false);

      // Expand the course that the chapter was added to
      setExpandedCourses(prev => new Set(prev).add(parseInt(formData.courseId)));

      fetchChapters();

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create chapter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuToggle = (chapterId) => {
    setMenuOpenId((prev) => (prev === chapterId ? null : chapterId));
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
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
      await chaptersAPI.update(editChapterId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });

      setEditChapterId(null);
      setEditForm({ title: '', description: '' });
      setSuccess('Chapter updated successfully');
      fetchChapters();

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
      await chaptersAPI.delete(chapterId);
      setSuccess('Chapter deleted successfully');
      fetchChapters();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete chapter');
    } finally {
      setDeleting(null);
    }
  };

  // Group chapters by course
  const chaptersByCourse = courses.reduce((acc, course) => {
    acc[course.id] = chapters.filter(chapter => chapter.course_id === course.id);
    return acc;
  }, {});

  // Get courses that have chapters
  const coursesWithChapters = courses.filter(course => {
    const courseChapters = chaptersByCourse[course.id] || [];
    return courseChapters.length > 0;
  });

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header>
          <h2 className="text-3xl font-semibold text-gray-900">Chapters</h2>
          <p className="text-gray-700 mt-2">Manage chapters organized by their courses.</p>
        </header>

        <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Chapters by Course</h3>
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
          ) : coursesWithChapters.length === 0 ? (
            <p className="text-gray-600">No chapters yet. Add your first one below.</p>
          ) : (
            <div className="space-y-4">
              {coursesWithChapters.map((course) => {
                const courseChapters = chaptersByCourse[course.id] || [];
                const isExpanded = expandedCourses.has(course.id);

                return (
                  <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Course Header */}
                    <div
                      className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg
                            className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <h4 className="text-lg font-semibold text-gray-900">{course.title}</h4>
                          <span className="text-sm text-gray-500">
                            ({courseChapters.length} {courseChapters.length === 1 ? 'chapter' : 'chapters'})
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 max-w-md truncate">{course.description}</p>
                      </div>
                    </div>

                    {/* Chapters List */}
                    {isExpanded && (
                      <div className="divide-y divide-gray-200">
                        {courseChapters.length === 0 ? (
                          <div className="px-4 py-3 text-gray-500 text-sm">
                            No chapters in this course yet.
                          </div>
                        ) : (
                          courseChapters.map((chapter) => (
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
                                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
                                        >
                                          {updating ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditChapterId(null)}
                                          className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
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
                                    </div>
                                  )}
                                </div>

                                {editChapterId !== chapter.id && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">ID: {chapter.id}</span>
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
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

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
                    setFormData({ title: '', description: '', courseId: '' });
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
      </main>
    </div>
  );
};

export default Chapters;
