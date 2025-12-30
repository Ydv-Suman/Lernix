import NavBar from './NavBar';

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Lernix</h1>
          <p className="text-xl text-gray-600">
            Your AI-Powered Learning Assistant
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What is Lernix?</h2>
            <p className="text-gray-700 leading-relaxed">
              Lernix is an AI-powered learning platform designed to help students organize course material, 
              upload study resources, and leverage artificial intelligence to enhance their learning experience. 
              Whether you need to summarize lengthy documents, generate practice questions, or get instant answers 
              from your study materials, Lernix provides the tools to make studying more efficient and effective.
            </p>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Course Management */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">📚</span>
                  <h3 className="text-xl font-semibold text-gray-900">Course & Chapter Management</h3>
                </div>
                <p className="text-gray-600">
                  Organize your studies by creating courses and chapters. Structure your learning materials 
                  in a way that makes sense for your academic journey.
                </p>
              </div>

              {/* File Management */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">📂</span>
                  <h3 className="text-xl font-semibold text-gray-900">File Management</h3>
                </div>
                <p className="text-gray-600">
                  Upload PDF, DOCX, and TXT files to your chapters. View file content directly in the browser, 
                  and manage your documents with ease. All files are securely stored in the cloud.
                </p>
              </div>

              {/* AI Summarization */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🤖</span>
                  <h3 className="text-xl font-semibold text-gray-900">AI Summarization</h3>
                </div>
                <p className="text-gray-600">
                  Get instant AI-generated summaries of your study materials. Save time by quickly understanding 
                  the key points from lengthy documents.
                </p>
              </div>

              {/* MCQ Generation */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">❓</span>
                  <h3 className="text-xl font-semibold text-gray-900">MCQ Generation</h3>
                </div>
                <p className="text-gray-600">
                  Automatically generate multiple-choice questions from your uploaded materials. Practice and 
                  test your understanding with AI-created questions tailored to your content.
                </p>
              </div>

              {/* Ask Questions */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">💬</span>
                  <h3 className="text-xl font-semibold text-gray-900">Ask Questions</h3>
                </div>
                <p className="text-gray-600">
                  Get instant answers to your questions from your study materials. Our AI-powered Q&A system 
                  helps you understand concepts and find information quickly.
                </p>
              </div>

              {/* Learning Insights */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">📊</span>
                  <h3 className="text-xl font-semibold text-gray-900">Learning Insights</h3>
                </div>
                <p className="text-gray-600">
                  Track your learning progress with detailed analytics. Monitor time spent on courses, 
                  view activity summaries, and analyze your MCQ performance.
                </p>
              </div>
            </div>
          </section>
          

          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#669694] shadow-sm text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Create Your Courses</h3>
                  <p className="text-gray-600">Organize your studies by creating courses and adding chapters to structure your learning materials.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#669694] shadow-sm text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Upload Your Files</h3>
                  <p className="text-gray-600">Upload PDF, DOCX, or TXT files to your chapters. Your files are securely stored and ready for AI processing.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#669694] shadow-sm text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Leverage AI Features</h3>
                  <p className="text-gray-600">Use AI to summarize content, generate practice questions, or ask questions about your study materials.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#669694] shadow-sm text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Track Your Progress</h3>
                  <p className="text-gray-600">Monitor your learning journey with insights and analytics to understand your study patterns and performance.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[#669694] shadow-sm rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-semibold mb-4">Ready to Enhance Your Learning?</h2>
            <p className="text-indigo-100 mb-6">
              Start organizing your courses, uploading materials, and leveraging AI to make your studies more effective.
            </p>
            <a
              href="/courses"
              className="inline-block px-6 py-3 bg-white text-indigo-600 font-semibold rounded-md hover:bg-gray-100 transition-colors"
            >
              Get Started
            </a>
          </section>
        </div>
      </main>
    </div>
  );
};

export default About;

