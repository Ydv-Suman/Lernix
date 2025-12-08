import { useEffect, useRef, useState } from 'react';
import NavBar from './NavBar';
import { coursesAPI } from '../services/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
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

  useEffect(() => {
    fetchCourses();
  }, []);

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

      // Close form after create
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

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update course');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setDeleting(courseId);
    setError('');
    setSuccess('');
    setMenuOpenId(null);

    try {
      await coursesAPI.delete(courseId);
      setSuccess('Course deleted successfully');
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete course');
    } finally {
      setDeleting(null);
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
            <button
              onClick={fetchCourses}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
              type="button"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-gray-700">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="text-gray-600">No courses yet. Add your first one below.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {courses.map((course) => (
                <li key={course.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">

                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{course.title}</h4>
                          <p className="text-gray-700 mt-1">{course.description}</p>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => handleMenuToggle(course.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer"
                          >
                            ⋮
                          </button>

                          {menuOpenId === course.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                              <button
                                type="button"
                                onClick={() => startEdit(course)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(course.id)}
                                disabled={deleting === course.id}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 cursor-pointer disabled:opacity-50"
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
          )}


          {/* Add Course Button */}
          <div className="pt-6 flex justify-center">
            <button
              type="button"
              onClick={scrollToCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Add Course'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
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

export default Courses;
