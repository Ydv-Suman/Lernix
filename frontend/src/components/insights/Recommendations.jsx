import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';
import { coursesAPI, insightsAPI } from '../../services/api';

const stateStyles = {
  revise_urgent: {
    badge: 'bg-[#ffe8df] text-[#b33b17]',
    border: 'border-[#ffb292]',
    accent: 'bg-[#fff4ef]',
    label: 'Revise urgently',
  },
  practice_more: {
    badge: 'bg-[#fff1cc] text-[#9a6800]',
    border: 'border-[#f1ce73]',
    accent: 'bg-[#fffaf0]',
    label: 'Practice more',
  },
  on_track: {
    badge: 'bg-[#e4f3f2] text-[#1f5c5b]',
    border: 'border-[#a9d0cd]',
    accent: 'bg-[#f4fbfa]',
    label: 'On track',
  },
  mastered: {
    badge: 'bg-[#e7f5ea] text-[#22693d]',
    border: 'border-[#a6d7b4]',
    accent: 'bg-[#f4fbf5]',
    label: 'Mastered',
  },
  default: {
    badge: 'bg-slate-100 text-slate-700',
    border: 'border-slate-200',
    accent: 'bg-white',
    label: 'Review',
  },
};

const formatRecommendationText = (chapterName, recommendationText) => {
  if (!recommendationText) {
    return '';
  }

  const escapedChapterName = chapterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return recommendationText
    .trim()
    .replace(new RegExp(`^${escapedChapterName}\\.?\\s*`, 'i'), '')
    .replace(/\.\.+/g, '.');
};

const Recommendations = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchRecommendations(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await coursesAPI.list();
      const courseList = Array.isArray(data) ? data : [];
      setCourses(courseList);

      if (courseList.length > 0) {
        setSelectedCourseId(courseList[0].id);
        setSelectedCourse(courseList[0]);
      } else {
        setSelectedCourseId(null);
        setSelectedCourse(null);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (courseId) => {
    setLoadingRecommendations(true);
    setError('');

    try {
      const response = await insightsAPI.getRecommendations(courseId);
      setRecommendations(Array.isArray(response?.recommendations) ? response.recommendations : []);
    } catch (err) {
      setRecommendations([]);
      setError(err.response?.data?.detail || 'Failed to load recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedCourseId(course.id);
  };

  const summaryCounts = recommendations.reduce(
    (acc, recommendation) => {
      acc.total += 1;

      if (recommendation.predicted_state === 'revise_urgent') {
        acc.reviseUrgent += 1;
      } else if (recommendation.predicted_state === 'practice_more') {
        acc.practiceMore += 1;
      } else if (recommendation.predicted_state === 'on_track') {
        acc.onTrack += 1;
      } else if (recommendation.predicted_state === 'mastered') {
        acc.mastered += 1;
      }

      return acc;
    },
    { total: 0, reviseUrgent: 0, practiceMore: 0, onTrack: 0, mastered: 0 }
  );

  return (
    <div className="min-h-screen bg-[#f7f4ed]">
      <NavBar />

      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <aside className="w-full shrink-0 overflow-hidden rounded-[28px] border border-[#d6ddd7] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:w-80">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-extrabold tracking-[-0.03em] text-slate-900">Course</h2>
          </div>

          <div className="p-3">
            {loading ? (
              <p className="rounded-2xl bg-[#f7f4ed] px-4 py-3 text-sm text-slate-500">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="rounded-2xl bg-[#f7f4ed] px-4 py-3 text-sm text-slate-500">No courses available.</p>
            ) : (
              <ul className="space-y-2">
                {courses.map((course) => {
                  const isSelected = selectedCourseId === course.id;

                  return (
                    <li key={course.id}>
                      <button
                        onClick={() => handleCourseSelect(course)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          isSelected
                            ? 'border-[#1f5c5b] bg-[#1f5c5b] text-white shadow-[0_20px_40px_rgba(31,92,91,0.22)]'
                            : 'border-transparent bg-[#f7f4ed] text-slate-700 hover:border-[#d6ddd7] hover:bg-white'
                        }`}
                        type="button"
                      >
                        <p className="text-sm font-semibold">{course.title}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          {error && (
            <div className="rounded-3xl border border-[#ffcfbd] bg-[#fff4ef] px-5 py-4 text-sm font-medium text-[#b33b17]">
              {error}
            </div>
          )}

          {!selectedCourse ? (
            <section className="rounded-[32px] border border-[#d6ddd7] bg-white px-8 py-12 text-center shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-slate-900">No course selected</h1>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                Create a course first, then come back here to view personalized study recommendations.
              </p>
            </section>
          ) : (
            <>
              <section className="overflow-hidden rounded-[28px] border border-[#d6ddd7] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
                <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(31,92,91,0.12),_transparent_42%),linear-gradient(135deg,#ffffff,#f7f4ed)] px-6 py-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Course focus</p>
                      <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-slate-900">
                        {selectedCourse.title}
                      </h1>
                    </div>

                    <button
                      onClick={() => navigate(`/courses/${selectedCourse.id}/chapters`)}
                      className="inline-flex items-center justify-center rounded-full bg-[#ff6b35] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,107,53,0.24)] transition hover:bg-[#e85d29]"
                      type="button"
                    >
                      Open course chapters
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 px-6 py-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#d6ddd7] bg-[#f7f4ed] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">Total</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-slate-900">
                      {summaryCounts.total}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#f1ce73] bg-[#fffaf0] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#9a6800]">Needs attention</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-slate-900">
                      {summaryCounts.reviseUrgent + summaryCounts.practiceMore}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#a6d7b4] bg-[#f4fbf5] px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-[#22693d]">On track</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-slate-900">
                      {summaryCounts.onTrack}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#d6ddd7] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Study signals</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-slate-900">
                      Chapter recommendations
                    </h2>
                  </div>
                </div>

                {loadingRecommendations ? (
                  <p className="mt-6 rounded-2xl bg-[#f7f4ed] px-4 py-4 text-sm text-slate-500">
                    Loading recommendations...
                  </p>
                ) : recommendations.length === 0 ? (
                  <div className="mt-6 rounded-[28px] border border-dashed border-[#d6ddd7] bg-[#f7f4ed] px-6 py-10 text-center">
                    <p className="text-lg font-semibold text-slate-900">No recommendations available.</p>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                      Generate more learning activity for this course to get chapter-specific guidance here.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 xl:grid-cols-2">
                    {recommendations.map((recommendation, index) => {
                      const style = stateStyles[recommendation.predicted_state] || stateStyles.default;

                      return (
                        <article
                          key={recommendation.chapter_id || index}
                          className={`rounded-[22px] border p-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)] ${style.border} ${style.accent}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="pr-2 text-base font-bold tracking-[-0.02em] text-slate-900">
                              {recommendation.chapter_name}
                            </h3>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${style.badge}`}>
                              {style.label}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {formatRecommendationText(recommendation.chapter_name, recommendation.recommendation)}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Recommendations;
