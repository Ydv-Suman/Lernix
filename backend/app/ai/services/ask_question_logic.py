from app.ai.services.document_processing import *

def ask_question_rag_chain(retriever):
    prompt_text = """
    Answer the question based on the following context:
    
    Context:{context}
    
    Question:{input}
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

def ask_question(text: str, question: str) -> str:
    chunks = chunk_text(text)
    docs = convert_to_document(chunks)
    retriever = create_retriever(docs)
    rag_chain = ask_question_rag_chain(retriever)

    response = rag_chain.invoke({"input": question})
    return response["answer"]
