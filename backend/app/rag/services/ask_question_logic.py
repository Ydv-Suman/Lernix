from app.rag.services.document_processing import *

def classify_question_style(question: str) -> str:
    normalized = question.strip().lower()
    simple_starters = (
        "what is",
        "what's",
        "define",
        "who is",
        "when is",
        "where is",
    )

    if len(normalized.split()) <= 6 or normalized.startswith(simple_starters):
        return (
            "This is a simple question. Answer directly in 1 to 3 sentences. "
            "Start with the definition or fact. Do not add extra background unless needed."
        )

    if any(term in normalized for term in ("compare", "difference", "advantages", "disadvantages", "steps", "why", "how")):
        return (
            "This is a broader question. Give a structured answer with short paragraphs or bullets. "
            "Include only the most relevant supporting points from the context."
        )

    return (
        "Answer clearly and efficiently. Start with the direct answer, then add brief supporting detail only if it helps."
    )


def ask_question_rag_chain(retriever):
    prompt_text = """You are a helpful learning assistant. Answer the question accurately based ONLY on the provided context. If the context does not contain enough information to answer, say so clearly rather than guessing.

Response rules:
- Start with the direct answer in the first sentence.
- Follow the requested answer style exactly.
- Do not add generic introductions, filler, or a closing summary unless the user explicitly asks for it.
- Use examples only when they materially help answer the question.

Context:
{context}

Question: {input}

Answer style:
{answer_style}

Answer:"""

    prompt = PromptTemplate.from_template(prompt_text)
    
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.1
    )

    document_chain = create_stuff_documents_chain(
        llm=llm,
        prompt=prompt
    )

    return create_retrieval_chain(
        retriever=retriever,
        combine_docs_chain=document_chain
    )

def ask_question(text: str, question: str) -> str:
    chunks = chunk_text(text)
    docs = convert_to_document(chunks)
    retriever = create_retriever(docs)
    rag_chain = ask_question_rag_chain(retriever)
    answer_style = classify_question_style(question)

    response = rag_chain.invoke({
        "input": question,
        "answer_style": answer_style
    })
    return response["answer"]
