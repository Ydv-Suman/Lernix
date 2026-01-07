import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../../NavBar';
import { chapterFilesAPI } from '../../../services/api';

const Summarize = () => {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [startTime, setStartTime] = useState(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    fetchFiles();
  }, [courseId, chapterId]);

  // Cleanup effect: Record time when component unmounts or user navigates away
  useEffect(() => {
    startTimeRef.current = startTime;

    return () => {
      const currentStartTime = startTimeRef.current;
      if (currentStartTime && selectedFileId && courseId && chapterId) {
        const durationSeconds = Math.floor((Date.now() - currentStartTime) / 1000);
        if (durationSeconds > 0) {
          // Fire and forget - don't block navigation
          chapterFilesAPI.summarize(
            parseInt(courseId),
            parseInt(chapterId),
            selectedFileId,
            durationSeconds
          ).catch(err => {
            console.error('Failed to record summary duration on cleanup:', err);
          });
        }
      }
    };
  }, [startTime, selectedFileId, courseId, chapterId]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const filesData = await chapterFilesAPI.list(parseInt(courseId), parseInt(chapterId));
      const filesList = Array.isArray(filesData) ? filesData : [];
      setFiles(filesList);
      if (filesList.length === 1) {
        setSelectedFileId(filesList[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedFileId) {
      setError('Please select a file');
      return;
    }

    // Start tracking time
    const activityStartTime = Date.now();
    setStartTime(activityStartTime);
    startTimeRef.current = activityStartTime;

    setSubmitting(true);
    setError('');
    setSummary('');

    try {
      // Calculate duration from when user clicked until now
      const durationSeconds = Math.floor((Date.now() - activityStartTime) / 1000);
      
      const response = await chapterFilesAPI.summarize(
        parseInt(courseId),
        parseInt(chapterId),
        selectedFileId,
        durationSeconds
      );
      setSummary(response.summary || response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate summary');
    } finally {
      setSubmitting(false);
      setStartTime(null);
      startTimeRef.current = null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-700">Loading files...</p>
        </main>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <button
            onClick={() => navigate(`/courses/${courseId}/chapters`)}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Chapters
          </button>
          <p className="text-gray-600">No files available for this chapter.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <button
            onClick={async () => {
              // Record time if activity was started
              if (startTime && selectedFileId) {
                const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
                if (durationSeconds > 0) {
                  try {
                    await chapterFilesAPI.summarize(
                      parseInt(courseId),
                      parseInt(chapterId),
                      selectedFileId,
                      durationSeconds
                    );
                  } catch (err) {
                    console.error('Failed to record summary duration:', err);
                  }
                }
              }
              navigate(`/courses/${courseId}/chapters`);
            }}
            className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Chapters
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">Summarize Document</h2>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <select
              value={selectedFileId || ''}
              onChange={(e) => setSelectedFileId(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a file...</option>
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.file_name} ({(file.file_size / 1024).toFixed(2)} KB)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSummarize}
            disabled={!selectedFileId || submitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Generating Summary...' : 'Generate Summary'}
          </button>

          {summary && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Summarize;

