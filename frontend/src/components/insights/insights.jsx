import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';
import { coursesAPI, insightsAPI, chaptersAPI } from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Insights = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [summaryData, setSummaryData] = useState([]);
  const [askData, setAskData] = useState([]);
  const [mcqData, setMcqData] = useState([]);
  const [viewContentData, setViewContentData] = useState([]);
  const [totalTimeData, setTotalTimeData] = useState([]);
  const [mcqAttempts, setMcqAttempts] = useState([]);
  const [mcqAccuracyData, setMcqAccuracyData] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseData(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await coursesAPI.list();
      setCourses(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedCourseId(data[0].id);
        setSelectedCourse(data[0]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseData = async (courseId) => {
    setError('');
    try {
      // Fetch chapters
      const chaptersData = await chaptersAPI.listByCourse(courseId);
      setChapters(Array.isArray(chaptersData) ? chaptersData : []);

      // Fetch activity time data
      const [viewContent, summary, ask, mcq] = await Promise.all([
        insightsAPI.getActivityTimeByChapter(courseId, 'view_content'),
        insightsAPI.getActivityTimeByChapter(courseId, 'summary'),
        insightsAPI.getActivityTimeByChapter(courseId, 'ask'),
        insightsAPI.getActivityTimeByChapter(courseId, 'mcq')
      ]);

      // Convert time from seconds to minutes
      const convertToMinutes = (data) => {
        return (data || []).map(item => ({
          ...item,
          time_spent_seconds: Math.round(item.time_spent_seconds / 60)
        }));
      };

      setViewContentData(convertToMinutes(viewContent));
      setSummaryData(convertToMinutes(summary));
      setAskData(convertToMinutes(ask));
      setMcqData(convertToMinutes(mcq));
      

      // Calculate total time per chapter (convert to minutes)
      const chapterMap = new Map();
      chaptersData.forEach(ch => {
        chapterMap.set(ch.id, { chapter_id: ch.id, chapter_name: ch.chapter_title, total: 0 });
      });

      [...viewContent, ...summary, ...ask, ...mcq].forEach(item => {
        if (chapterMap.has(item.chapter_id)) {
          chapterMap.get(item.chapter_id).total += item.time_spent_seconds || 0;
        }
      });

      // Convert total seconds to minutes
      const totalTimeDataInMinutes = Array.from(chapterMap.values()).map(item => ({
        ...item,
        total: Math.round(item.total / 60)
      }));
      setTotalTimeData(totalTimeDataInMinutes);

      // Fetch MCQ attempts
      const mcqAttemptsData = await insightsAPI.getMCQAttempts(courseId);
      setMcqAttempts(mcqAttemptsData || []);

      // Calculate MCQ accuracy data from the API response
      const accuracyData = (mcqAttemptsData || []).map(item => ({
        chapter_id: item.chapter_id,
        chapter_name: item.chapter_name,
        attempts: item.attempts || 0,
        avgScore: item.avg_score || 0
      }));

      setMcqAccuracyData(accuracyData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load insights data');
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourseId(course.id);
    setSelectedCourse(course);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0 min';
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  // TODO: Add ML-based recommendations when model is ready
  // For now, keep recommendations empty until ML model is implemented
  const recommendations = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar - Course List */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Courses</h2>
          </div>
          <div className="p-2">
            {loading ? (
              <p className="text-sm text-gray-500 p-2">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-gray-500 p-2">No courses available</p>
            ) : (
              <ul className="space-y-1">
                {courses.map((course) => (
                  <li key={course.id}>
                    <button
                      onClick={() => handleCourseSelect(course)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        selectedCourseId === course.id
                          ? 'bg-[#FF6B35]/80 text-indigo-700'
                          : 'text-gray-700 hover:bg-[#E55A2B]'
                      }`}
                    >
                      {course.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {!selectedCourse ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Select a course to view insights</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900">{selectedCourse.title}</h1>
                <p className="text-gray-600 mt-1">{selectedCourse.description}</p>
              </div>

              {/* Four Line Graphs - Top Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                {/* Summary Time Graph */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Time</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={summaryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="chapter_name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} min`} />
                      <Line 
                        type="monotone" 
                        dataKey="time_spent_seconds" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Time (minutes)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Ask Questions Time Graph */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask Questions Time</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={askData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="chapter_name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} min`} />
                      <Line 
                        type="monotone" 
                        dataKey="time_spent_seconds" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Time (minutes)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* MCQ Time Graph */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">MCQ Time</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={mcqData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="chapter_name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} min`} />
                      <Line 
                        type="monotone" 
                        dataKey="time_spent_seconds" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Time (minutes)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* View Content Time Graph */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">View Content Time</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={viewContentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="chapter_name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} min`} />
                      <Line 
                        type="monotone" 
                        dataKey="time_spent_seconds" 
                        stroke="#ec4899" 
                        strokeWidth={2}
                        name="Time (minutes)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Section and MCQ Accuracy - Second Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Total Time Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Time Spent</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={totalTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="chapter_name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} min`} />
                      <Bar dataKey="total" fill="#8b5cf6" name="Total Time (minutes)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* MCQ Accuracy Graph */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">MCQ Accuracy</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={mcqAccuracyData.filter(d => d.attempts > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="chapter_name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="avgScore" fill="#ef4444" name="Average Score %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MCQ Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">MCQ Attempts</h3>
                {mcqAttempts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No MCQ attempts recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Chapter
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attempts
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Average Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mcqAccuracyData
                          .filter(d => d.attempts > 0)
                          .map((item) => (
                            <tr key={item.chapter_id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.chapter_name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.attempts}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.avgScore}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recommendations Panel */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                {recommendations && recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border-l-4 ${
                          rec.type === 'not_attempted'
                            ? 'bg-blue-50 border-blue-400'
                            : rec.type === 'needs_practice'
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-green-50 border-green-400'
                        }`}
                      >
                        <p className="text-sm text-gray-800">{rec.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No recommendations available at this time.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;

