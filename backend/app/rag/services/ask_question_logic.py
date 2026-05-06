from app.rag.services.document_processing import *

def ask_question_rag_chain(retriever):
    prompt_text = """You are a helpful learning assistant. Answer the question accurately based ONLY on the provided context. If the context does not contain enough information to answer, say so clearly rather than guessing.

Context:
{context}

Question: {input}

Provide a clear, well-structured answer. Use examples from the context where relevant."""

    prompt = PromptTemplate.from_template(prompt_text)
    
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.3
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

    response = rag_chain.invoke({"input": question})
    return response["answer"]
