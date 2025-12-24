from app.ai.services.document_processing import *;


def build_mcq_chain(retriever, num_questions: int = 5, difficulty: str = "medium"):
    prompt_text = f"""Based on the following content, generate {num_questions} multiple choice questions.

    Requirements:
    - Difficulty level: {difficulty}
    - Each question should have 4 answer choices (A, B, C, D)
    - Indicate the correct answer
    - Questions should cover different topics from the content
    - Avoid yes/no questions
    
    Format each question as:
    Question X: [question text]
    A) [option A]
    B) [option B]
    C) [option C]
    D) [option D]
    Correct Answer: [letter]
    Explanation: [brief explanation]

    Content:
    {{context}}
    """
    
    prompt = PromptTemplate.from_template(prompt_text)

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7
    )

    document_chain = create_stuff_documents_chain(
        llm=llm,
        prompt=prompt
    )

    return create_retrieval_chain(
        retriever=retriever,
        combine_docs_chain=document_chain
    )

def generate_mcqs(text: str, num_questions: int = 5, difficulty: str = "medium") -> str:
    chunks = chunk_text(text, chunk_size=800, overlap=100)
    docs = convert_to_document(chunks)
    retriever = create_retriever(docs)
    mcq_chain = build_mcq_chain(retriever, num_questions, difficulty)

    result = mcq_chain.invoke({
        "input": "Generate multiple choice questions from the document"
    })

    # Format the output
    formatted_result = format_mcqs_detailed(result["answer"])
    
    return formatted_result