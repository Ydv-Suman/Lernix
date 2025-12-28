from app.rag.services.document_processing import *

# 4. Build RAG Chain
def build_rag_chain(retriever):
    prompt = PromptTemplate.from_template(
        """Summarize the following content clearly and concisely:

        {context}
        """
    )

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.4
    )

    document_chain = create_stuff_documents_chain(
        llm=llm,
        prompt=prompt
    )

    return create_retrieval_chain(
        retriever=retriever,
        combine_docs_chain=document_chain
    )

def format_mcqs_detailed(text: str) -> str:
    """
    Ensure each question starts on a new line with proper spacing
    """
    # Normalize line endings
    text = text.replace("\r\n", "\n").strip()

    # Ensure a blank line before every Question except the first
    text = text.replace("\nQuestion", "\n\nQuestion")

    return text


# 5. Main Entry Function (USED BY FASTAPI)
def summarize_text(text: str) -> str:
    chunks = chunk_text(text)
    docs = convert_to_document(chunks)
    retriever = create_retriever(docs)
    rag_chain = build_rag_chain(retriever)

    result = rag_chain.invoke({
        "input": "Summarize the document"
    })

    # Format the output
    formatted_result = format_mcqs_detailed(result["answer"])
    
    return formatted_result
