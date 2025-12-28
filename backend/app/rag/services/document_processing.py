from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers import EnsembleRetriever
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.retrieval import create_retrieval_chain
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key is None:
    raise EnvironmentError("OPENAI_API_KEY environment variable not set")
os.environ["OPENAI_API_KEY"] = openai_api_key
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# 1. Chunk text
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(
        separators=["\n\n", "\n", " ", ""],
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        length_function=len
    )
    return splitter.split_text(text)


# 2. Convert chunks to Documents
def convert_to_document(chunks: List[str]) -> List[Document]:
    return [Document(page_content=chunk) for chunk in chunks]


# 3. Create Hybrid Retriever
def create_retriever(docs: List[Document]):
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    dense_vectorstore = FAISS.from_documents(docs, embeddings)
    dense_retriever = dense_vectorstore.as_retriever(search_kwargs={"k": 10})

    sparse_retriever = BM25Retriever.from_documents(docs)
    sparse_retriever.k = 3

    return EnsembleRetriever(
        retrievers=[dense_retriever, sparse_retriever],
        weights=[0.7, 0.3]
    )
