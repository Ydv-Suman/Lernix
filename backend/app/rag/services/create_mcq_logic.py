from app.rag.services.document_processing import *
import re
import json



# 4. format the result
def format_mcqs_detailed(text: str) -> str:
    """
    Ensure each question starts on a new line with proper spacing
    """
    # Normalize line endings
    text = text.replace("\r\n", "\n").strip()

    # Ensure a blank line before every Question except the first
    text = text.replace("\nQuestion", "\n\nQuestion")

    return text

def parse_mcq_string(mcq_string: str) -> list:
    """
    Parse the MCQ string into structured JSON format.
    Returns a list of question objects with question, options, correct_answer, and explanation.
    """
    questions = []
    
    # Split the string by "Question X:" to get individual questions
    # Pattern to match: Question X: ... (until next Question or end)
    question_blocks = re.split(r'\n\nQuestion\s+\d+:', mcq_string, flags=re.IGNORECASE)
    
    # Handle first question (might not have leading newlines)
    if not question_blocks[0].strip().startswith('Question'):
        # First block might be empty or have content before first question
        first_question_match = re.search(r'Question\s+(\d+):\s*(.*)', question_blocks[0], re.DOTALL | re.IGNORECASE)
        if first_question_match:
            question_blocks[0] = first_question_match.group(2)
            question_num = int(first_question_match.group(1))
        else:
            question_blocks = question_blocks[1:]  # Skip if no match
    else:
        question_num = 1
    
    for idx, block in enumerate(question_blocks):
        if not block.strip():
            continue
            
        # Extract question number (if not already set)
        if idx > 0 or not question_num:
            num_match = re.search(r'Question\s+(\d+):\s*', block, re.IGNORECASE)
            if num_match:
                question_num = int(num_match.group(1))
                block = re.sub(r'Question\s+\d+:\s*', '', block, count=1, flags=re.IGNORECASE)
        
        # Extract question text (before first option)
        question_text = ""
        options = {}
        correct_answer = None
        explanation = None
        
        # Find the first option to separate question text
        first_option_match = re.search(r'([A-D])\)\s*', block, re.IGNORECASE)
        if first_option_match:
            question_text = block[:first_option_match.start()].strip()
            block_after_question = block[first_option_match.start():]
        else:
            continue  # Skip if no options found
        
        # Extract all options
        option_pattern = r'([A-D])\)\s*(.*?)(?=\n\s*[A-D]\)|Correct Answer:|Explanation:|$)'
        option_matches = re.finditer(option_pattern, block_after_question, re.DOTALL | re.IGNORECASE)
        
        for opt_match in option_matches:
            option_letter = opt_match.group(1).upper()
            option_text = opt_match.group(2).strip()
            # Clean up option text (remove trailing newlines and extra spaces)
            option_text = re.sub(r'\s+', ' ', option_text).strip()
            options[option_letter] = option_text
        
        # Extract correct answer (look for "Correct Answer: X" - more flexible pattern)
        correct_answer_match = re.search(r'Correct Answer:\s*([A-Da-d])', block, re.IGNORECASE)
        if correct_answer_match:
            correct_answer = correct_answer_match.group(1).upper().strip()
        else:
            # Try alternative patterns
            alt_match = re.search(r'Correct Answer[:\s]+([A-Da-d])', block, re.IGNORECASE)
            if alt_match:
                correct_answer = alt_match.group(1).upper().strip()
            else:
                correct_answer = None
        
        # Extract explanation (everything after "Explanation:")
        explanation_match = re.search(r'Explanation:\s*(.*?)(?=\n\n|$)', block, re.DOTALL | re.IGNORECASE)
        if explanation_match:
            explanation = explanation_match.group(1).strip()
            # Clean up explanation
            explanation = re.sub(r'\s+', ' ', explanation).strip()
        
        if question_text and options and len(options) > 0:
            # Ensure correct_answer is set (should be one of the option keys if not found)
            if not correct_answer and options:
                # If correct answer not found, try to infer from context or use first option as fallback
                # This shouldn't happen in normal cases, but provides a fallback
                correct_answer = list(options.keys())[0] if options else None
            
            questions.append({
                "question_number": question_num,
                "question": question_text,
                "options": options,
                "correct_answer": correct_answer.upper() if correct_answer else None,
                "explanation": explanation
            })
        
        question_num += 1
    
    return questions

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