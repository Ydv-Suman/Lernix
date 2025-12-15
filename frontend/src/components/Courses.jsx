import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import { coursesAPI, chaptersAPI } from '../services/api';

const Courses = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Course form states
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editCourseId, setEditCourseId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const createSectionRef = useRef(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  // Chapter form states
  const [chapterFormData, setChapterFormData] = useState({ title: '', description: '' });
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterSubmitting, setChapterSubmitting] = useState(false);
  const [chapterUpdating, setChapterUpdating] = useState(false);
  const [chapterDeleting, setChapterDeleting] = useState(null);
  const [editChapterId, setEditChapterId] = useState(null);
  const [editChapterForm, setEditChapterForm] = useState({ title: '', description: '' });
  const [chapterMenuOpenId, setChapterMenuOpenId] = useState(null);
  const [showChapterCreateForm, setShowChapterCreateForm] = useState(false);

  useEffect(() => {
    fetchCourses();
    if (courseId) {
      loadCourseDetail(parseInt(courseId));
    }
  }, [courseId]);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await coursesAPI.list();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDetail = async (id) => {
    setChaptersLoading(true);
    setError('');
    try {
      // Fetch all courses to find the selected one
      const allCourses = await coursesAPI.list();
      const foundCourse = allCourses.find(c => c.id === id);
      
      if (foundCourse) {
        setSelectedCourse(foundCourse);
        // Also update the courses list
        setCourses(allCourses);
      } else {
        setError('Course not found');
        navigate('/courses');
        return;
      }

      // Fetch chapters for this course
      const chaptersData = await chaptersAPI.listByCourse(id);
      setChapters(Array.isArray(chaptersData) ? chaptersData : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load course details');
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleCourseClick = (course) => {
    navigate(`/courses/${course.id}`);
  };

  const handleBackToList = () => {
    navigate('/courses');
    setSelectedCourse(null);
    setChapters([]);
  };

  // Course CRUD handlers
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

    setSubmitting(true);
    try {
      await coursesAPI.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
      });

      setFormData({ title: '', description: '' });
      setSuccess('Course created successfully');
      fetchCourses();
      setShowCreateForm(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuToggle = (courseId) => {
    setMenuOpenId((prev) => (prev === courseId ? null : courseId));
  };

  const startEdit = (course) => {
    setEditCourseId(course.id);
    setEditForm({ title: course.title, description: course.description });
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
    if (!editCourseId) return;

    if (!editForm.title.trim() || !editForm.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await coursesAPI.update(editCourseId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });

      setEditCourseId(null);
      setEditForm({ title: '', description: '' });
      setSuccess('Course updated successfully');
      fetchCourses();
      if (selectedCourse && selectedCourse.id === editCourseId) {
        loadCourseDetail(editCourseId);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update course');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This will also delete all chapters. This action cannot be undone.')) {
      return;
    }

    setDeleting(courseId);
    setError('');
    setSuccess('');
    setMenuOpenId(null);

    try {
      await coursesAPI.delete(courseId);
      setSuccess('Course deleted successfully');
      if (selectedCourse && selectedCourse.id === courseId) {
        handleBackToList();
      }
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete course');
    } finally {
      setDeleting(null);
    }
  };

  // Chapter CRUD handlers
  const handleChapterChange = (e) => {
    setChapterFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChapterSubmit = async (e) => {
    e.preventDefault();
    if (!courseId) return;

    setError('');
    setSuccess('');

    if (!chapterFormData.title.trim() || !chapterFormData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setChapterSubmitting(true);
    try {
      await chaptersAPI.create(parseInt(courseId), {
        title: chapterFormData.title.trim(),
        description: chapterFormData.description.trim(),
      });

      setChapterFormData({ title: '', description: '' });
      setSuccess('Chapter created successfully');
      setShowChapterCreateForm(false);
      loadCourseDetail(parseInt(courseId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create chapter');
    } finally {
      setChapterSubmitting(false);
    }
  };

  const handleChapterMenuToggle = (chapterId) => {
    setChapterMenuOpenId((prev) => (prev === chapterId ? null : chapterId));
  };

  const startChapterEdit = (chapter) => {
    setEditChapterId(chapter.id);
    setEditChapterForm({
      title: chapter.chapter_title || '',
      description: chapter.chapter_description || '',
    });
    setChapterMenuOpenId(null);
    setError('');
    setSuccess('');
  };

  const handleChapterEditChange = (e) => {
    setEditChapterForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submitChapterEdit = async (e) => {
    e.preventDefault();
    if (!editChapterId || !courseId) return;

    if (!editChapterForm.title.trim() || !editChapterForm.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setChapterUpdating(true);
    setError('');
    setSuccess('');

    try {
      await chaptersAPI.update(parseInt(courseId), editChapterId, {
        title: editChapterForm.title.trim(),
        description: editChapterForm.description.trim(),
      });

      setEditChapterId(null);
      setEditChapterForm({ title: '', description: '' });
      setSuccess('Chapter updated successfully');
      loadCourseDetail(parseInt(courseId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update chapter');
    } finally {
      setChapterUpdating(false);
    }
  };

  const handleChapterDelete = async (chapterId) => {
    if (!window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    if (!courseId) return;

    setChapterDeleting(chapterId);
    setError('');
    setSuccess('');
    setChapterMenuOpenId(null);

    try {
      await chaptersAPI.delete(parseInt(courseId), chapterId);
      setSuccess('Chapter deleted successfully');
      loadCourseDetail(parseInt(courseId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete chapter');
    } finally {
      setChapterDeleting(null);
    }
  };

  const scrollToCreate = () => {
    setShowCreateForm(true);
    setTimeout(() => {
      if (createSectionRef.current) {
        createSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  // If courseId is present, show course detail with chapters
  if (courseId && selectedCourse) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <header>
            <button
              onClick={handleBackToList}
              className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
            >
              ← Back to Courses
            </button>
            <h2 className="text-3xl font-semibold text-gray-900">{selectedCourse.title}</h2>
            <p className="text-gray-700 mt-2">{selectedCourse.description}</p>
          </header>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 text-green-800 border border-green-200 rounded-md">
              {success}
            </div>
          )}

          <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Chapters</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => loadCourseDetail(parseInt(courseId))}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setShowChapterCreateForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Chapter
                </button>
              </div>
            </div>

            {chaptersLoading ? (
              <p className="text-gray-700">Loading chapters...</p>
            ) : chapters.length === 0 ? (
              <p className="text-gray-600">No chapters yet. Add your first one above.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {chapters.map((chapter) => (
                  <li key={chapter.id} className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {editChapterId === chapter.id ? (
                          <form onSubmit={submitChapterEdit} className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                              <input
                                type="text"
                                name="title"
                                value={editChapterForm.title}
                                onChange={handleChapterEditChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                name="description"
                                value={editChapterForm.description}
                                onChange={handleChapterEditChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows="3"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={chapterUpdating}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {chapterUpdating ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditChapterId(null)}
                                className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {chapter.chapter_title}
                            </h4>
                            <p className="text-gray-700 mt-1">{chapter.chapter_description}</p>
                          </div>
                        )}
                      </div>

                      {editChapterId !== chapter.id && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 whitespace-nowrap">ID: {chapter.id}</span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => handleChapterMenuToggle(chapter.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
                            >
                              ⋮
                            </button>

                            {chapterMenuOpenId === chapter.id && (
                              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <button
                                  type="button"
                                  onClick={() => startChapterEdit(chapter)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleChapterDelete(chapter.id)}
                                  disabled={chapterDeleting === chapter.id}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 disabled:opacity-50"
                                >
                                  {chapterDeleting === chapter.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {showChapterCreateForm && (
            <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create a Chapter</h3>

              <form onSubmit={handleChapterSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={chapterFormData.title}
                    onChange={handleChapterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Chapter title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={chapterFormData.description}
                    onChange={handleChapterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Brief description"
                    rows="3"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={chapterSubmitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {chapterSubmitting ? 'Creating...' : 'Add Chapter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChapterCreateForm(false);
                      setChapterFormData({ title: '', description: '' });
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
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
  }

  // Show course list view
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header>
          <h2 className="text-3xl font-semibold text-gray-900">Courses</h2>
          <p className="text-gray-700 mt-2">Create and manage your courses.</p>
        </header>

        <section className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Your Courses</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  Grid
                </button>
              </div>
              <button
                onClick={fetchCourses}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
            <p className="text-gray-700">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="text-gray-600">No courses yet. Add your first one below.</p>
          ) : viewMode === 'list' ? (
            <ul className="divide-y divide-gray-200">
              {courses.map((course) => (
                <li key={course.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => handleCourseClick(course)}>
                          <h4 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                            {course.title}
                          </h4>
                          <p className="text-gray-700 mt-1">{course.description}</p>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => handleMenuToggle(course.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
                          >
                            ⋮
                          </button>

                          {menuOpenId === course.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <button
                                type="button"
                                onClick={() => startEdit(course)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(course.id)}
                                disabled={deleting === course.id}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 disabled:opacity-50"
                              >
                                {deleting === course.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {editCourseId === course.id && (
                        <form onSubmit={submitEdit} className="mt-3 space-y-3">
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
                              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {updating ? 'Saving...' : 'Save'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditCourseId(null)}
                              className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    <span className="text-sm text-gray-500 whitespace-nowrap">ID: {course.id}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative cursor-pointer"
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 pr-8 hover:text-indigo-600">
                        {course.title}
                      </h4>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuToggle(course.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
                        >
                          ⋮
                        </button>

                        {menuOpenId === course.id && (
                          <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(course);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(course.id);
                              }}
                              disabled={deleting === course.id}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 disabled:opacity-50"
                            >
                              {deleting === course.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-3">{course.description}</p>
                    <span className="text-xs text-gray-500">ID: {course.id}</span>

                    {editCourseId === course.id && (
                      <form
                        onSubmit={submitEdit}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 space-y-3 pt-3 border-t border-gray-200"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            name="title"
                            value={editForm.title}
                            onChange={handleEditChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            name="description"
                            value={editForm.description}
                            onChange={handleEditChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                            onClick={() => setEditCourseId(null)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-6 flex justify-center">
            <button
              type="button"
              onClick={scrollToCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Course
            </button>
          </div>
        </section>

        {showCreateForm && (
          <section
            ref={createSectionRef}
            className="bg-white shadow-sm rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create a Course</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Course title"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Add Course'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
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

export default Courses;
