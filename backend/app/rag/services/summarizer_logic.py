import re

from app.rag.services.document_processing import *

# 4. Build RAG Chain
def build_rag_chain(retriever):
    prompt = PromptTemplate.from_template(
        """You are a learning assistant. Provide a comprehensive yet concise summary of the following educational content.

Write the response as clean plain text only.
- Do not use Markdown headings such as #, ##, or ###.
- Do not use bold markers such as **.
- Keep the summary readable with short paragraphs or simple numbered points.
- Cover key concepts, main points, and important supporting details or examples.

Content:
{context}

Summary:"""
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

def format_summary_output(text: str) -> str:
    """Normalize summary output and strip markdown-style formatting."""
    text = text.replace("\r\n", "\n").strip()

    lines = []
    for raw_line in text.split("\n"):
        line = raw_line.strip()

        # Remove markdown heading markers like #, ##, ###
        line = re.sub(r"^#{1,6}\s*", "", line)

        # Remove bold/italic markdown markers while keeping the text
        line = re.sub(r"[*_]{1,3}", "", line)

        # Normalize bullet glyphs to a simple hyphen
        line = re.sub(r"^[\-\*\u2022]\s*", "- ", line)

        # Collapse repeated internal whitespace without removing line breaks
        line = re.sub(r"[ \t]+", " ", line).strip()
        lines.append(line)

    cleaned_text = "\n".join(lines)

    # Remove excessive blank lines
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text).strip()

    return cleaned_text


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
    formatted_result = format_summary_output(result["answer"])
    
    return formatted_result
