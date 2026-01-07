from fastapi import HTTPException
import boto3
from botocore.exceptions import ClientError
import PyPDF2
import docx
from io import BytesIO

import os
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)


def upload_file_to_s3(file_content: bytes, file_name: str, folder: str = "chapter_files") -> str:
    """
    Upload file to S3 and return the file path/key
    """
    try:
        # Create unique file path
        file_key = f"{folder}/{file_name}"
        
        # Upload file to S3
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_key,
            Body=file_content
        )
        
        # Return the S3 file path
        return file_key
    
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file to S3: {str(e)}")


def delete_file_from_s3(file_key: str) -> bool:
    """
    Delete file from S3
    """
    try:
        s3_client.delete_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_key
        )
        return True
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file from S3: {str(e)}")


def get_file_from_s3(file_key: str):
    """
    Get file from S3
    """
    try:
        response = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_key
        )
        return response['Body'].read()
    except ClientError as e:
        raise HTTPException(status_code=404, detail=f"File not found in S3: {str(e)}")
    

# RAG support
def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    elif filename.lower().endswith(".docx"):
        document = docx.Document(BytesIO(file_bytes))
        return "\n".join(p.text for p in document.paragraphs if p.text.strip())

    elif filename.lower().endswith(".txt"):
        return file_bytes.decode("utf-8")

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )


def get_text_from_s3(file_key: str) -> str:
    file_bytes = get_file_from_s3(file_key)
    return extract_text_from_bytes(file_bytes, file_key)