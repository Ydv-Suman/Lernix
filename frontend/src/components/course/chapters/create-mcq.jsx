import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../../NavBar';
import { chapterFilesAPI } from '../../../services/api';

const CreateMcq = () => {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [fullQuestions, setFullQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [courseId, chapterId]);

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

  const handleCreateMCQ = async () => {
    if (!selectedFileId) {
      setError('Please select a file');
      return;
    }

    setSubmitting(true);
    setError('');
    setQuestions([]);
    setUserAnswers({});
    setResults(null);
    setStartTime(Date.now());

    try {
      const response = await chapterFilesAPI.createMCQ(
        parseInt(courseId),
        parseInt(chapterId),
        selectedFileId
      );
      
      if (response.questions && Array.isArray(response.questions)) {
        setQuestions(response.questions);
        // Store full questions for submission
        if (response.full_questions && Array.isArray(response.full_questions)) {
          setFullQuestions(response.full_questions);
        }
        // Initialize user answers
        const initialAnswers = {};
        response.questions.forEach(q => {
          initialAnswers[q.question_number] = '';
        });
        setUserAnswers(initialAnswers);
      } else {
        setError('Invalid response format from server');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate MCQs');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionNumber, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter(q => !userAnswers[q.question_number] || userAnswers[q.question_number].trim() === '');
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const response = await chapterFilesAPI.submitMCQ(
        parseInt(courseId),
        parseInt(chapterId),
        selectedFileId,
        userAnswers,
        timeSpent,
        fullQuestions
      );
      
      setResults(response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit answers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setFullQuestions([]);
    setUserAnswers({});
    setResults(null);
    setStartTime(null);
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
            onClick={() => navigate(`/courses/${courseId}/chapters`)}
            className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Chapters
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">MCQ Quiz</h2>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {!questions.length && !results && (
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
              onClick={handleCreateMCQ}
              disabled={!selectedFileId || submitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Generating MCQs...' : 'Generate MCQs'}
            </button>
          </div>
        )}

        {questions.length > 0 && !results && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Answer the following questions:
              </h3>
              <span className="text-sm text-gray-600">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-6">
              {questions.map((question) => (
                <div key={question.question_number} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="mb-4">
                    <p className="text-base font-medium text-gray-900 mb-3">
                      Question {question.question_number}: {question.question}
                    </p>
                    <div className="space-y-2 ml-4">
                      {Object.entries(question.options).map(([option, text]) => (
                        <label
                          key={option}
                          className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="radio"
                            name={`question-${question.question_number}`}
                            value={option}
                            checked={userAnswers[question.question_number] === option}
                            onChange={(e) => handleAnswerChange(question.question_number, e.target.value)}
                            className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          />
                          <span className="text-gray-700">
                            <span className="font-medium">{option})</span> {text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answers'}
              </button>
            </div>
          </div>
        )}

        {results && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h3>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-purple-600">
                  {results.score.percentage}%
                </div>
                <div className="text-gray-700">
                  <p className="text-lg">
                    You got <span className="font-semibold">{results.score.correct}</span> out of{' '}
                    <span className="font-semibold">{results.score.total}</span> questions correct
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {results.results.map((result) => (
                <div
                  key={result.question_number}
                  className={`border rounded-lg p-4 ${
                    result.is_correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-base font-medium text-gray-900">
                        Question {result.question_number}: {result.question}
                      </p>
                      {result.is_correct ? (
                        <span className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="ml-4 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                          ✗ Incorrect
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 ml-4">
                      {Object.entries(result.options).map(([option, text]) => {
                        const isUserAnswer = result.user_answer === option;
                        const isCorrectAnswer = result.correct_answer === option;
                        let bgColor = 'bg-white';
                        let borderColor = 'border-gray-200';
                        
                        if (isCorrectAnswer) {
                          bgColor = 'bg-green-100';
                          borderColor = 'border-green-300';
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          bgColor = 'bg-red-100';
                          borderColor = 'border-red-300';
                        }
                        
                        return (
                          <div
                            key={option}
                            className={`p-2 rounded border ${bgColor} ${borderColor}`}
                          >
                            <span className="font-medium">{option})</span> {text}
                            {isUserAnswer && (
                              <span className="ml-2 text-xs font-semibold text-gray-600">
                                (Your answer)
                              </span>
                            )}
                            {isCorrectAnswer && !isUserAnswer && (
                              <span className="ml-2 text-xs font-semibold text-green-700">
                                (Correct answer)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {result.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                      <p className="text-sm text-blue-800">{result.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Take Another Quiz
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateMcq;
